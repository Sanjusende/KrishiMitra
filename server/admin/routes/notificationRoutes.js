import express from 'express';
import notificationController from '../controllers/notificationController.js';
import adminAuth from '../middleware/adminAuth.js';
import { checkRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(adminAuth);

router.get('/', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC']), notificationController.getNotifications);
router.post('/', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT']), notificationController.sendNotification);

export default router;
