const env = require("../config/env");

const errorHandler = (err, req, res, next) => {
  err.message = err.message || "Internal Server Error";
  err.statusCode = err.statusCode || 500;

  console.log({
    message: err.message,
    statusCode: err.statusCode,
    method: req.method,
    url: req.originalUrl,
    stack: err.stack,
  });

  const response = {
    success: false,
    message: err.message,
  };

  if (env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(err.statusCode).json(response);
};

module.exports = errorHandler;