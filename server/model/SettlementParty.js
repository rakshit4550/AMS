import mongoose from 'mongoose';

const settlementPartySchema = new mongoose.Schema({
  partyname: {
    type: String,
    required: true,
    trim: true,
  },
  contactNo: {
    type: String,
    trim: true,
    default: '',
  },
  partnershipPercentage: {
    type: Number,
    required: true,
    min: [0, 'Partnership percentage must be at least 0'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

settlementPartySchema.index({ createdBy: 1, partyname: 1 });

const SettlementParty = mongoose.model('SettlementParty', settlementPartySchema);

export default SettlementParty;
