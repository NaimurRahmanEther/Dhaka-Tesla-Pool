const pool = require("../../database/db");


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
