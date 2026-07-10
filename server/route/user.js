import express from 'express';
import { 
  login, 
  logout, 
  createUser, 
  getAllUsers, 
  getUserById, 
  getOwnUser, 
  updateUser, 
  deleteUser, 
  verifyToken, 
  restrictToAdmin, 
  toggleAutoJob,
  changePassword,
  verifyOldPassword,
  verify2FA,
  setup2FA,
  enable2FA,
  disable2FA,
  forgotPassword,
  verifyOTP,
  resetPassword,
  forgot2FA,
  getReset2FASetup,
  confirmReset2FA,
} from '../controller/user.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify-2fa', verify2FA);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/forgot-2fa', forgot2FA);
router.get('/reset-2fa', getReset2FASetup);
router.post('/reset-2fa/confirm', confirmReset2FA);

// Protected routes
router.use(verifyToken); // Apply JWT verification to all routes below
router.post('/users', restrictToAdmin, createUser); // Admin only
router.get('/users', restrictToAdmin, getAllUsers); // Admin only
router.get('/users/:id', getUserById); // Self or admin
router.get('/me', getOwnUser); // Own data for any authenticated user
router.put('/users/:id', updateUser); // Self or admin
router.delete('/users/:id', restrictToAdmin, deleteUser); // Admin only
router.post('/verify-old-password', verifyOldPassword); // Step 1: verify current password
router.put('/change-password', changePassword); // Step 2: set new password
router.post('/2fa/setup', setup2FA);
router.post('/2fa/enable', enable2FA);
router.post('/2fa/disable', disable2FA);
router.put('/toggle-auto-job', toggleAutoJob); // Any authenticated user

export default router;