import mongoose from 'mongoose';

const settlementUsernameSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  partnershipPercentage: {
    type: Number,
    default: null,
    min: [0, 'Partnership percentage must be at least 0'],
  },
  settlementParty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SettlementParty',
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

settlementUsernameSchema.index(
  { settlementParty: 1, username: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);
settlementUsernameSchema.index({ createdBy: 1, settlementParty: 1 });

const SettlementUsername = mongoose.model('SettlementUsername', settlementUsernameSchema);

export default SettlementUsername;
