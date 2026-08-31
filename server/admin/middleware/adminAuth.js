import tokenService from '../../services/auth/tokenService.js';
import Admin from '../models/Admin.js';
import ApiResponse from '../../utils/apiResponse.js';

/**
 * Access token verification middleware for admins
 */
const adminAuth = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return ApiResponse.error(res, 'Admin authorization access token required', 401, 'UNAUTHORIZED');
    }

    let decoded;
    try {
      decoded = tokenService.verifyAccessToken(token);
    } catch (err) {
      return ApiResponse.error(res, 'Invalid or expired admin access token', 401, 'INVALID_TOKEN');
    }

    // Verify admin exists and is active
    const admin = await Admin.findById(decoded.id || decoded._id);
    if (!admin) {
      return ApiResponse.error(res, 'Admin account not found', 401, 'UNAUTHORIZED');
    }

    if (!admin.active) {
      return ApiResponse.error(res, 'Admin account is deactivated', 403, 'FORBIDDEN');
    }

    // Assign admin context to request
    req.admin = {
      id: admin._id,
      _id: admin._id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
    };

    next();
  } catch (error) {
    console.error('Admin Auth Middleware Error:', error);
    return ApiResponse.error(res, 'Authentication server error', 500, 'AUTH_SERVER_ERROR');
  }
};

export default adminAuth;
