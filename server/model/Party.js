import mongoose from 'mongoose';

const partySchema = new mongoose.Schema({
  partyname: {
    type: String,
    required: true,
    trim: true,
  },
  mobileNumber: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  remark: {
    type: String,
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

partySchema.index({ createdBy: 1, partyname: 1 });

const Party = mongoose.model('Party', partySchema);

export default Party;