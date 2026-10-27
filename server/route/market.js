import express from 'express';
import {
  createMarket,
  getMarketsByEvent,
  getMarketById,
  updateMarket,
} from '../controller/market.js';
import { verifyToken } from '../controller/user.js';

const router = express.Router({ mergeParams: true });

router.use(verifyToken);

router.post('/', createMarket);
router.get('/', getMarketsByEvent);
router.get('/:id', getMarketById);
router.put('/:id', updateMarket);

export default router;
