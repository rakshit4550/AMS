import express from 'express';
import { createDomain, getAllDomains, getDomainById, updateDomain, deleteDomain } from '../controller/domain.js';
import { verifyToken } from '../controller/user.js';

const router = express.Router();

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Define routes
router.post('/', createDomain);
router.get('/', getAllDomains);
router.get('/:id', getDomainById);
router.put('/:id', updateDomain);
router.delete('/:id', deleteDomain);

export default router;