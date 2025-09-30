import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  domain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: true,
  },
  settlement: {
    type: Number,
    required: true,
  },
  rate: {
    type: Number,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

const Settlement = mongoose.model('Settlement', settlementSchema);

export default Settlement;