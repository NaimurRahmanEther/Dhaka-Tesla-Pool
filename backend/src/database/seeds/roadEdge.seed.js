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
  // Alternative route
  {
    from: "Mohakhali",
    to: "Bashundhara",
    distance: 6,
  },
  {
    from: "Bashundhara",
    to: "Uttara",
    distance: 8,
  },
  // Mirpur branch
  {
    from: "Mohakhali",
    to: "Mirpur",
    distance: 7,
  },
  {
    from: "Mirpur",
    to: "Dhanmondi",
    distance: 8,
  },
  // Extra connectivity
  {
    from: "Gulshan",
    to: "Bashundhara",
    distance: 4,
  },
  {
    from: "Farmgate",
    to: "Mirpur",
    distance: 9,
  },
];

async function seedRoadEdges(pool) {
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

    if (!fromLocation.rows.length || !toLocation.rows.length) {
      console.log("Location missing:", edge);

      continue;
    }

    // Check first: `road_edges` has no unique constraint, so `ON CONFLICT`
    // would never fire and every re-run would duplicate the graph.
    const existing = await pool.query(
      `
        SELECT 1
        FROM road_edges
        WHERE from_location_id=$1
        AND to_location_id=$2
      `,
      [fromLocation.rows[0].id, toLocation.rows[0].id],
    );

    if (existing.rows.length) {
      continue;
    }

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
}

module.exports = seedRoadEdges;
