const AppError = require("../utils/AppError");

// Zod v4 exposes issues on `error.issues` (v3 used `error.errors`).
// Support both so the middleware does not depend on the installed minor.
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
