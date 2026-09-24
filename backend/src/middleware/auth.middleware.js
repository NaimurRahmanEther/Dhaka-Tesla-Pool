const jwt = require("jsonwebtoken");

const env = require("../config/env");

const pool = require("../database/db");
const repository=require('../modules/auth/auth.repository')

const AppError = require("../utils/AppError");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError("Access token required", 401);
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new AppError("Invalid authorization format", 401);
    }

    // Check blacklist

    const blacklisted = await repository.isTokenBlacklisted(token)

    if (blacklisted.rows.length > 0) {
      throw new AppError("Token has been revoked", 401);
    }

    // Verify access token

    const decoded = jwt.verify(
      token,

      env.JWT_ACCESS_SECRET,
    );

    req.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
