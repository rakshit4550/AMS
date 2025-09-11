import express from 'express';
import { createParty, getAllParties, getPartyById, updateParty, deleteParty } from './controller/party.js';

const router = express.Router();

// Define routes
router.post('/', createParty); // Create a new party
router.get('/', getAllParties); // Get all parties
router.get('/:id', getPartyById); // Get a party by ID
router.put('/:id', updateParty); // Update a party
router.delete('/:id', deleteParty); // Delete a party

export default router;