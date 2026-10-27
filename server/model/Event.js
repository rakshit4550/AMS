import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  eventname: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  team1: {
    type: String,
    required: true,
    trim: true,
  },
  team2: {
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

eventSchema.index({ createdBy: 1, date: -1 });
eventSchema.index({ createdBy: 1, eventname: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
