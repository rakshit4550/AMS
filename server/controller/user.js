// import jwt from 'jsonwebtoken';
// import User from '../model/User.js';

// // Create default admin user
// export const createDefaultAdmin = async () => {
//   try {
//     const adminExists = await User.findOne({ email: 'admin1@gmail.com' });
//     console.log('Checking for admin with email: admin1@gmail.com, found:', adminExists ? 'Yes' : 'No');

//     if (adminExists) {
//       // If admin exists, update password and role if necessary
//       if (adminExists.role !== 'admin') {
//         adminExists.role = 'admin';
//         await adminExists.save();
//         console.log('Default admin role updated to admin');
//       }
//       // Reset password if it doesn't match
//       if (!(await adminExists.comparePassword('admin123'))) {
//         adminExists.password = 'admin123'; // Will be hashed by pre-save hook
//         await adminExists.save();
//         console.log('Default admin password reset to admin123');
//       } else {
//         console.log('Default admin password is correct');
//       }
//       console.log('Default admin already exists:', {
//         username: adminExists.username,
//         email: adminExists.email,
//         role: adminExists.role,
//       });
//     } else {
//       // Create new admin if none exists
//       const admin = new User({
//         username: 'admin1',
//         email: 'admin1@gmail.com',
//         password: 'admin123',
//         role: 'admin',
//       });
//       await admin.save();
//       console.log('Default admin created:', {
//         username: admin.username,
//         email: admin.email,
//         role: admin.role,
//       });
//     }
//   } catch (error) {
//     if (error.code === 11000) {
//       console.error('Duplicate key error: Email or username already exists', error);
//     } else {
//       console.error('Error creating/updating default admin:', error.message);
//     }
//   }
// };

// // Login
// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     console.log('Login attempt with payload:', { email, password });

//     if (!email || !password) {
//       console.log('Missing email/username or password');
//       return res.status(400).json({ message: 'Username or email and password are required' });
//     }

//     // Use collation for case-insensitive query
//     const user = await User.findOne(
//       {
//         $or: [
//           { email: email.trim() },
//           { username: email.trim() },
//         ],
//       },
//       null,
//       { collation: { locale: 'en', strength: 2 } } // Case-insensitive collation
//     );

//     console.log('Found user:', user ? {
//       id: user._id,
//       username: user.username,
//       email: user.email,
//       role: user.role,
//     } : 'No user found');

//     if (!user) {
//       console.log('User not found for input:', email);
//       return res.status(401).json({ message: 'Invalid username/email or password' });
//     }

//     const isMatch = await user.comparePassword(password);
//     console.log('Password match for user', user.username, ':', isMatch);

//     if (!isMatch) {
//       console.log('Password mismatch for user:', user.username);
//       return res.status(401).json({ message: 'Invalid username/email or password' });
//     }

//     if (!process.env.JWT_SECRET) {
//       console.error('JWT_SECRET is not defined');
//       return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not defined' });
//     }

//     const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
//       expiresIn: '1h',
//     });

//     console.log('Login successful for user:', user.username);
//     res.status(200).json({ message: 'Login successful', token, role: user.role });
//   } catch (error) {
//     console.error('Login error:', error.message, error.stack);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Logout
// export const logout = (req, res) => {
//   console.log('Logout request received');
//   res.status(200).json({ message: 'Logout successful' });
// };

// // Middleware to verify JWT and role
// export const verifyToken = async (req, res, next) => {
//   const token = req.headers['authorization']?.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ message: 'No token provided' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // Attach user ID and role to request
//     next();
//   } catch (error) {
//     console.error('Token verification error:', error.message);
//     res.status(401).json({ message: 'Invalid token', error: error.message });
//   }
// };

// // Middleware to restrict to admin
// export const restrictToAdmin = (req, res, next) => {
//   console.log('Checking admin access for user role:', req.user.role);
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({ message: 'Access denied: Admins only' });
//   }
//   next();
// };

// // Create a new user (admin only)
// export const createUser = async (req, res) => {
//   try {
//     const { username, email, password, role } = req.body;
//     console.log('Creating user with data:', { username, email, role });

//     if (!username || !email || !password) {
//       console.log('Missing required fields for user creation');
//       return res.status(400).json({ message: 'Username, email, and password are required' });
//     }

//     const userExists = await User.findOne({ $or: [{ email }, { username }] });
//     if (userExists) {
//       console.log('User already exists:', { username, email });
//       return res.status(400).json({ message: 'Email or username already exists' });
//     }

//     const user = new User({ username, email, password, role: role || 'user' });
//     await user.save();
//     console.log('User created successfully:', { id: user._id, username, email, role });

//     res.status(201).json({
//       message: 'User created successfully',
//       user: { id: user._id, username: user.username, email: user.email, role: user.role },
//     });
//   } catch (error) {
//     console.error('Error creating user:', error.message);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Get all users (admin only)
// export const getAllUsers = async (req, res) => {
//   try {
//     console.log('Fetching all users');
//     const users = await User.find().select('-password');
//     console.log('Users fetched:', users.length);
//     res.status(200).json(users);
//   } catch (error) {
//     console.error('Error fetching users:', error.message);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Get user by ID (self or admin)
// export const getUserById = async (req, res) => {
//   try {
//     console.log('Fetching user by ID:', req.params.id, 'for user:', req.user.id);
//     if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
//       console.log('Access denied: User is not admin and ID does not match');
//       return res.status(403).json({ message: 'Access denied: You can only view your own data' });
//     }
//     const user = await User.findById(req.params.id).select('-password');
//     if (!user) {
//       console.log('User not found:', req.params.id);
//       return res.status(404).json({ message: 'User not found' });
//     }
//     console.log('User fetched:', { id: user._id, username: user.username, email: user.email });
//     res.status(200).json(user);
//   } catch (error) {
//     console.error('Error fetching user by ID:', error.message);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Get own user data (for non-admin)
// export const getOwnUser = async (req, res) => {
//   try {
//     console.log('Fetching own user data for ID:', req.user.id);
//     const user = await User.findById(req.user.id).select('-password');
//     if (!user) {
//       console.log('User not found:', req.user.id);
//       return res.status(404).json({ message: 'User not found' });
//     }
//     console.log('Own user data fetched:', { id: user._id, username: user.username, email: user.email });
//     res.status(200).json(user);
//   } catch (error) {
//     console.error('Error fetching own user:', error.message);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Update user (self or admin)
// export const updateUser = async (req, res) => {
//   try {
//     console.log('Updating user:', req.params.id, 'with data:', req.body);
//     if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
//       console.log('Access denied: User is not admin and ID does not match');
//       return res.status(403).json({ message: 'Access denied: You can only update your own data' });
//     }
//     const { username, email, password, role } = req.body;
//     const updateData = {};
//     if (username) updateData.username = username;
//     if (email) updateData.email = email;
//     if (password) updateData.password = password;
//     if (req.user.role === 'admin' && role) updateData.role = role;

//     const user = await User.findByIdAndUpdate(req.params.id, updateData, {
//       new: true,
//       runValidators: true,
//     }).select('-password');
//     if (!user) {
//       console.log('User not found for update:', req.params.id);
//       return res.status(404).json({ message: 'User not found' });
//     }
//     console.log('User updated successfully:', { id: user._id, username: user.username, email: user.email, role: user.role });
//     res.status(200).json({ message: 'User updated successfully', user });
//   } catch (error) {
//     console.error('Error updating user:', error.message);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Delete user (admin only)
// export const deleteUser = async (req, res) => {
//   try {
//     console.log('Deleting user:', req.params.id);
//     const user = await User.findByIdAndDelete(req.params.id);
//     if (!user) {
//       console.log('User not found for deletion:', req.params.id);
//       return res.status(404).json({ message: 'User not found' });
//     }
//     console.log('User deleted successfully:', req.params.id);
//     res.status(200).json({ message: 'User deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting user:', error.message);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };


import jwt from 'jsonwebtoken';
import User from '../model/User.js';

// Create default admin user
export const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin1@gmail.com' });
    console.log('Checking for admin with email: admin1@gmail.com, found:', adminExists ? 'Yes' : 'No');

    if (adminExists) {
      // If admin exists, update password and role if necessary
      if (adminExists.role !== 'admin') {
        adminExists.role = 'admin';
        await adminExists.save();
        console.log('Default admin role updated to admin');
      }
      // Reset password if it doesn't match
      if (!(await adminExists.comparePassword('admin123'))) {
        adminExists.password = 'admin123'; // Will be hashed by pre-save hook
        await adminExists.save();
        console.log('Default admin password reset to admin123');
      } else {
        console.log('Default admin password is correct');
      }
      console.log('Default admin already exists:', {
        username: adminExists.username,
        email: adminExists.email,
        role: adminExists.role,
      });
    } else {
      // Create new admin if none exists
      const admin = new User({
        username: 'admin1',
        email: 'admin1@gmail.com',
        password: 'admin123',
        role: 'admin',
      });
      await admin.save();
      console.log('Default admin created:', {
        username: admin.username,
        email: admin.email,
        role: admin.role,
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
    console.log('Login attempt with payload:', { email, password });

    if (!email || !password) {
      console.log('Missing email/username or password');
      return res.status(400).json({ message: 'Username or email and password are required' });
    }

    // Use collation for case-insensitive query
    const user = await User.findOne(
      {
        $or: [
          { email: email.trim() },
          { username: email.trim() },
        ],
      },
      null,
      { collation: { locale: 'en', strength: 2 } } // Case-insensitive collation
    );

    console.log('Found user:', user ? {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    } : 'No user found');

    if (!user) {
      console.log('User not found for input:', email);
      return res.status(401).json({ message: 'Invalid username/email or password' });
    }

    const isMatch = await user.comparePassword(password);
    console.log('Password match for user', user.username, ':', isMatch);

    if (!isMatch) {
      console.log('Password mismatch for user:', user.username);
      return res.status(401).json({ message: 'Invalid username/email or password' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not defined' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    console.log('Login successful for user:', user.username);
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
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user ID and role to request
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
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (req.user.role === 'admin' && role) updateData.role = role;

    // Find the user first
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('User not found for update:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (req.user.role === 'admin' && role) user.role = role;
    if (password) {
      user.password = password; // Set new password
      user.markModified('password'); // Explicitly mark password as modified to trigger pre-save hook
      console.log('Password field marked as modified for user:', req.params.id);
    }

    // Save the updated user (pre-save hook will hash the password if modified)
    await user.save();

    // Fetch the updated user without the password
    const updatedUser = await User.findById(req.params.id).select('-password');
    console.log('User updated successfully:', { id: updatedUser._id, username: updatedUser.username, email: updatedUser.email, role: updatedUser.role });

    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error.message);
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