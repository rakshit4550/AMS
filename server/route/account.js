import express from 'express';
import { createAccount, getAllAccounts, getAccountById, updateAccount, deleteAccount, downloadStatement } from '../controller/account.js';

const router = express.Router();

// Define routes
router.post('/', createAccount); // Create a new account
router.get('/', getAllAccounts); // Get all accounts
router.get('/:id', getAccountById); // Get an account by ID
router.put('/:id', updateAccount); // Update an account
router.delete('/:id', deleteAccount); // Delete an account
router.get('/statement/download', downloadStatement); // Download account statement as PDF

export default router;