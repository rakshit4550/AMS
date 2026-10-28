import express from 'express';
import {
  createMarket,
  getMarketsByEvent,
  getMarketById,
  updateMarket,
} from '../controller/market.js';
import { getMarketBook } from '../controller/entry.js';
import { verifyToken } from '../controller/user.js';

const router = express.Router({ mergeParams: true });

router.use(verifyToken);

router.post('/', createMarket);
router.get('/', getMarketsByEvent);
router.get('/:id/book', getMarketBook);
router.get('/:id', getMarketById);
router.put('/:id', updateMarket);

export default router;
