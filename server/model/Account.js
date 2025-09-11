import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  partyname: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  credit: {
    type: Number,
    min: 0,
    default: 0
  },
  debit: {
    type: Number,
    min: 0,
    default: 0
  },
  remark: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Validation: Ensure at least one of credit or debit is provided
accountSchema.pre('validate', function (next) {
  if (this.credit === 0 && this.debit === 0) {
    next(new Error('Either credit or debit must be provided.'));
  }
  next();
});

const Account = mongoose.model('Account', accountSchema);

export default Account;