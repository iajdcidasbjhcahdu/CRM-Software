import { ApiError } from "../utils/apiError.js";
import config from "../config/index.js";

/**
 * Global error handler middleware.
 * Must be registered last in Express.
 */
const errorHandler = (err, _req, res, _next) => {
  let error = err;

  // Wrap non-operational errors
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal server error";
    error = new ApiError(statusCode, message);
  }

  const response = {
    success: false,
    message: error.message,
  };

  // Include error details in development
  if (config.env === "development") {
    response.errors = error.errors;
    response.stack = err.stack;
  }

  if (error.errors?.length) {
    response.errors = error.errors;
  }

  console.error(`[ERROR] ${error.statusCode} - ${error.message}`);
  if (config.env === "development" && err.stack) {
    console.error(err.stack);
  }

  res.status(error.statusCode).json(response);
};

/**
 * 404 handler for unknown routes.
 */
const notFoundHandler = (req, _res, next) => {

  // Redirect to / route
  // if (req.url.startsWith("/api")) {
  //   return next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
  // }

  _res.redirect("/");
};

export { errorHandler, notFoundHandler };
