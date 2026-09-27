const pool = require("../db");

const seedLocations = require("./location.seed");

const seedRoadEdges = require("./roadEdge.seed");

// Seed locations and roads only; register accounts and vehicles through the API.
async function runSeeds() {
  try {
    await seedLocations(pool);

    await seedRoadEdges(pool);

    console.log("Database seed completed");
  } catch (error) {
    console.error("Seed failed:", error.message);

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runSeeds();
