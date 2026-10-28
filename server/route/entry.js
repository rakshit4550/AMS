import express from 'express';
import {
  createEntry,
  getEntriesByMarket,
  getEntryById,
  updateEntry,
} from '../controller/entry.js';
import { verifyToken } from '../controller/user.js';

const router = express.Router({ mergeParams: true });

router.use(verifyToken);

router.post('/', createEntry);
router.get('/', getEntriesByMarket);
router.get('/:id', getEntryById);
router.put('/:id', updateEntry);

export default router;
