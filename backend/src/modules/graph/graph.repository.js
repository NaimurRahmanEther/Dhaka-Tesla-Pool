const pool = require("../../database/db");

const getRoadEdges = async () => {
  const result = await pool.query(
    `
        SELECT

            from_location_id,

            to_location_id,

            distance_km


        FROM road_edges

        `,
  );

  return result.rows;
};

module.exports = {
  getRoadEdges,
};
