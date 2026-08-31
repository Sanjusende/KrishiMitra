import express from 'express';
import reportController from '../controllers/reportController.js';
import adminAuth from '../middleware/adminAuth.js';
import { checkRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(adminAuth);

router.get('/export', checkRole(['SUPER_ADMIN', 'ADMIN', 'SUPPORT_EXEC', 'AGRI_EXPERT']), reportController.exportReport);

export default router;
