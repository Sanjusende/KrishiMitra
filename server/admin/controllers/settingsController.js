import Admin from '../models/Admin.js';
import auditService from '../services/auditService.js';
import ApiResponse from '../../utils/apiResponse.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

class SettingsController {
  /**
   * POST /api/admin/settings/change-password
   * Change current admin account password
   */
  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return ApiResponse.error(res, 'Both old password and new password are required', 400);
      }

      if (newPassword.length < 6) {
        return ApiResponse.error(res, 'New password must be at least 6 characters long', 400);
      }

      const admin = await Admin.findById(req.admin.id);
      if (!admin) {
        return ApiResponse.error(res, 'Admin account not found', 404);
      }

      const isMatch = await admin.comparePassword(oldPassword);
      if (!isMatch) {
        return ApiResponse.error(res, 'Invalid current password', 400);
      }

      admin.password = newPassword; // Will be encrypted in schema hook
      admin.refreshToken = ''; // Invalidate token to force re-auth
      await admin.save();

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'CHANGE_PASSWORD',
        module: 'SETTINGS',
        ipAddress: req.ip,
      });

      return ApiResponse.success(res, null, 'Password successfully updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/settings/users
   * Lists all admin users (Super Admin only)
   */
  async getAdminUsers(req, res, next) {
    try {
      const users = await Admin.find({}).select('-password -refreshToken').sort({ createdAt: -1 }).lean();
      return ApiResponse.success(res, users, 'Admin users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/settings/users
   * Creates a new admin account (Super Admin only)
   */
  async createAdminUser(req, res, next) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        return ApiResponse.error(res, 'Required fields: name, email, password, role', 400);
      }

      const existing = await Admin.findOne({ email: email.toLowerCase() });
      if (existing) {
        return ApiResponse.error(res, 'An admin account with this email already exists', 409);
      }

      const newAdmin = await Admin.create({
        name,
        email: email.toLowerCase(),
        password, // Will hash in pre-save hook
        role,
        active: true,
      });

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'CREATE_ADMIN_USER',
        module: 'SETTINGS',
        ipAddress: req.ip,
        details: { newAdminId: newAdmin._id, newAdminEmail: newAdmin.email, role: newAdmin.role },
      });

      return ApiResponse.success(
        res,
        {
          id: newAdmin._id,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
          active: newAdmin.active,
        },
        'Admin account created successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/settings/users/:id/toggle-status
   * Activates or deactivates an admin account (Super Admin only)
   */
  async toggleAdminStatus(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid admin ID format', 400);
      }

      if (req.admin.id.toString() === id) {
        return ApiResponse.error(res, 'You cannot deactivate your own active session', 400);
      }

      const admin = await Admin.findById(id);
      if (!admin) {
        return ApiResponse.error(res, 'Admin account not found', 404);
      }

      admin.active = !admin.active;
      if (!admin.active) {
        admin.refreshToken = ''; // Terminate session
      }
      await admin.save();

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: admin.active ? 'ACTIVATE_ADMIN_USER' : 'DEACTIVATE_ADMIN_USER',
        module: 'SETTINGS',
        ipAddress: req.ip,
        details: { targetAdminId: id, targetAdminEmail: admin.email },
      });

      return ApiResponse.success(
        res,
        { active: admin.active },
        `Admin account successfully ${admin.active ? 'activated' : 'deactivated'}`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/settings/users/:id/role
   * Changes role of an admin (Super Admin only)
   */
  async updateAdminRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC'].includes(role)) {
        return ApiResponse.error(res, 'A valid admin role is required', 400);
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid admin ID format', 400);
      }

      if (req.admin.id.toString() === id) {
        return ApiResponse.error(res, 'You cannot change your own admin role', 400);
      }

      const admin = await Admin.findById(id);
      if (!admin) {
        return ApiResponse.error(res, 'Admin account not found', 404);
      }

      const oldRole = admin.role;
      admin.role = role;
      await admin.save();

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'CHANGE_ADMIN_ROLE',
        module: 'SETTINGS',
        ipAddress: req.ip,
        details: { targetAdminId: id, oldRole, newRole: role },
      });

      return ApiResponse.success(res, { role: admin.role }, 'Admin role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/settings/users/:id
   * Deletes an admin account (Super Admin only)
   */
  async deleteAdminUser(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid admin ID format', 400);
      }

      if (req.admin.id.toString() === id) {
        return ApiResponse.error(res, 'You cannot delete your own admin account', 400);
      }

      const admin = await Admin.findById(id);
      if (!admin) {
        return ApiResponse.error(res, 'Admin account not found', 404);
      }

      await Admin.findByIdAndDelete(id);

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'DELETE_ADMIN_USER',
        module: 'SETTINGS',
        ipAddress: req.ip,
        details: { targetAdminId: id, targetAdminEmail: admin.email },
      });

      return ApiResponse.success(res, null, 'Admin account deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new SettingsController();
