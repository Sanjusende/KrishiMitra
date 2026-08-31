import AuditLog from '../models/AuditLog.js';
import ApiResponse from '../../utils/apiResponse.js';
import { pickAllowed, safeInt } from '../../utils/queryHelpers.js';

const ALLOWED_AUDIT_MODULES = [
  'AUTH',
  'FARMER',
  'FARM',
  'DISEASE',
  'NOTIFICATION',
  'SCHEME',
  'TICKET',
  'REPORT',
  'SETTINGS'
];

const ALLOWED_ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'CREATE',
  'UPDATE',
  'DELETE',
  'CREATE_ADMIN',
  'UPDATE_ADMIN',
  'DELETE_ADMIN'
];

class AuditLogController {
  async getAuditLogs(req, res, next) {
    try {
      const page = safeInt(req.query.page, 1, 1);
      const limit = safeInt(req.query.limit, 20, 1, 100);
      const skip = (page - 1) * limit;

      const query = {};

      const action =
        typeof req.query.action === 'string'
          ? req.query.action.trim().toUpperCase()
          : null;

      const moduleFilter = pickAllowed(
        req.query.module,
        ALLOWED_AUDIT_MODULES
      );

      if (action && ALLOWED_ACTIONS.includes(action)) {
        query.action = action;
      }

      if (moduleFilter) {
        query.module = moduleFilter;
      }

      const logs = await AuditLog.find(query)
        .populate('adminId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await AuditLog.countDocuments(query);

      return ApiResponse.success(
        res,
        {
          logs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Audit logs retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new AuditLogController();