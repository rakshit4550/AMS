// import express from 'express';
// import { login, logout, createUser, getAllUsers, getUserById, updateUser, deleteUser, verifyToken, restrictToAdmin } from '../controller/user.js';

// const router = express.Router();

// // Public routes
// router.post('/login', login);
// router.post('/logout', logout);

// // Protected routes
// router.use(verifyToken); // Apply JWT verification to all routes below
// router.post('/users', restrictToAdmin, createUser); // Admin only
// router.get('/users', restrictToAdmin, getAllUsers); // Admin only
// router.get('/users/:id', getUserById); // Self or admin
// router.put('/users/:id', updateUser); // Self or admin
// router.delete('/users/:id', restrictToAdmin, deleteUser); // Admin only

// export default router;

// Updated routes (userRoutes.js)
import express from 'express';
import { login, logout, createUser, getAllUsers, getUserById, getOwnUser, updateUser, deleteUser, verifyToken, restrictToAdmin } from '../controller/user.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.use(verifyToken); // Apply JWT verification to all routes below
router.post('/users', restrictToAdmin, createUser); // Admin only
router.get('/users', restrictToAdmin, getAllUsers); // Admin only
router.get('/users/:id', getUserById); // Self or admin
router.get('/me', getOwnUser); // Own data for any authenticated user
router.put('/users/:id', updateUser); // Self or admin
router.delete('/users/:id', restrictToAdmin, deleteUser); // Admin only

export default router;