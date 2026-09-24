const pool = require("../../database/db");

// Get all locations

const findAllLocations = async () => {
  const result = await pool.query(
    `
        SELECT *

        FROM locations

        ORDER BY id ASC

        `,
  );

  return result.rows;
};

// Find location by id

const findLocationById = async (id) => {
  const result = await pool.query(
    `
        SELECT *

        FROM locations

        WHERE id=$1

        `,

    [id],
  );

  return result.rows[0];
};

module.exports = {
  findAllLocations,

  findLocationById,
};
