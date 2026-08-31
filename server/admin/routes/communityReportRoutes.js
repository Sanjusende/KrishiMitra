import express from 'express';
import communityReportController from '../controllers/communityReportController.js';
import adminAuth from '../middleware/adminAuth.js';
import { checkRole } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', adminAuth, checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC']), communityReportController.getReports);

export default router;
