import express from 'express';
import { body } from 'express-validator';
import authController from '../controllers/authController.js';
import adminAuth from '../middleware/adminAuth.js';
import { validateRequest } from '../../middleware/validationMiddleware.js';

const router = express.Router();

// Public auth endpoints
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('role')
      .trim()
      .customSanitizer((val) => {
        const roleMap = {
          'super_admin': 'SUPER_ADMIN',
          'admin': 'ADMIN',
          'agriculture_expert': 'AGRI_EXPERT',
          'support_executive': 'SUPPORT_EXEC',
          'SUPER_ADMIN': 'SUPER_ADMIN',
          'ADMIN': 'ADMIN',
          'AGRI_EXPERT': 'AGRI_EXPERT',
          'SUPPORT_EXEC': 'SUPPORT_EXEC'
        };
        return roleMap[val] || val;
      })
      .isIn(['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC'])
      .withMessage('Invalid admin role'),
  ],
  validateRequest,
  authController.registerAdmin
);

router.post('/login', authController.login);
router.post('/refresh-token', authController.refresh);

// Protected auth endpoints
router.post('/logout', adminAuth, authController.logout);
router.get('/me', adminAuth, authController.getMe);

export default router;
