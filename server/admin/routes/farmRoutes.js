import express from 'express';
import farmController from '../controllers/farmController.js';
import adminAuth from '../middleware/adminAuth.js';
import { checkRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(adminAuth);

router.get('/', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC']), farmController.getFarms);
router.get('/:id', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC']), farmController.getFarmById);

router.post('/', checkRole(['SUPER_ADMIN', 'ADMIN']), farmController.createFarm);
router.put('/:id', checkRole(['SUPER_ADMIN', 'ADMIN']), farmController.updateFarm);

router.delete('/:id', checkRole(['SUPER_ADMIN']), farmController.deleteFarm);

export default router;
