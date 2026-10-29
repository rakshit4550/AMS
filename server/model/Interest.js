import mongoose from 'mongoose';

const interestMonthSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
    min: 1,
  },
  interestReceived: {
    type: Boolean,
    required: true,
    default: false,
  },
  amountReturned: {
    type: Boolean,
    required: true,
    default: false,
  },
}, { _id: false });

const interestSchema = new mongoose.Schema({
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be greater than 0'],
  },
  interestRate: {
    type: Number,
    required: true,
    min: [0.0001, 'Interest rate must be greater than 0'],
    max: [100, 'Interest rate must be at most 100'],
  },
  interestType: {
    type: String,
    enum: ['advance', 'simple'],
    required: true,
  },
  months: {
    type: Number,
    required: true,
    min: [1, 'Months must be at least 1'],
    max: [120, 'Months must be at most 120'],
  },
  date: {
    type: Date,
    required: true,
  },
  receivedAmount: {
    type: Number,
    default: null,
  },
  receivedDate: {
    type: Date,
    default: null,
  },
  receipts: {
    type: [{
      amount: {
        type: Number,
        required: true,
        min: 0.01,
      },
      principal: {
        type: Number,
        required: true,
        min: 0,
      },
      interest: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      date: {
        type: Date,
        required: true,
      },
    }],
    default: [],
  },
  schedule: {
    type: [interestMonthSchema],
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

interestSchema.index({ createdBy: 1, date: -1, _id: -1 });
interestSchema.index({ createdBy: 1, party: 1, date: -1 });

const Interest = mongoose.model('Interest', interestSchema);

export default Interest;
