import jwt from 'jsonwebtoken';
import User from '../model/User.js';

// Create default admin user
export const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin1@gmail.com' });

    if (adminExists) {
      // If admin exists, update password and role if necessary, but don't change email
      if (adminExists.role !== 'admin') {
        adminExists.role = 'admin';
        await adminExists.save();
        console.log('Default admin role updated');
      }
      // Optionally, reset password if needed
      if (!(await adminExists.comparePassword('admin123'))) {
        adminExists.password = 'admin123'; // Will be hashed by pre-save hook
        await adminExists.save();
        console.log('Default admin password reset');
      }
      console.log('Default admin already exists, no changes needed');
    } else {
      // Create new admin if none exists
      const admin = new User({
        email: 'admin1@gmail.com', // Use original email to avoid conflicts
        password: 'admin123',
        role: 'admin',
      });
      await admin.save();
      console.log('Default admin created');
    }
  } catch (error) {
    if (error.code === 11000) {
      console.error('Duplicate key error: Email already exists');
    } else {
      console.error('Error creating/updating default admin:', error.message);
    }
  }
};



// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not defined' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ message: 'Login successful', token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Logout
export const logout = (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
};

// Middleware to verify JWT and role
export const verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user ID and role to request
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

// Middleware to restrict to admin
export const restrictToAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  next();
};

// Create a new user (admin only)
export const createUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const user = new User({ email, password, role: role || 'user' });
    await user.save();
    res.status(201).json({ message: 'User created successfully', user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user by ID (self or admin)
export const getUserById = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied: You can only view your own data' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user (self or admin)
export const updateUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied: You can only update your own data' });
    }
    const { email, password, role } = req.body;
    const updateData = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (req.user.role === 'admin' && role) updateData.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};