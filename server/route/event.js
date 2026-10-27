import express from 'express';
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
} from '../controller/event.js';
import { verifyToken } from '../controller/user.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', createEvent);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);

export default router;
