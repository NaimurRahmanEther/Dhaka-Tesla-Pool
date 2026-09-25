const AppError = require("../utils/AppError");

const notFound = (req, res, next) => {
  next(new AppError(`Request not found:${req.method} ${req.originalUrl}`, 404));
};

module.exports = notFound;
