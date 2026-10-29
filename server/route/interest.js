import express from 'express';
import {
  createInterest,
  getAllInterests,
  getInterestById,
  updateInterest,
} from '../controller/interest.js';
import { verifyToken } from '../controller/user.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', createInterest);
router.get('/', getAllInterests);
router.get('/:id', getInterestById);
router.put('/:id', updateInterest);

export default router;
