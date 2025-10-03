// import mongoose from 'mongoose';
// import bcrypt from 'bcrypt';

// const userSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
//   role: {
//     type: String,
//     enum: ['admin', 'user'],
//     default: 'user',
//   },
//   autoJobEnabled: {
//     type: Boolean,
//     default: false, // Default to false (auto-job disabled)
//   },
// }, {
//   timestamps: true,
//   collation: { locale: 'en', strength: 2 }, // Case-insensitive collation
// });

// // Pre-save hook to hash password
// userSchema.pre('save', async function (next) {
//   if (this.isModified('password')) {
//     console.log('Hashing password for user:', this.username);
//     this.password = await bcrypt.hash(this.password, 10);
//     console.log('Password hashed:', this.password);
//   }
//   next();
// });

// // Method to compare passwords
// userSchema.methods.comparePassword = async function (password) {
//   const isMatch = await bcrypt.compare(password, this.password);
//   console.log('Comparing password for user:', this.username, 'Result:', isMatch);
//   return isMatch;
// };

// const User = mongoose.model('User', userSchema);

// export default User;


import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  autoJobEnabled: {
    type: Boolean,
    default: false, // Default to false (auto-job disabled)
  },
  otp: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collation: { locale: 'en', strength: 2 }, // Case-insensitive collation
});

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    console.log('Hashing password for user:', this.username);
    this.password = await bcrypt.hash(this.password, 10);
    console.log('Password hashed:', this.password);
  }
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password) {
  const isMatch = await bcrypt.compare(password, this.password);
  console.log('Comparing password for user:', this.username, 'Result:', isMatch);
  return isMatch;
};

const User = mongoose.model('User', userSchema);

export default User;