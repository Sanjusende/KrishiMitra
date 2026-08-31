import express from 'express';
import authRoutes from './authRoutes.js';
import farmerRoutes from './farmerRoutes.js';
import farmRoutes from './farmRoutes.js';
import cropHealthRoutes from './cropHealthRoutes.js';
import diseaseRoutes from './diseaseRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import schemeRoutes from './schemeRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import reportRoutes from './reportRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import communityReportRoutes from './communityReportRoutes.js';

import adminAuth from '../middleware/adminAuth.js';
import { checkRole } from '../middleware/rbac.js';
import analyticsController from '../controllers/analyticsController.js';

const router = express.Router();

// Mount administrative routes
router.use('/auth', authRoutes);
router.use('/farmers', farmerRoutes);
router.use('/farms', farmRoutes);
router.use('/crop-health', cropHealthRoutes);
router.use('/diseases', diseaseRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/schemes', schemeRoutes);
router.use('/tickets', ticketRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/settings', settingsRoutes);
router.use('/community-reports', communityReportRoutes);

// Direct Aliases
router.get('/irrigation', adminAuth, checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT']), analyticsController.getIrrigationAnalytics);
router.get('/weather', adminAuth, checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT']), analyticsController.getWeatherAnalytics);
router.get('/market', adminAuth, checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC']), analyticsController.getMarketAnalytics);

export default router;
