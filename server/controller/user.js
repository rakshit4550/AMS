import jwt from 'jsonwebtoken';
import Admin from '../model/User.js';

export const createDefaultAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: 'admin@example.com' });

    if (adminExists) {
      adminExists.email = 'admin@gmail.com';
      adminExists.password = 'admin123'; // Will be hashed by pre-save hook
      await adminExists.save();
      console.log('Default admin updated');
    } else {
      const admin = new Admin({
        email: 'admin@gmail.com',
        password: 'admin123',
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

createDefaultAdmin();

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not defined' });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const logout = (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
};