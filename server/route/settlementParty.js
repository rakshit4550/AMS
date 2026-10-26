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
import { verifyToken } from '../controller/user.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', createSettlementParty);
router.get('/', getAllSettlementParties);

router.post('/:partyId/usernames', createSettlementUsername);
router.get('/:partyId/usernames', getSettlementUsernames);
router.put('/:partyId/usernames/:usernameId', updateSettlementUsername);

router.get('/:id', getSettlementPartyById);
router.put('/:id', updateSettlementParty);

export default router;
