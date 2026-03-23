import { ApiError } from "../utils/apiError.js";

/**
 * Restricts access to specific roles.
 * Usage: authorize("OWNER", "ADMIN")
 */
const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' does not have permission to access this resource`
        )
      );
    }

    next();
  };
};

export default authorize;
