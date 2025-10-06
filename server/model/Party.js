// import mongoose from 'mongoose';

// const partySchema = new mongoose.Schema({
//   partyname: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
// }, {
//   timestamps: true,
// });

// const Party = mongoose.model('Party', partySchema);

// export default Party;


import mongoose from 'mongoose';

const partySchema = new mongoose.Schema({
  partyname: {
    type: String,
    required: true,
    trim: true,
  },
  mobileNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^\d{10}$/.test(v);
      },
      message: 'Mobile number must be exactly 10 digits',
    },
  },
  city: {
    type: String,
    trim: true,
  },
  remark: {
    type: String,
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