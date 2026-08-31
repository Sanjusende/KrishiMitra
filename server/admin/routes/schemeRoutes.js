import express from 'express';
import schemeController from '../controllers/schemeController.js';
import adminAuth from '../middleware/adminAuth.js';
import { checkRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(adminAuth);

router.get('/', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC']), schemeController.getSchemes);
router.get('/:id', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC']), schemeController.getSchemeById);

router.post('/', checkRole(['SUPER_ADMIN', 'ADMIN']), schemeController.createScheme);
router.put('/:id', checkRole(['SUPER_ADMIN', 'ADMIN']), schemeController.updateScheme);

router.delete('/:id', checkRole(['SUPER_ADMIN']), schemeController.deleteScheme);

export default router;
