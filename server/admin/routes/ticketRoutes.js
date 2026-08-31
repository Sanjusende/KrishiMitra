import express from 'express';
import ticketController from '../controllers/ticketController.js';
import adminAuth from '../middleware/adminAuth.js';
import { checkRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(adminAuth);

router.get('/', checkRole(['SUPER_ADMIN', 'ADMIN', 'SUPPORT_EXEC']), ticketController.getTickets);
router.get('/staff/list', checkRole(['SUPER_ADMIN', 'ADMIN', 'SUPPORT_EXEC']), ticketController.getStaffList);
router.get('/:id', checkRole(['SUPER_ADMIN', 'ADMIN', 'SUPPORT_EXEC']), ticketController.getTicketById);

router.post('/', checkRole(['SUPER_ADMIN', 'ADMIN', 'SUPPORT_EXEC']), ticketController.createTicket);
router.patch('/:id/assign', checkRole(['SUPER_ADMIN', 'ADMIN']), ticketController.assignTicket);
router.patch('/:id/resolve', checkRole(['SUPER_ADMIN', 'ADMIN', 'SUPPORT_EXEC']), ticketController.resolveTicket);
router.post('/:id/comments', checkRole(['SUPER_ADMIN', 'ADMIN', 'SUPPORT_EXEC']), ticketController.addComment);

export default router;
