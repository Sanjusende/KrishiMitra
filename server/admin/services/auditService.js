import AuditLog from '../models/AuditLog.js';

class AuditService {
  /**
   * Log an admin action to the database
   * @param {Object} params
   * @param {string} params.adminId - ObjectId of the admin
   * @param {string} params.adminEmail - Email of the admin
   * @param {string} params.action - Action performed (e.g. 'LOGIN', 'SUSPEND_FARMER')
   * @param {string} params.module - Module targeted (e.g. 'AUTH', 'FARMER')
   * @param {string} params.ipAddress - Client IP address
   * @param {Object} [params.details] - Optional extra metadata
   */
  async logAction({ adminId, adminEmail, action, module, ipAddress, details = null }) {
    try {
      await AuditLog.create({
        adminId: adminId || null,
        adminEmail: adminEmail || 'system',
        action,
        module,
        ipAddress: ipAddress || '',
        details,
      });
    } catch (error) {
      console.error('🚨 Audit Log Insertion Failed:', error.message);
    }
  }
}

export default new AuditService();
