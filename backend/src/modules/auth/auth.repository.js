const pool = require("../../database/db");

const createUser = async ({ name, email, password, role }) => {
  const result = await pool.query(
    `
      INSERT INTO users
      (
          name,
          email,
          password_hash,
          role
      )
      VALUES($1,$2,$3,$4)
      RETURNING
          id,
          name,
          email,
          role,
          created_at
    `,
    [name, email, password, role],
  );

  return result.rows[0];
};

// Case-insensitive on purpose, so `Jashim@x.com` cannot slip past the
// "Email already exists" check and fail on the unique index as a 500.
const findUserByEmail = async (email) => {
  const result = await pool.query(
    `
      SELECT
          id,
          name,
          email,
          password_hash,
          role,
          created_at
      FROM users
      WHERE LOWER(email)=LOWER($1)
    `,
    [email],
  );

  return result.rows[0];
};

const saveRefreshToken = async ({ userId, token, expiresAt }) => {
  const result = await pool.query(
    `
      INSERT INTO refresh_tokens
      (
          user_id,
          token,
          expires_at
      )
      VALUES($1,$2,$3)
      RETURNING *
    `,
    [userId, token, expiresAt],
  );

  return result.rows[0];
};

const findRefreshToken = async (token) => {
  const result = await pool.query(
    `
      SELECT *
      FROM refresh_tokens
      WHERE token=$1
    `,
    [token],
  );

  return result.rows[0];
};

const deleteRefreshToken = async (token) => {
  await pool.query(
    `
      DELETE FROM refresh_tokens
      WHERE token=$1
    `,
    [token],
  );
};

const addBlacklistToken = async ({ token, expiresAt }) => {
  const result = await pool.query(
    `
      INSERT INTO token_blacklist
      (
          token,
          expires_at
      )
      VALUES($1,$2)
      ON CONFLICT(token)
      DO NOTHING
      RETURNING *
    `,
    [token, expiresAt],
  );

  return result.rows[0];
};

const isTokenBlacklisted = async (token) => {
  const result = await pool.query(
    `
      SELECT id
      FROM token_blacklist
      WHERE token=$1
    `,
    [token],
  );

  return result.rows.length > 0;
};

module.exports = {
  createUser,
  findUserByEmail,
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  addBlacklistToken,
  isTokenBlacklisted,
};
