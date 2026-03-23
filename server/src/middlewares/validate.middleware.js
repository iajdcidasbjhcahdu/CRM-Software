import { ApiError } from "../utils/apiError.js";

/**
 * Validates request body/query/params against a Zod schema.
 * Usage: validate(loginSchema)
 */
const validate = (schema) => {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(ApiError.badRequest("Validation failed", errors));
    }

    // Replace req data with parsed (cleaned) values
    req.body = result.data.body ?? req.body;
    req.query = result.data.query ?? req.query;
    req.params = result.data.params ?? req.params;

    next();
  };
};

export default validate;
