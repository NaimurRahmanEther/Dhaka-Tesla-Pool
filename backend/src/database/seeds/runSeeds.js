const pool = require("../db");

const seedLocations = require("./location.seed");

const seedRoadEdges = require("./roadEdge.seed");

// Reference data only. Accounts come from `POST /auth/register` and a Tesla
// from `POST /vehicle`, so nothing here creates a user.
async function runSeeds() {
  try {
    await seedLocations(pool);

    await seedRoadEdges(pool);

    console.log("Database seed completed");
  } catch (error) {
    // Surface the failure to the caller. Swallowing it here made
    // `npm run seed` report success even when it had done nothing.
    console.error("Seed failed:", error.message);

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runSeeds();
