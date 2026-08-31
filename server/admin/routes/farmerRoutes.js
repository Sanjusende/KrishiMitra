import express from 'express';
import farmerController from '../controllers/farmerController.js';
import adminAuth from '../middleware/adminAuth.js';
import { checkRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(adminAuth);

router.get('/', checkRole(['SUPER_ADMIN', 'ADMIN', 'SUPPORT_EXEC', 'AGRI_EXPERT']), farmerController.getFarmers);
router.get('/:id', checkRole(['SUPER_ADMIN', 'ADMIN', 'SUPPORT_EXEC', 'AGRI_EXPERT']), farmerController.getFarmerDetails);

router.patch('/:id/suspend', checkRole(['SUPER_ADMIN', 'ADMIN']), farmerController.suspendFarmer);
router.patch('/:id/activate', checkRole(['SUPER_ADMIN', 'ADMIN']), farmerController.activateFarmer);

router.delete('/:id', checkRole(['SUPER_ADMIN']), farmerController.deleteFarmer);

export default router;
