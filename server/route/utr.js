import express from 'express';
import {
  createUtr,
  getAllUtrs,
  getUtrById,
  updateUtr,
  deleteUtr,
} from '../controller/utr.js';
import { verifyToken } from '../controller/user.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', createUtr);
router.get('/', getAllUtrs);
router.get('/:id', getUtrById);
router.put('/:id', updateUtr);
router.delete('/:id', deleteUtr);

export default router;
