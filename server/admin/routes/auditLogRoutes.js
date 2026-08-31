import express from 'express';
import auditLogController from '../controllers/auditLogController.js';
import adminAuth from '../middleware/adminAuth.js';
import { checkRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(adminAuth);

router.get('/', checkRole(['SUPER_ADMIN', 'ADMIN']), auditLogController.getAuditLogs);

export default router;
