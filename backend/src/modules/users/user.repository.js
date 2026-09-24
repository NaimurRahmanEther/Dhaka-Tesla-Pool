const pool = require("../../database/db");

const findUserById = async (id) => {
  const result = await pool.query(
    `
        SELECT
            id,
            name,
            email,
            role,
            created_at

        FROM users

        WHERE id=$1
        `,

    [id],
  );

  return result.rows[0];
};

const updateUser = async (id, { name, email }) => {
  const result = await pool.query(
    `
        UPDATE users

        SET
            name=$1,
            email=$2

        WHERE id=$3


        RETURNING

            id,
            name,
            email,
            role,
            created_at

        `,

    [name, email, id],
  );

  return result.rows[0];
};

module.exports = {
  findUserById,

  updateUser,
};
