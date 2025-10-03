// import express from 'express';
// import { login, logout, createUser, getAllUsers, getUserById, getOwnUser, updateUser, deleteUser, verifyToken, restrictToAdmin, toggleAutoJob } from '../controller/user.js';

// const router = express.Router();

// // Public routes
// router.post('/login', login);
// router.post('/logout', logout);

// // Protected routes
// router.use(verifyToken); // Apply JWT verification to all routes below
// router.post('/users', restrictToAdmin, createUser); // Admin only
// router.get('/users', restrictToAdmin, getAllUsers); // Admin only
// router.get('/users/:id', getUserById); // Self or admin
// router.get('/me', getOwnUser); // Own data for any authenticated user
// router.put('/users/:id', updateUser); // Self or admin
// router.delete('/users/:id', restrictToAdmin, deleteUser); // Admin only
// router.put('/toggle-auto-job', toggleAutoJob); // Any authenticated user

// export default router;

// Updated routes: routes/user.js (add public routes for forgot/reset)
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
  forgotPassword,  // New import
  verifyOTP,       // New import
  resetPassword    // New import
} from '../controller/user.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword); // New public route
router.post('/verify-otp', verifyOTP);           // New public route
router.post('/reset-password', resetPassword);   // New public route

// Protected routes
router.use(verifyToken); // Apply JWT verification to all routes below
router.post('/users', restrictToAdmin, createUser); // Admin only
router.get('/users', restrictToAdmin, getAllUsers); // Admin only
router.get('/users/:id', getUserById); // Self or admin
router.get('/me', getOwnUser); // Own data for any authenticated user
router.put('/users/:id', updateUser); // Self or admin
router.delete('/users/:id', restrictToAdmin, deleteUser); // Admin only
router.put('/toggle-auto-job', toggleAutoJob); // Any authenticated user

export default router;