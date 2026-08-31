import Admin from '../models/Admin.js';
import tokenService from '../../services/auth/tokenService.js';
import auditService from '../services/auditService.js';
import ApiResponse from '../../utils/apiResponse.js';
import env from '../../config/env.js';

/**
 * Helper to set secure, HTTP-only JWT cookies (matching farmer setup)
 */
const setTokenCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };

  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('token', accessToken, cookieOptions);

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
};

/**
 * Helper to clear JWT cookies
 */
const clearTokenCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  };
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('token', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};

/**
 * Helper to auto-seed default Super Admin if none exist in DB
 */
const ensureSuperAdminSeeded = async () => {
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    console.log('🌱 Seeding default Super Admin...');
    await Admin.create({
      name: 'KrishiMitra Super Admin',
      email: 'superadmin@krishimitra.com',
      password: 'Admin@123456', // Will be hashed via pre-save hook
      role: 'SUPER_ADMIN',
      active: true,
    });
    console.log('✅ Default Super Admin seeded: superadmin@krishimitra.com / Admin@123456');
  }
};

class AuthController {
  /**
   * POST /api/admin/auth/register
   * Registers a new admin account
   */
  async registerAdmin(req, res, next) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        return ApiResponse.error(res, 'Name, email, password and role are required', 400);
      }

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
      if (existingAdmin) {
        return ApiResponse.error(res, 'Admin account with this email already exists', 409, 'CONFLICT');
      }

      // Create new admin
      const admin = await Admin.create({
        name,
        email: email.toLowerCase(),
        password, // Will be hashed via Mongoose pre-save hook
        role,
        active: true,
      });

      // Generate credentials tokens using existing token service
      const { accessToken, refreshToken } = tokenService.generateTokens(admin);

      admin.refreshToken = refreshToken;
      admin.lastLogin = new Date();
      await admin.save();

      setTokenCookies(res, accessToken, refreshToken);

      // Audit Log
      await auditService.logAction({
        adminId: admin._id,
        adminEmail: admin.email,
        action: 'REGISTER_ADMIN',
        module: 'AUTH',
        ipAddress: req.ip,
        details: { name: admin.name, role: admin.role },
      });

      return ApiResponse.success(
        res,
        {
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
          accessToken,
          refreshToken,
        },
        'Admin account registered successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/auth/login
   * Authenticates an admin
   */
  async login(req, res, next) {
    try {
      await ensureSuperAdminSeeded();

      const { email, password } = req.body;
      if (!email || !password) {
        return ApiResponse.error(res, 'Email and password are required', 400);
      }

      const admin = await Admin.findOne({ email: email.toLowerCase() });
      if (!admin) {
        return ApiResponse.error(res, 'Invalid admin email or password', 401);
      }

      if (!admin.active) {
        return ApiResponse.error(res, 'Admin account is deactivated', 403);
      }

      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return ApiResponse.error(res, 'Invalid admin email or password', 401);
      }

      // Generate tokens using existing token service
      const { accessToken, refreshToken } = tokenService.generateTokens(admin);

      admin.refreshToken = refreshToken;
      admin.lastLogin = new Date();
      await admin.save();

      setTokenCookies(res, accessToken, refreshToken);

      // Audit Log
      await auditService.logAction({
        adminId: admin._id,
        adminEmail: admin.email,
        action: 'LOGIN',
        module: 'AUTH',
        ipAddress: req.ip,
        details: { name: admin.name, role: admin.role },
      });

      return ApiResponse.success(
        res,
        {
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
          accessToken,
          refreshToken,
        },
        'Admin login successful'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/auth/refresh
   * Rotates JWT access token via refresh token
   */
  async refresh(req, res, next) {
    try {
      let refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

      if (!refreshToken) {
        return ApiResponse.error(res, 'Refresh token is required', 400);
      }

      let decoded;
      try {
        decoded = tokenService.verifyRefreshToken(refreshToken);
      } catch (err) {
        return ApiResponse.error(res, 'Invalid or expired refresh token', 401);
      }

      const admin = await Admin.findById(decoded.id);
      if (!admin || admin.refreshToken !== refreshToken) {
        return ApiResponse.error(res, 'Invalid refresh token session', 401);
      }

      if (!admin.active) {
        return ApiResponse.error(res, 'Admin account is deactivated', 403);
      }

      const tokens = tokenService.generateTokens(admin);

      admin.refreshToken = tokens.refreshToken;
      await admin.save();

      setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

      return ApiResponse.success(
        res,
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        'Token refreshed successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/auth/logout
   * Admin logout
   */
  async logout(req, res, next) {
    try {
      let refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
      
      const adminId = req.admin?.id;
      const adminEmail = req.admin?.email;

      if (refreshToken) {
        const admin = await Admin.findOne({ refreshToken: String(refreshToken) });
        if (admin) {
          admin.refreshToken = '';
          await admin.save();
        }
      } else if (adminId) {
        const admin = await Admin.findById(adminId);
        if (admin) {
          admin.refreshToken = '';
          await admin.save();
        }
      }

      clearTokenCookies(res);

      if (adminId) {
        await auditService.logAction({
          adminId,
          adminEmail,
          action: 'LOGOUT',
          module: 'AUTH',
          ipAddress: req.ip,
        });
      }

      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/auth/me
   * Retrieve active admin profile details
   */
  async getMe(req, res, next) {
    try {
      const admin = await Admin.findById(req.admin.id).select('-password -refreshToken');
      if (!admin) {
        return ApiResponse.error(res, 'Admin profile not found', 404);
      }

      return ApiResponse.success(res, { admin }, 'Admin details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
