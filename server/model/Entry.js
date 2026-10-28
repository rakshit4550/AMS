import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  market: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Market',
    required: true,
  },
  team: {
    type: String,
    enum: ['team1', 'team2'],
    required: function requiredTeam() {
      return this.selection === 'Back' || this.selection === 'Lay';
    },
  },
  teamname: {
    type: String,
    required: true,
    trim: true,
  },
  stack: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => Number.isFinite(value) && value > 0,
      message: 'Stack must be greater than 0',
    },
  },
  rate: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => Number.isFinite(value) && value > 0,
      message: 'Rate must be greater than 0',
    },
  },
  run: {
    type: Number,
    validate: {
      validator: (value) => value == null || (Number.isFinite(value) && value > 0),
      message: 'Run must be greater than 0',
    },
  },
  selection: {
    type: String,
    required: true,
    enum: ['Back', 'Lay', 'Yes', 'No'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

entrySchema.index({ createdBy: 1, market: 1, createdAt: -1 });

const Entry = mongoose.model('Entry', entrySchema);

export default Entry;
