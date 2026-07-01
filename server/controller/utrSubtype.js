import mongoose from 'mongoose';
import UtrSubtype from '../model/UtrSubtype.js';
import Utr from '../model/Utr.js';

const canAccessUtr = (req) => {
  return req.user?.role === 'trader' || req.user?.role === 'admin';
};

export const createUtrSubtype = async (req, res) => {
  try {
    if (!canAccessUtr(req)) {
      return res.status(403).json({ message: 'Access denied: Trader role required' });
    }

    const { name } = req.body;

    if (!name || String(name).trim() === '') {
      return res.status(400).json({ message: 'Subtype name is required' });
    }

    const cleanName = String(name).trim();

    const existingSubtype = await UtrSubtype.findOne({
      name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      createdBy: req.user.id,
    });

    if (existingSubtype) {
      return res.status(400).json({ message: 'Subtype already exists' });
    }

    const subtype = new UtrSubtype({
      name: cleanName,
      createdBy: req.user.id,
    });

    await subtype.save();

    res.status(201).json({
      message: 'Subtype created successfully',
      subtype,
    });
  } catch (error) {
    console.error('Create UTR subtype error:', error.message);

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Subtype already exists' });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUtrSubtypes = async (req, res) => {
  try {
    if (!canAccessUtr(req)) {
      return res.status(403).json({ message: 'Access denied: Trader role required' });
    }

    const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };

    const subtypes = await UtrSubtype.find(query)
      .populate('createdBy', 'username email role')
      .sort({ createdAt: -1 });

    res.status(200).json(subtypes);
  } catch (error) {
    console.error('Get UTR subtypes error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteUtrSubtype = async (req, res) => {
  try {
    if (!canAccessUtr(req)) {
      return res.status(403).json({ message: 'Access denied: Trader role required' });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid subtype ID' });
    }

    const query = req.user.role === 'admin' ? { _id: id } : { _id: id, createdBy: req.user.id };

    const subtype = await UtrSubtype.findOneAndDelete(query);

    if (!subtype) {
      return res.status(404).json({ message: 'Subtype not found or you do not have access' });
    }

    await Utr.updateMany(
      { subtype: subtype._id },
      {
        $set: {
          subtype: null,
          subtypeName: '',
        },
      }
    );

    res.status(200).json({ message: 'Subtype deleted successfully' });
  } catch (error) {
    console.error('Delete UTR subtype error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};