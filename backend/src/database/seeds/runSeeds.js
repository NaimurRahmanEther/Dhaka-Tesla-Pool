const pool = require("../db");

const seedLocations = require("./location.seed");

const seedRoadEdges = require("./roadEdge.seed");

async function runSeeds() {
  try {
    await seedLocations(pool);

    await seedRoadEdges(pool);

    console.log("Database seed completed");
  } catch (error) {
    console.log(error.message);
  } finally {
    await pool.end();
  }
}

runSeeds();
