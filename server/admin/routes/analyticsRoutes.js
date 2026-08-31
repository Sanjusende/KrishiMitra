import express from 'express';
import analyticsController from '../controllers/analyticsController.js';
import adminAuth from '../middleware/adminAuth.js';
import { checkRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(adminAuth);

router.get('/dashboard', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC']), analyticsController.getDashboardSummary);
router.get('/irrigation', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT']), analyticsController.getIrrigationAnalytics);
router.get('/weather', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT']), analyticsController.getWeatherAnalytics);
router.get('/market', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC']), analyticsController.getMarketAnalytics);

export default router;
