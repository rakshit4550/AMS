import express from 'express';
import {
  createSettlementParty,
  getAllSettlementParties,
  getSettlementPartyById,
  updateSettlementParty,
  createSettlementUsername,
  getSettlementUsernames,
  updateSettlementUsername,
} from '../controller/settlementParty.js';
import {
  createSettlementEntry,
  getSettlementEntries,
} from '../controller/settlementEntry.js';
import { verifyToken } from '../controller/user.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', createSettlementParty);
router.get('/', getAllSettlementParties);

router.post('/:partyId/usernames', createSettlementUsername);
router.get('/:partyId/usernames', getSettlementUsernames);
router.put('/:partyId/usernames/:usernameId', updateSettlementUsername);
router.post('/:partyId/usernames/:usernameId/entries', createSettlementEntry);
router.get('/:partyId/usernames/:usernameId/entries', getSettlementEntries);

router.get('/:id', getSettlementPartyById);
router.put('/:id', updateSettlementParty);

export default router;
