import mongoose from 'mongoose';

const partySchema = new mongoose.Schema({
  partyname: {
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

const Party = mongoose.model('Party', partySchema);

export default Party;