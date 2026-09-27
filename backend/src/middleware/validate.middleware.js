const AppError = require("../utils/AppError");

// Support both Zod v4 issues and the older errors property.
const getIssues = (error) => error.issues || error.errors || [];

const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issues = getIssues(result.error);

      const message = issues.length
        ? issues[0].message
        : "Request validation failed";

      throw new AppError(message, 400);
    }

    req.body = result.data;

    next();
  };
};

module.exports = validate;
