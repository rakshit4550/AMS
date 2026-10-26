import mongoose from 'mongoose';

const settlementEntrySchema = new mongoose.Schema({
  settlementParty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SettlementParty',
    required: true,
  },
  settlementUsername: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SettlementUsername',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be greater than 0'],
  },
  transactionType: {
    type: String,
    enum: ['deposit', 'withdrawal'],
    required: true,
  },
  partnershipPercentage: {
    type: Number,
    required: true,
    min: [0, 'Partnership percentage must be at least 0'],
  },
  percentageSource: {
    type: String,
    enum: ['username', 'party'],
    required: true,
  },
  percentageAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

settlementEntrySchema.index({ createdBy: 1, settlementUsername: 1, createdAt: -1 });
settlementEntrySchema.index({ createdBy: 1, settlementParty: 1, createdAt: -1 });

const SettlementEntry = mongoose.model('SettlementEntry', settlementEntrySchema);

export default SettlementEntry;
