import express from 'express';
import cropHealthController from '../controllers/cropHealthController.js';
import adminAuth from '../middleware/adminAuth.js';
import { checkRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(adminAuth);

router.get('/', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT']), cropHealthController.getCropHealthScans);
router.get('/:id', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT']), cropHealthController.getCropHealthScanById);

export default router;
