// Optional integration check: uses an isolated temporary schema, then removes it.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const env = require("../src/config/env");

async function main() {
  const config = {
    host: env.DATABASE.HOST, port: env.DATABASE.PORT,
    database: env.DATABASE.NAME, user: env.DATABASE.USER, password: env.DATABASE.PASSWORD,
    connectionTimeoutMillis: 5000,
  };
  const schema = `route_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Pool(config);
  let database;
  let server;
  let created = false;
  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    created = true;
    database = new Pool({ ...config, options: `-c search_path=${schema}` });
    const dbPath = require.resolve("../src/database/db");
    require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: database };
    const migrations = path.join(__dirname, "../src/database/migrations/up");
    for (const name of (await fs.readdir(migrations)).filter((name) => name.endsWith(".sql")).sort()) {
      await database.query(await fs.readFile(path.join(migrations, name), "utf8"));
    }
    await database.query("INSERT INTO locations (name) VALUES ('Banani'), ('Mohakhali'), ('Gulshan'), ('Uttara'), ('Farmgate')");
    await database.query("INSERT INTO road_edges (from_location_id, to_location_id, distance_km) VALUES (1,2,1), (2,3,1), (3,4,1), (2,5,1)");
    const users = await database.query(`INSERT INTO users (name,email,password_hash,role) VALUES
      ('Jashim','jashim@example.test','unused','DRIVER'),
      ('Nusrat','nusrat@example.test','unused','PASSENGER'),
      ('Rafiq','rafiq@example.test','unused','PASSENGER'),
      ('Shirin','shirin@example.test','unused','PASSENGER'),
      ('Farah','farah@example.test','unused','PASSENGER') RETURNING id,role`);
    const tokens = users.rows.map((user) => jwt.sign(user, env.JWT_ACCESS_SECRET, { expiresIn: "5m" }));
    const app = require("../src/app");
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
    const base = `http://127.0.0.1:${server.address().port}`;
    async function request(user, method, url, body, expected = 200) {
      const response = await fetch(base + url, {
        method, headers: { Authorization: `Bearer ${tokens[user]}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json();
      assert.equal(response.status, expected, `${method} ${url}: ${result.message}`);
      return result.data;
    }
    await request(0, "POST", "/vehicle", { model: "Bullet", capacity: 4, currentLocationId: 1 }, 201);
    await request(0, "PATCH", "/vehicle/status", { status: "ONLINE" });
    const plan = await request(0, "POST", "/driver-routes", { currentLocationId: 2, destinationLocationId: 4 }, 201);
    assert.deepEqual(plan.route.path, [2, 3, 4]);
    assert.equal((await request(0, "GET", "/vehicle/me")).current_location_id, 2);
    const rides = [];
    for (const [user, pickup, destination] of [[1, 2, 3], [2, 5, 4], [3, 1, 3], [4, 2, 4]]) {
      rides.push(await request(user, "POST", "/rides", { pickupLocationId: pickup, destinationLocationId: destination, seatsRequested: 1 }, 201));
    }
    const accepted = await request(0, "POST", `/matching/${rides[0].id}/accept`);
    const poolId = accepted.assignment.pool.id;
    assert.equal(accepted.route.path.at(-1), 4);
    await request(0, "POST", "/driver-routes", { currentLocationId: 4, destinationLocationId: 1 }, 409);
    assert.equal((await request(0, "GET", "/vehicle/me")).current_location_id, 2);
    await Promise.all([
      request(0, "POST", `/matching/${rides[1].id}/accept`),
      request(0, "POST", `/matching/${rides[2].id}/accept`),
    ]);
    const active = await request(0, "GET", "/trips/my-active");
    assert.equal(active.length, 3);
    assert.ok(active[0].current_route.path.includes(1));
    assert.ok(active[0].current_route.path.includes(5));
    assert.equal(active[0].current_route.path[0], 2);
    assert.equal(active[0].current_route.path.at(-1), 4);
    const passenger = await request(1, "GET", "/rides/my");
    assert.equal(passenger.length, 1);
    assert.deepEqual(passenger[0].trip_route, active[0].current_route);
    await request(4, "POST", `/pool/${poolId}/add-passenger`, { rideId: rides[3].id });
    await request(0, "PATCH", `/trips/${poolId}/arrive`);
    await request(0, "PATCH", `/trips/${poolId}/start`);
    await request(0, "PATCH", `/trips/${poolId}/complete`);
    assert.equal(await require("../src/modules/routes/routes.repository").findAvailableRoute(users.rows[0].id, 2), undefined);
    const next = await request(0, "POST", "/driver-routes", { currentLocationId: 4, destinationLocationId: 1 }, 201);
    assert.deepEqual(next.route.path, [4, 3, 2, 1]);
    assert.equal((await request(0, "GET", "/vehicle/me")).current_location_id, 4);
    await database.query("INSERT INTO locations (name) VALUES ('Dhanmondi'), ('Mirpur')");
    await database.query("INSERT INTO road_edges (from_location_id, to_location_id, distance_km) VALUES (2,6,10), (2,7,50)");
    const first = await request(1, "POST", "/rides", { pickupLocationId: 2, destinationLocationId: 6, seatsRequested: 1 }, 201);
    const board = await request(0, "GET", "/matching/requests");
    assert.equal(board.find((ride) => ride.id === first.id).canChangeRoute, true);
    await request(0, "POST", `/matching/${first.id}/accept`, undefined, 409);
    await request(0, "POST", `/matching/${first.id}/accept`, { changeRoute: "true" }, 400);
    const changed = await request(0, "POST", `/matching/${first.id}/accept`, { changeRoute: true });
    assert.equal(changed.routeChanged, true);
    assert.deepEqual(changed.route.path, [4, 3, 2, 6]);
    const saved = await request(0, "GET", "/driver-routes/me");
    assert.equal(saved.destination_location_id, 6);
    assert.deepEqual(saved.route, changed.route);
    const compatible = await request(2, "POST", "/rides", { pickupLocationId: 5, destinationLocationId: 6, seatsRequested: 1 }, 201);
    await request(0, "POST", `/matching/${compatible.id}/accept`);
    const distant = await request(3, "POST", "/rides", { pickupLocationId: 7, destinationLocationId: 6, seatsRequested: 1 }, 201);
    assert.equal((await request(0, "GET", "/matching/requests")).find((ride) => ride.id === distant.id).canChangeRoute, false);
    await request(0, "POST", `/matching/${distant.id}/accept`, undefined, 409);
    await request(0, "POST", `/matching/${distant.id}/accept`, { changeRoute: true }, 409);
    const unchanged = await request(0, "GET", "/driver-routes/me");
    assert.deepEqual(unchanged, saved);
    console.log("Route flow passed, including explicit first-passenger route replacement and later-passenger detour enforcement.");
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (database) await database.end();
    if (created) await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
