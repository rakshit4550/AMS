import express from 'express';
import { createAccount, getAllAccounts, getAccountById, updateAccount, deleteAccount, downloadStatement, verifyAccount } from '../controller/account.js';
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
router.put('/:id/verify', verifyAccount);
router.get('/statement/download', downloadStatement);

export default router;