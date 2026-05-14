import mongoose from 'mongoose';

const utrSubtypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

utrSubtypeSchema.index({ name: 1, createdBy: 1 }, { unique: true });

const UtrSubtype = mongoose.model('UtrSubtype', utrSubtypeSchema);

export default UtrSubtype;
