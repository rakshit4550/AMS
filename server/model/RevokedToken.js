import mongoose from 'mongoose';

const revokedTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// MongoDB removes the row after the JWT's own expiry, so the list does not grow forever.
revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RevokedToken = mongoose.model('RevokedToken', revokedTokenSchema);

export default RevokedToken;
