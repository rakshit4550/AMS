import express from 'express';
import {
  createSettlement,
  getSettlements,
  getSettlementById,
  updateSettlement,
  deleteSettlement,
  downloadSettlement,
  getDomains,
} from '../controller/settlement.js';
import { verifyToken } from '../controller/user.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Routes
router.post('/', createSettlement);
router.get('/', getSettlements);
router.get('/download', downloadSettlement);
router.get('/domains', getDomains);
router.get('/:id', getSettlementById);
router.put('/:id', updateSettlement);
router.delete('/:id', deleteSettlement);

export default router;