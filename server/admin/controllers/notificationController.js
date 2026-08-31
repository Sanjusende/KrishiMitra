import AdminNotification from '../models/Notification.js';
import UserNotification from '../../models/Notification.js';
import User from '../../models/User.js';
import Farm from '../../models/Farm.js';
import auditService from '../services/auditService.js';
import ApiResponse from '../../utils/apiResponse.js';
import { escapeRegex, safeInt } from '../../utils/queryHelpers.js';

const ALLOWED_TARGET_TYPES = ['all', 'state', 'district', 'crop'];

class NotificationController {
  /**
   * GET /api/admin/notifications
   * Fetch admin notification logs
   */
  async getNotifications(req, res, next) {
    try {
      const page  = safeInt(req.query.page, 1, 1);
      const limit = safeInt(req.query.limit, 10, 1, 100);
      const skip  = (page - 1) * limit;

      const history = await AdminNotification.find({})
        .populate('senderId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await AdminNotification.countDocuments();

      return ApiResponse.success(
        res,
        {
          notifications: history,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Admin notification logs retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/notifications
   * Sends a targeted broadcast message
   */
  async sendNotification(req, res, next) {
    try {
      const { category, title, message, targetType, targetValue } = req.body;

      if (!category || !title || !message || !targetType) {
        return ApiResponse.error(res, 'Required fields: category, title, message, targetType', 400);
      }

      // Validate targetType strictly against a whitelist before using it to route query logic
      if (!ALLOWED_TARGET_TYPES.includes(targetType)) {
        return ApiResponse.error(res, 'Invalid target type. Allowed: all, state, district, crop', 400);
      }

      // 1. Identify Target Users
      let targetUserIds = [];

      // Escape targetValue to prevent RegExp injection (ReDoS / NoSQL injection)
      const escapedTarget = escapeRegex(String(targetValue || ''));

      if (targetType === 'all') {
        const farmers = await User.find({ role: { $in: ['FARMER', 'farmer'] } }).select('_id').lean();
        targetUserIds = farmers.map((f) => f._id);
      } else if (targetType === 'state') {
        const farms = await Farm.find({ 'location.state': { $regex: new RegExp(`^${escapedTarget}$`, 'i') } })
          .select('userId')
          .lean();
        // Remove duplicates
        targetUserIds = [...new Set(farms.map((f) => f.userId.toString()))];
      } else if (targetType === 'district') {
        const farms = await Farm.find({ 'location.district': { $regex: new RegExp(`^${escapedTarget}$`, 'i') } })
          .select('userId')
          .lean();
        targetUserIds = [...new Set(farms.map((f) => f.userId.toString()))];
      } else if (targetType === 'crop') {
        const farms = await Farm.find({ currentCrop: { $regex: new RegExp(`^${escapedTarget}$`, 'i') } })
          .select('userId')
          .lean();
        targetUserIds = [...new Set(farms.map((f) => f.userId.toString()))];
      }

      // Convert back to ObjectIds
      const validFarmerIds = await User.find({ _id: { $in: targetUserIds }, role: { $in: ['FARMER', 'farmer'] } }).select('_id').lean();
      const finalUserIds = validFarmerIds.map((u) => u._id);

      if (finalUserIds.length === 0) {
        return ApiResponse.error(res, 'No farmers found matching the specified targeting criteria', 400);
      }

      // Map admin categories to user-notification categories
      // Farmer categories: ['weather', 'irrigation', 'crop_health', 'community', 'market']
      let mappedCategory = 'community';
      if (category === 'weather') mappedCategory = 'weather';
      else if (category === 'market') mappedCategory = 'market';
      else if (category === 'disease') mappedCategory = 'crop_health';

      // 2. Insert User Notifications Bulk
      const notificationsToCreate = finalUserIds.map((userId) => ({
        userId,
        category: mappedCategory,
        title,
        message,
        read: false,
      }));

      await UserNotification.insertMany(notificationsToCreate);

      // 3. Log Admin Broadcast Log
      const adminLog = await AdminNotification.create({
        category,
        title,
        message,
        targetType,
        targetValue: targetValue || 'All Farmers',
        senderId: req.admin.id,
      });

      // 4. Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'SEND_NOTIFICATION',
        module: 'NOTIFICATION',
        ipAddress: req.ip,
        details: {
          broadcastId: adminLog._id,
          targetType,
          targetValue,
          reachCount: finalUserIds.length,
        },
      });

      return ApiResponse.success(
        res,
        {
          broadcastId: adminLog._id,
          recipientsCount: finalUserIds.length,
        },
        `Broadcast sent successfully to ${finalUserIds.length} farmers`,
        201
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
