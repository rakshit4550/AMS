import mongoose from 'mongoose';

const partySchema = new mongoose.Schema({
  partyname: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

const Party = mongoose.model('Party', partySchema);

export default Party;