import express from 'express';
import diseaseController from '../controllers/diseaseController.js';
import adminAuth from '../middleware/adminAuth.js';
import { checkRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(adminAuth);

router.get('/', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC']), diseaseController.getDiseases);
router.get('/:id', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC']), diseaseController.getDiseaseById);

router.post('/', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT']), diseaseController.createDisease);
router.put('/:id', checkRole(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT']), diseaseController.updateDisease);

router.delete('/:id', checkRole(['SUPER_ADMIN', 'ADMIN']), diseaseController.deleteDisease);

export default router;
