const pool = require("../db");

const edges = [
  {
    from: "Banani",
    to: "Gulshan",
    distance: 3,
  },

  {
    from: "Gulshan",
    to: "Mohakhali",
    distance: 5,
  },

  {
    from: "Mohakhali",
    to: "Farmgate",
    distance: 4,
  },

  {
    from: "Farmgate",
    to: "Dhanmondi",
    distance: 6,
  },

  {
    from: "Banani",
    to: "Bashundhara",
    distance: 5,
  },

  {
    from: "Bashundhara",
    to: "Uttara",
    distance: 8,
  },

  {
    from: "Mohakhali",
    to: "Mirpur",
    distance: 7,
  },
];

async function seedRoadEdges() {
  try {
    for (const edge of edges) {
      const fromLocation = await pool.query(
        `
                SELECT id
                FROM locations
                WHERE name=$1
                `,

        [edge.from],
      );

      const toLocation = await pool.query(
        `
                SELECT id
                FROM locations
                WHERE name=$1
                `,

        [edge.to],
      );

      await pool.query(
        `
                INSERT INTO road_edges
                (
                    from_location_id,
                    to_location_id,
                    distance_km
                )

                VALUES($1,$2,$3)

                `,

        [fromLocation.rows[0].id, toLocation.rows[0].id, edge.distance],
      );
    }

    console.log("Road edges seeded successfully");
  } catch (error) {
    console.error("Road edge seed failed:", error.message);
  } finally {
    await pool.end();
  }
}

seedRoadEdges();
