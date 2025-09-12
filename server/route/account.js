// import express from 'express';
// import { createAccount, getAllAccounts, getAccountById, updateAccount, deleteAccount, downloadStatement } from '../controller/account.js';

// const router = express.Router();

// // Define routes
// router.post('/', createAccount); // Create a new account
// router.get('/', getAllAccounts); // Get all accounts
// router.get('/:id', getAccountById); // Get an account by ID
// router.put('/:id', updateAccount); // Update an account
// router.delete('/:id', deleteAccount); // Delete an account
// router.get('/statement/download', downloadStatement); // Download account statement as PDF

// export default router;


import express from 'express';
import { createAccount, getAllAccounts, getAccountById, updateAccount, deleteAccount, downloadStatement } from '../controller/account.js';
import { verifyToken } from '../controller/user.js';

const router = express.Router();

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Define routes
router.post('/', createAccount);
router.get('/', getAllAccounts);
router.get('/:id', getAccountById);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);
router.get('/statement/download', downloadStatement);

export default router;