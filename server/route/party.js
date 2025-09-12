import express from 'express';
import { createParty, getAllParties, getPartyById, updateParty, deleteParty } from '../controller/party.js';
import { verifyToken } from '../controller/user.js';

const router = express.Router();

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Define routes
router.post('/', createParty);
router.get('/', getAllParties);
router.get('/:id', getPartyById);
router.put('/:id', updateParty);
router.delete('/:id', deleteParty);

export default router;