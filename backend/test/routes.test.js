const { test, mock, afterEach } = require("node:test");
const assert = require("node:assert/strict");

// Exercise real Dijkstra and route planning without requiring a database server.
const dbPath = require.resolve("../src/database/db");
const db = { query: async () => { throw new Error("Unexpected database query"); }, connect: async () => {} };
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: db };
const graphRepository = require("../src/modules/graph/graph.repository");
const graph = require("../src/modules/graph/graph.service");
const optimizer = require("../src/modules/pools/pooling.route.optimizer");
const routes = require("../src/modules/routes/routes.repository");
const routeService = require("../src/modules/routes/route.service");
const matching = require("../src/modules/matching/matching.service");
const matchingRepository = require("../src/modules/matching/matching.repository");

afterEach(() => mock.restoreAll());
function firstPassengerSetup() {
  roadGraph();
  const vehicle = { vehicle_id: 1, driver_id: 7, current_location_id: 1, status: "ONLINE", capacity: 4 };
  const ride = { id: 20, pickup_location_id: 2, destination_location_id: 9, seats_requested: 1 };
  mock.method(matchingRepository, "findVehicleByDriverId", async () => vehicle);
  mock.method(matchingRepository, "findActivePoolByVehicleId", async () => null);
  mock.method(matchingRepository, "findOpenRequests", async () => [ride]);
  mock.method(routes, "findAvailableRoute", async () => ({ start_location_id: 1, destination_location_id: 4, route: { path: [1, 2, 3, 4], distance: 3 } }));
  mock.method(matchingRepository, "updateRideFare", async () => {});
  return { vehicle, ride };
}

test("first passenger outside the planned route requires an explicit route change", async () => {
  const { vehicle, ride } = firstPassengerSetup();
  const [request] = await matching.listOpenRequests(7);
  assert.equal(request.detourAcceptable, false);
  assert.equal(request.canChangeRoute, true);
  assert.deepEqual(request.replacementRoute.path, [1, 2, 9]);
  await assert.rejects(matching.acceptRide(ride, 7), /too far/);
  mock.method(matchingRepository, "assignRideToPool", async ({ buildRoute, replaceDriverRoute }) => {
    assert.equal(replaceDriverRoute, true);
    return { pool: { current_route: await buildRoute(vehicle, null) } };
  });
  const result = await matching.acceptRide(ride, 7, { changeRoute: true });
  assert.equal(result.routeChanged, true);
  assert.deepEqual(result.route.path, [1, 2, 9]);
  assert.equal(result.route.driverDestinationId, 9);
});

test("a route change cannot overwrite a passenger accepted while the board was open", async () => {
  const { vehicle, ride } = firstPassengerSetup();
  mock.method(matchingRepository, "assignRideToPool", async ({ buildRoute }) => {
    return buildRoute(vehicle, { id: 1, current_route: { path: [1, 2, 3, 4], distance: 3 } });
  });
  await assert.rejects(matching.acceptRide(ride, 7, { changeRoute: true }), /only before accepting your first passenger/);
});

test("later passengers cannot bypass the shared route's detour limit", async () => {
  const { ride } = firstPassengerSetup();
  mock.method(matchingRepository, "findActivePoolByVehicleId", async () => ({ id: 1, current_route: { path: [1, 2, 3, 4], distance: 3, driverDestinationId: 4 } }));
  mock.method(matchingRepository, "getPoolRides", async () => [{ seats_allocated: 1 }]);
  assert.equal((await matching.listOpenRequests(7))[0].canChangeRoute, false);
  await assert.rejects(matching.acceptRide(ride, 7), /too far/);
  await assert.rejects(matching.acceptRide(ride, 7, { changeRoute: true }), /only before accepting your first passenger/);
});

test("changing the first route still requires enough seats and a reachable destination", async () => {
  const { ride } = firstPassengerSetup();
  ride.seats_requested = 5;
  assert.equal((await matching.listOpenRequests(7))[0].canChangeRoute, false);
  await assert.rejects(matching.acceptRide(ride, 7, { changeRoute: true }), /Not enough seats/);
  ride.seats_requested = 1;
  ride.destination_location_id = 99;
  assert.equal((await matching.listOpenRequests(7))[0].canChangeRoute, false);
  await assert.rejects(matching.acceptRide(ride, 7, { changeRoute: true }), /No route is available/);
});
function roadGraph() {
  mock.method(graphRepository, "getRoadEdges", async () => [
    { from_location_id: 1, to_location_id: 2, distance_km: 1 },
    { from_location_id: 2, to_location_id: 3, distance_km: 1 },
    { from_location_id: 3, to_location_id: 4, distance_km: 1 },
    { from_location_id: 2, to_location_id: 5, distance_km: 2 },
    { from_location_id: 2, to_location_id: 9, distance_km: 10 },
  ]);
}

test("Dijkstra expands intermediate locations without duplicate leg boundaries", async () => {
  roadGraph();
  assert.deepEqual(await graph.calculateRoutePath([1, 3, 4]), { path: [1, 2, 3, 4], distance: 3 });
  assert.equal(await graph.calculateRoutePath([1, 99]), null);
});

test("adding a passenger preserves the driver's starting point and final destination", async () => {
  roadGraph();
  const result = await optimizer.findBestRoute({ currentRoute: [2, 4], pickup: 1, destination: 3, keepDestination: true });
  assert.deepEqual(result.route, [2, 1, 3, 4]);
  assert.deepEqual(result.path, [2, 1, 2, 3, 4]);
  assert.equal(result.distance, 4);
});

test("shared endpoints do not add duplicate stops and the full road path is retained", async () => {
  roadGraph();
  const result = await optimizer.findBestRoute({ currentRoute: [1, 4], pickup: 1, destination: 4, keepDestination: true });
  assert.deepEqual(result.route, [1, 4]);
  assert.deepEqual(result.path, [1, 2, 3, 4]);
  assert.equal(result.distance, 3);
});

test("a second pickup is inserted before its drop-off without losing existing stops", async () => {
  roadGraph();
  const result = await optimizer.findBestRoute({ currentRoute: [1, 3, 4], pickup: 3, destination: 2, keepDestination: true });
  assert.equal(result.route[0], 1);
  assert.equal(result.route.at(-1), 4);
  assert.ok(result.route.indexOf(3) < result.route.lastIndexOf(2));
});

test("unreachable routes fail and detour enforcement retains the 2 km limit", async () => {
  roadGraph();
  assert.equal(await optimizer.findBestRoute({ currentRoute: [1, 4], pickup: 99, destination: 4 }), null);
  const result = await optimizer.findBestRoute({ currentRoute: [1, 4], pickup: 9, destination: 4, keepDestination: true });
  assert.equal(optimizer.isDetourAcceptable(3, result.distance), false);
  assert.equal(optimizer.isDetourAcceptable(3, 5), true);
  assert.equal(optimizer.isDetourAcceptable(3, 5.01), false);
});

test("manual planning uses the selected current location and rejects equal endpoints", async () => {
  roadGraph();
  mock.method(routes, "findDriverLocation", async () => ({ current_location_id: 1 }));
  mock.method(routes, "createDriverRoute", async (value) => value);
  const result = await routeService.createRoute(7, { currentLocationId: 2, destinationLocationId: 4 });
  assert.equal(result.startLocationId, 2);
  assert.deepEqual(result.route.path, [2, 3, 4]);
  await assert.rejects(routeService.createRoute(7, { currentLocationId: 2, destinationLocationId: 2 }), /different/);
});

test("manual location and route save commit together, while active trips reject changes", async () => {
  const statements = [];
  let active = false;
  const client = {
    query: async (sql) => {
      statements.push(sql);
      if (sql.includes("SELECT id FROM pools")) return { rows: active ? [{ id: 1 }] : [] };
      return { rows: [{ id: 10 }] };
    },
    release: () => {},
  };
  mock.method(db, "connect", async () => client);
  const input = { driverId: 7, startLocationId: 1, destinationLocationId: 4, route: { path: [1, 2, 3, 4], distance: 3 } };
  await routes.createDriverRoute(input);
  assert.ok(statements.some((sql) => sql.startsWith("UPDATE vehicles")));
  assert.equal(statements.at(-1), "COMMIT");
  statements.length = 0;
  active = true;
  await assert.rejects(routes.createDriverRoute(input), /Complete your active trip/);
  assert.equal(statements.at(-1), "ROLLBACK");
  assert.equal(statements.some((sql) => sql.startsWith("UPDATE vehicles")), false);
});

test("matching uses the saved destination and recalculates against the locked pool", async () => {
  roadGraph();
  const vehicle = { vehicle_id: 1, driver_id: 7, current_location_id: 1, status: "ONLINE", capacity: 4 };
  mock.method(matchingRepository, "findVehicleByDriverId", async () => vehicle);
  mock.method(matchingRepository, "findActivePoolByVehicleId", async () => null);
  mock.method(routes, "findAvailableRoute", async () => ({ start_location_id: 1, destination_location_id: 4, route: { path: [1, 2, 3, 4], distance: 3 } }));
  mock.method(matchingRepository, "updateRideFare", async () => {});
  mock.method(matchingRepository, "assignRideToPool", async ({ route, buildRoute }) => {
    assert.equal(route.path.at(-1), 4);
    // Another passenger was accepted after the request list was loaded.
    const current_route = { stops: [1, 5, 4], path: [1, 2, 5, 2, 3, 4], distance: 7, driverDestinationId: 4 };
    const updated = await buildRoute(vehicle, { current_route });
    assert.ok(updated.stops.includes(5));
    assert.equal(updated.path.at(-1), 4);
    return { pool: { current_route: updated } };
  });
  const result = await matching.acceptRide({ id: 20, pickup_location_id: 2, destination_location_id: 3, seats_requested: 1 }, 7);
  assert.ok(result.route.path.includes(5));
  assert.equal(result.route.driverDestinationId, 4);
});
