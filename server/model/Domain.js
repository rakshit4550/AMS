import mongoose from 'mongoose';

const domainSchema = new mongoose.Schema({
  domainname: {
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

const Domain = mongoose.model('Domain', domainSchema);

export default Domain;