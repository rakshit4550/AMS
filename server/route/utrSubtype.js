import express from 'express';
import {
  createUtrSubtype,
  getUtrSubtypes,
  deleteUtrSubtype,
} from '../controller/utrSubtype.js';
import { verifyToken } from '../controller/user.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', createUtrSubtype);
router.get('/', getUtrSubtypes);
router.delete('/:id', deleteUtrSubtype);

export default router;