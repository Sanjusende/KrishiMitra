import express from 'express';
import settingsController from '../controllers/settingsController.js';
import adminAuth from '../middleware/adminAuth.js';
import { checkRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(adminAuth);

// General settings (all admin roles)
router.post('/change-password', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC']), settingsController.changePassword);

// Administrative users management settings (Super Admin only)
router.get('/users', checkRole(['SUPER_ADMIN']), settingsController.getAdminUsers);
router.post('/users', checkRole(['SUPER_ADMIN']), settingsController.createAdminUser);
router.patch('/users/:id/toggle-status', checkRole(['SUPER_ADMIN']), settingsController.toggleAdminStatus);
router.patch('/users/:id/role', checkRole(['SUPER_ADMIN']), settingsController.updateAdminRole);
router.delete('/users/:id', checkRole(['SUPER_ADMIN']), settingsController.deleteAdminUser);

export default router;
