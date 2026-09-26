const jwt = require("jsonwebtoken");
const env = require("../../config/env");
const bcrypt = require("bcrypt");

const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_EXPIRE || "15m",
    },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      // The role is carried here too: the refresh flow mints a new access token
      // from this payload, and a token without a role fails the role middleware.
      role: user.role,
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_EXPIRE || "7d",
    },
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
