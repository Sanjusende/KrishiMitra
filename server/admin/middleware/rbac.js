import ApiResponse from '../../utils/apiResponse.js';

/**
 * Middleware to restrict access based on admin roles
 * @param {Array<string>} allowedRoles - Array of roles allowed to access the route
 */
export const checkRole = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.admin) {
        return ApiResponse.error(res, 'Admin authentication context missing', 401, 'UNAUTHORIZED');
      }

      if (!allowedRoles.includes(req.admin.role)) {
        return ApiResponse.error(
          res,
          `Access Denied: Insufficient permissions for role ${req.admin.role}`,
          403,
          'ACCESS_DENIED'
        );
      }

      next();
    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      return ApiResponse.error(res, 'Role validation server error', 500, 'ROLE_SERVER_ERROR');
    }
  };
};

export default { checkRole };
