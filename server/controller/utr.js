import mongoose from 'mongoose';
import Utr from '../model/Utr.js';

const getTodayISTDateOnly = () => {
  const now = new Date();
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  istDate.setHours(0, 0, 0, 0);
  return istDate;
};

const getCurrentISTTime = () => {
  return new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const canAccessUtr = (req) => {
  return req.user?.role === 'trader' || req.user?.role === 'admin';
};

// Create UTR
export const createUtr = async (req, res) => {
  try {
    if (!canAccessUtr(req)) {
      return res.status(403).json({ message: 'Access denied: Trader role required' });
    }

    const {
      utrNo,
      amount,
      transactionType = 'deposit',
      date,
      remark = '',
    } = req.body;

    if (!utrNo || String(utrNo).trim() === '') {
      return res.status(400).json({ message: 'UTR No is required' });
    }

    if (amount === undefined || amount === null || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount is required and must be greater than 0' });
    }

    const cleanTransactionType = transactionType === 'withdraw' ? 'withdraw' : 'deposit';

    const utr = new Utr({
      utrNo: String(utrNo).trim(),
      amount: Number(amount),
      transactionType: cleanTransactionType,
      date: date ? new Date(date) : getTodayISTDateOnly(),
      time: getCurrentISTTime(),
      remark: remark || '',
      createdBy: req.user.id,
    });

    await utr.save();

    res.status(201).json({
      message: 'UTR created successfully',
      utr,
    });
  } catch (error) {
    console.error('Create UTR error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all UTR entries
export const getAllUtrs = async (req, res) => {
  try {
    if (!canAccessUtr(req)) {
      return res.status(403).json({ message: 'Access denied: Trader role required' });
    }

    const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };

    const utrs = await Utr.find(query)
      .populate('createdBy', 'username email role')
      .sort({ createdAt: -1 });

    res.status(200).json(utrs);
  } catch (error) {
    console.error('Get UTR error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single UTR
export const getUtrById = async (req, res) => {
  try {
    if (!canAccessUtr(req)) {
      return res.status(403).json({ message: 'Access denied: Trader role required' });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid UTR ID' });
    }

    const query = req.user.role === 'admin' ? { _id: id } : { _id: id, createdBy: req.user.id };

    const utr = await Utr.findOne(query).populate('createdBy', 'username email role');

    if (!utr) {
      return res.status(404).json({ message: 'UTR not found or you do not have access' });
    }

    res.status(200).json(utr);
  } catch (error) {
    console.error('Get UTR by ID error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// // Update UTR
// export const updateUtr = async (req, res) => {
//   try {
//     if (!canAccessUtr(req)) {
//       return res.status(403).json({ message: 'Access denied: Trader role required' });
//     }

//     const { id } = req.params;
//     const {
//       utrNo,
//       amount,
//       transactionType = 'deposit',
//       date,
//       remark = '',
//     } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: 'Invalid UTR ID' });
//     }

//     if (!utrNo || String(utrNo).trim() === '') {
//       return res.status(400).json({ message: 'UTR No is required' });
//     }

//     if (amount === undefined || amount === null || Number(amount) <= 0) {
//       return res.status(400).json({ message: 'Amount is required and must be greater than 0' });
//     }

//     const query = req.user.role === 'admin' ? { _id: id } : { _id: id, createdBy: req.user.id };
//     const cleanTransactionType = transactionType === 'withdraw' ? 'withdraw' : 'deposit';

//     const updatedUtr = await Utr.findOneAndUpdate(
//       query,
//       {
//         utrNo: String(utrNo).trim(),
//         amount: Number(amount),
//         transactionType: cleanTransactionType,
//         date: date ? new Date(date) : getTodayISTDateOnly(),
//         remark: remark || '',
//       },
//       { new: true, runValidators: true }
//     ).populate('createdBy', 'username email role');

//     if (!updatedUtr) {
//       return res.status(404).json({ message: 'UTR not found or you do not have access' });
//     }

//     res.status(200).json({
//       message: 'UTR updated successfully',
//       utr: updatedUtr,
//     });
//   } catch (error) {
//     console.error('Update UTR error:', error.message);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// Delete UTR
export const deleteUtr = async (req, res) => {
  try {
    if (!canAccessUtr(req)) {
      return res.status(403).json({ message: 'Access denied: Trader role required' });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid UTR ID' });
    }

    const query = req.user.role === 'admin' ? { _id: id } : { _id: id, createdBy: req.user.id };

    const utr = await Utr.findOneAndDelete(query);

    if (!utr) {
      return res.status(404).json({ message: 'UTR not found or you do not have access' });
    }

    res.status(200).json({ message: 'UTR deleted successfully' });
  } catch (error) {
    console.error('Delete UTR error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
