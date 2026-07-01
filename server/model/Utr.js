import mongoose from 'mongoose';

const utrSchema = new mongoose.Schema(
  {
    utrNo: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    transactionType: {
      type: String,
      enum: ['deposit', 'withdraw'],
      default: 'deposit',
      required: true,
    },
    subtype: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UtrSubtype',
      default: null,
    },
    subtypeName: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      required: true,
      default: () => {
        const now = new Date();
        const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        istDate.setHours(0, 0, 0, 0);
        return istDate;
      },
    },
    time: {
      type: String,
      required: true,
      default: () =>
        new Date().toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
    },
    remark: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

utrSchema.index({ createdBy: 1, createdAt: -1 });
utrSchema.index({ createdBy: 1, date: -1 });

const Utr = mongoose.model('Utr', utrSchema);

export default Utr;