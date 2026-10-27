import mongoose from 'mongoose';

const marketSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  booktype: {
    type: String,
    required: true,
    enum: ['Bookmaker', 'Fancy'],
    trim: true,
  },
  marketname: {
    type: String,
    required: true,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

marketSchema.index({ createdBy: 1, event: 1, createdAt: -1 });
marketSchema.index({ createdBy: 1, event: 1, marketname: 1 });

const Market = mongoose.model('Market', marketSchema);

export default Market;
