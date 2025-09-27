import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../model/User.js';

// Create default admin user
export const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin2@gmail.com' });
    console.log('Checking for admin with email: admin2@gmail.com, found:', adminExists ? 'Yes' : 'No');

    if (adminExists) {
      if (adminExists.role !== 'admin') {
        adminExists.role = 'admin';
        await adminExists.save();
        console.log('Default admin role updated to admin');
      }
      const isMatch = await bcrypt.compare('admin', adminExists.password);
      if (!isMatch) {
        console.log('Resetting admin password');
        adminExists.password = 'admin'; // Set plain password, let pre-save hook hash it
        await adminExists.save();
        console.log('Default admin password reset to admin, new hash:', adminExists.password);
      } else {
        console.log('Default admin password is correct, hash:', adminExists.password);
      }
      console.log('Default admin already exists:', {
        username: adminExists.username,
        email: adminExists.email,
        role: adminExists.role,
      });
    } else {
      const admin = new User({
        username: 'admin2',
        email: 'admin2@gmail.com',
        password: 'admin', // Set plain password, let pre-save hook hash it
        role: 'admin',
      });
      await admin.save();
      console.log('Default admin created:', {
        username: admin.username,
        email: admin.email,
        role: admin.role,
        passwordHash: admin.password, // Log hash for debugging
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      console.error('Duplicate key error: Email or username already exists', error);
    } else {
      console.error('Error creating/updating default admin:', error.message);
    }
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt with payload:', { email: email.trim(), password: '****' });

    if (!email || !password) {
      console.log('Missing email/username or password');
      return res.status(400).json({ message: 'Username or email and password are required' });
    }

    const user = await User.findOne(
      {
        $or: [
          { email: email.trim() },
          { username: email.trim() },
        ],
      },
      null,
      { collation: { locale: 'en', strength: 2 } }
    );

    console.log('Found user:', user ? {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    } : 'No user found');

    if (!user) {
      console.log('User not found for input:', email.trim());
      return res.status(401).json({ message: 'Invalid username/email or password' });
    }

    const isMatch = await user.comparePassword(password);
    console.log('Password match for user', user.username, ':', isMatch, 'Input password:', '****', 'Stored hash:', user.password);

    if (!isMatch) {
      console.log('Password mismatch for user:', user.username);
      return res.status(401).json({ message: 'Invalid username/email or password' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not defined' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Login successful for user:', user.username, 'Token generated');
    res.status(200).json({ message: 'Login successful', token, role: user.role, id: user._id });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Logout
export const logout = (req, res) => {
  console.log('Logout request received');
  res.status(200).json({ message: 'Logout successful' });
};

// Middleware to verify JWT and role
export const verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    console.log('No token provided in headers');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

// Middleware to restrict to admin
export const restrictToAdmin = (req, res, next) => {
  console.log('Checking admin access for user role:', req.user.role);
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  next();
};

// Create a new user (admin only)
export const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    console.log('Creating user with data:', { username, email, role });

    if (!username || !email || !password) {
      console.log('Missing required fields for user creation');
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      console.log('User already exists:', { username, email });
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    const user = new User({ username, email, password, role: role || 'user' });
    await user.save();
    console.log('User created successfully:', { id: user._id, username, email, role });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    console.log('Fetching all users');
    const users = await User.find().select('-password');
    console.log('Users fetched:', users.length);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user by ID (self or admin)
export const getUserById = async (req, res) => {
  try {
    console.log('Fetching user by ID:', req.params.id, 'for user:', req.user.id);
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      console.log('Access denied: User is not admin and ID does not match');
      return res.status(403).json({ message: 'Access denied: You can only view your own data' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      console.log('User not found:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User fetched:', { id: user._id, username: user.username, email: user.email });
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user by ID:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get own user data (for non-admin)
export const getOwnUser = async (req, res) => {
  try {
    console.log('Fetching own user data for ID:', req.user.id);
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Own user data fetched:', { id: user._id, username: user.username, email: user.email });
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching own user:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user (self or admin)
export const updateUser = async (req, res) => {
  try {
    console.log('Updating user:', req.params.id, 'with data:', req.body);
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      console.log('Access denied: User is not admin and ID does not match');
      return res.status(403).json({ message: 'Access denied: You can only update your own data' });
    }

    const { username, email, password, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('User not found for update:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields only if provided
    if (username) user.username = username.trim();
    if (email) user.email = email.trim();
    if (req.user.role === 'admin' && role) user.role = role;
    if (password && password.trim()) {
      console.log('Updating password for user:', user._id);
      user.password = password; // Set plain password, let middleware hash it
    } else {
      console.log('No password update requested for user:', user._id);
    }

    await user.save();
    console.log('User saved with updated data:', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      passwordUpdated: !!(password && password.trim())
    });

    const updatedUser = await User.findById(req.params.id).select('-password');
    console.log('User updated successfully:', {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role
    });

    // Generate new token if updating current user
    let newToken = null;
    if (req.user.id === req.params.id) {
      newToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      console.log('Generated new token for updated user:', user.username);
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
      token: newToken
    });
  } catch (error) {
    console.error('Error updating user:', error.message, error.stack);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    console.log('Deleting user:', req.params.id);
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      console.log('User not found for deletion:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User deleted successfully:', req.params.id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle auto-job (daily email) setting
export const toggleAutoJob = async (req, res) => {
  try {
    console.log('Toggling auto-job for user:', req.user.id);
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    user.autoJobEnabled = !user.autoJobEnabled;
    await user.save();
    console.log('Auto-job toggled for user:', user._id, 'New state:', user.autoJobEnabled);

    // Generate new token with updated autoJobEnabled state
    const newToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role, autoJobEnabled: user.autoJobEnabled },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Auto-job setting toggled successfully',
      autoJobEnabled: user.autoJobEnabled,
      token: newToken
    });
  } catch (error) {
    console.error('Error toggling auto-job:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};