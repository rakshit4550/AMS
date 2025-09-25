// import express from 'express';
// import { createAccount, getAllAccounts, getAccountById, updateAccount, deleteAccount, downloadStatement, verifyAccount, importAccounts, sendStatementEmail } from '../controller/account.js';
// import { verifyToken } from '../controller/user.js';

// const router = express.Router();

// // Apply verifyToken middleware to all routes
// router.use(verifyToken);

// // Define routes
// router.post('/', createAccount);
// router.get('/send-email', sendStatementEmail)
// router.get('/', getAllAccounts);
// router.get('/:id', getAccountById);
// router.put('/:id', updateAccount);
// router.delete('/:id', deleteAccount);
// router.put('/:id/verify', verifyAccount);
// router.get('/statement/download', downloadStatement);
// router.post('/import', importAccounts);


// export default router;

import express from 'express';
import { createAccount, getAllAccounts, getAccountById, updateAccount, deleteAccount, downloadStatement, verifyAccount, importAccounts, sendStatementEmail } from '../controller/account.js';
import { verifyToken } from '../controller/user.js';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory (suitable for small files)
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true); // Accept JSON files
    } else {
      cb(new Error('Only JSON files are allowed'), false);
    }
  },
});

const router = express.Router();

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Define routes
router.post('/', createAccount);
router.get('/send-email', sendStatementEmail);
router.get('/', getAllAccounts);
router.get('/:id', getAccountById);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);
router.put('/:id/verify', verifyAccount);
router.get('/statement/download', downloadStatement);
router.post('/import', upload.single('file'), importAccounts); // Add multer middleware for file upload

export default router;