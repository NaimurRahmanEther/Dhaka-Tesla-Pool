require("dotenv").config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 8000,
  DATABASE: {
    HOST: process.env.DB_HOST,
    PORT: process.env.DB_PORT,
    NAME: process.env.DB_NAME,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
  },
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRE: process.env.ACCESS_TOKEN_EXPIRE,
  REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
};

// Fail fast at boot rather than deep inside the first request. A missing
// signing key would otherwise only surface as a 500 on the login route.
const REQUIRED = [
  ["DB_HOST", env.DATABASE.HOST],
  ["DB_NAME", env.DATABASE.NAME],
  ["DB_USER", env.DATABASE.USER],
  ["DB_PASSWORD", env.DATABASE.PASSWORD],
  ["JWT_ACCESS_SECRET", env.JWT_ACCESS_SECRET],
  ["JWT_REFRESH_SECRET", env.JWT_REFRESH_SECRET],
];

const missing = REQUIRED.filter(([, value]) => !value).map(([name]) => name);

if (missing.length) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}. ` +
      "Copy .env.example to .env and fill them in.",
  );
}

module.exports = env;
