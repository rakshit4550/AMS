import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import User from '../model/User.js';
import nodemailer from 'nodemailer'; // Add this import for email sending

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'flagcartshop@gmail.com',
    pass: process.env.EMAIL_PASS || 'dtngccwcvtivixmt',
  },
});

// Function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

const cleanRole = (role) => {
  return ['admin', 'user', 'trader'].includes(role) ? role : 'user';
};

const LIMITED_ROLES = ['user', 'trader'];

const normalizeSubscriptionExpiry = ({ role, subscriptionExpiresAt }) => {
  if (!LIMITED_ROLES.includes(role)) return null;

  if (!subscriptionExpiresAt) {
    return null;
  }

  const expiry = new Date(subscriptionExpiresAt);
  if (Number.isNaN(expiry.getTime())) {
    return null;
  }

  // datetime-local se exact expiry time aata hai.
  // Admin jis date-time ko select karega, usi exact time par account expire hoga.
  return expiry;
};

const validateSubscriptionExpiry = ({ role, subscriptionExpiresAt }) => {
  if (!LIMITED_ROLES.includes(role)) return { ok: true, expiresAt: null };

  const expiresAt = normalizeSubscriptionExpiry({ role, subscriptionExpiresAt });
  if (!expiresAt) {
    return { ok: false, message: 'Please select account validity expiry date.' };
  }

  if (expiresAt.getTime() <= Date.now()) {
    return { ok: false, message: 'Account validity expiry date must be today or a future date.' };
  }

  return { ok: true, expiresAt };
};

const getSubscriptionInfo = (user) => {
  const expiresAt = user?.subscriptionExpiresAt || null;
  const isLimitedRole = LIMITED_ROLES.includes(user?.role);

  if (!isLimitedRole) {
    return {
      subscriptionExpiresAt: null,
      subscriptionStatus: 'unlimited',
      subscriptionRemainingDays: null,
    };
  }

  if (!expiresAt) {
    return {
      subscriptionExpiresAt: null,
      subscriptionStatus: 'active',
      subscriptionRemainingDays: null,
    };
  }

  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return {
    subscriptionExpiresAt: expiresAt,
    subscriptionStatus: diffMs <= 0 ? 'expired' : 'active',
    subscriptionRemainingDays: diffMs <= 0 ? 0 : Math.ceil(diffMs / (24 * 60 * 60 * 1000)),
  };
};

const toSafeUser = (user) => ({
  id: user._id,
  _id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  autoJobEnabled: user.autoJobEnabled,
  twoFactorEnabled: Boolean(user.twoFactorEnabled),
  ...getSubscriptionInfo(user),
});

const TOTP_APP_NAME = process.env.TOTP_APP_NAME || 'myacbook';
const TWO_FA_LOGIN_PURPOSE = '2fa-login';

const signAuthToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      autoJobEnabled: user.autoJobEnabled || false,
      subscriptionExpiresAt: user.subscriptionExpiresAt || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

const buildLoginSuccessPayload = (user) => ({
  message: 'Login successful',
  token: signAuthToken(user),
  role: user.role,
  id: user._id,
  username: user.username,
  email: user.email,
  twoFactorEnabled: Boolean(user.twoFactorEnabled),
  ...getSubscriptionInfo(user),
});

const createTempLoginToken = (userId) =>
  jwt.sign(
    { id: userId, purpose: TWO_FA_LOGIN_PURPOSE },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );

const getUserIdFromTempLoginToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== TWO_FA_LOGIN_PURPOSE || !decoded.id) {
      return null;
    }
    return decoded.id;
  } catch {
    return null;
  }
};

const verifyTotpCode = (secret, code) =>
  speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: String(code).trim(),
    window: 1,
  });

const isSubscriptionExpired = (user) => {
  if (!LIMITED_ROLES.includes(user?.role)) return false;
  if (!user?.subscriptionExpiresAt) return false; // legacy users remain active until admin sets a validity.
  return new Date(user.subscriptionExpiresAt).getTime() <= Date.now();
};


const getAdminEnvCredentials = () => ({
  email: String(process.env.ADMIN_EMAIL || '').trim(),
  username: String(process.env.ADMIN_USERNAME || '').trim(),
  password: String(process.env.ADMIN_PASSWORD || '').trim(),
  syncFromEnv: process.env.ADMIN_SYNC_CREDENTIALS === 'true',
});

export const createDefaultAdmin = async () => {
  try {
    const { email, username, password, syncFromEnv } = getAdminEnvCredentials();

    if (!email || !username || !password) {
      console.log(
        'Admin bootstrap skipped: set ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD in .env'
      );
      return;
    }

    const adminByEmail = await User.findOne({ email });
    const primaryAdmin =
      adminByEmail || (await User.findOne({ role: 'admin' }).sort({ createdAt: 1 }));

    if (syncFromEnv) {
      if (primaryAdmin) {
        primaryAdmin.email = email;
        primaryAdmin.username = username;
        primaryAdmin.password = password;
        primaryAdmin.role = 'admin';
        await primaryAdmin.save();

        console.log('Admin credentials synced from .env to database:', {
          email: primaryAdmin.email,
          username: primaryAdmin.username,
          role: primaryAdmin.role,
        });
        return;
      }

      const admin = new User({
        username,
        email,
        password,
        role: 'admin',
      });
      await admin.save();

      console.log('Admin created from .env (sync mode):', {
        email: admin.email,
        username: admin.username,
        role: admin.role,
      });
      return;
    }

    if (adminByEmail) {
      if (adminByEmail.role !== 'admin') {
        adminByEmail.role = 'admin';
        await adminByEmail.save();
        console.log('Admin role restored for user:', adminByEmail.email);
      }

      console.log('Admin already exists, credentials unchanged:', {
        email: adminByEmail.email,
        username: adminByEmail.username,
        role: adminByEmail.role,
      });
      return;
    }

    if (primaryAdmin) {
      console.log(
        'An admin account already exists with a different email. Credentials were not changed. Set ADMIN_SYNC_CREDENTIALS=true in .env and restart to update email, username, or password from .env.'
      );
      return;
    }

    const admin = new User({
      username,
      email,
      password,
      role: 'admin',
    });
    await admin.save();

    console.log('Default admin created from .env:', {
      email: admin.email,
      username: admin.username,
      role: admin.role,
    });
  } catch (error) {
    if (error.code === 11000) {
      console.error(
        'Admin bootstrap failed: email or username already exists for another user',
        error.message
      );
    } else {
      console.error('Error creating/updating default admin:', error.message);
    }
  }
};

// Forgot Password - Send OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Forgot password request for email:', email);

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      console.log('User not found for forgot password:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    console.log('Generated OTP for user:', user.email, 'OTP:', otp, 'Expiry:', new Date(otpExpiry));

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Password Reset OTP - AMS',
      text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Failed to send OTP email' });
      } else {
        console.log('Email sent:', info.response);
        res.status(200).json({ message: 'OTP sent to your email' });
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log('Verify OTP request for email:', email, 'OTP:', otp);

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      console.log('User not found for OTP verification:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp !== otp) {
      console.log('Invalid OTP for user:', user.email);
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpiry < Date.now()) {
      console.log('OTP expired for user:', user.email);
      return res.status(400).json({ message: 'OTP expired' });
    }

    console.log('OTP verified successfully for user:', user.email);
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    console.log('Reset password request for email:', email, 'New password length:', newPassword ? newPassword.length : 0);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      console.log('User not found for password reset:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp !== otp) {
      console.log('Invalid OTP for password reset:', user.email);
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpiry < Date.now()) {
      console.log('OTP expired for password reset:', user.email);
      return res.status(400).json({ message: 'OTP expired' });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    console.log('Password reset successfully for user:', user.email);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt with payload:', { email: email?.trim(), password: '****' });

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

    if (isSubscriptionExpired(user)) {
      console.log('Subscription expired for user:', user.username);
      return res.status(403).json({
        message: 'Please recharge your account',
        ...getSubscriptionInfo(user),
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not defined' });
    }

    if (user.twoFactorEnabled) {
      const userWithSecret = await User.findById(user._id).select('+twoFactorSecret');
      if (userWithSecret?.twoFactorSecret) {
        const tempToken = createTempLoginToken(user._id);
        console.log('2FA required for user:', user.username);
        return res.status(200).json({
          requires2FA: true,
          message: 'Enter Google Authenticator code',
          tempToken,
        });
      }

      user.twoFactorEnabled = false;
      await user.save();
    }

    console.log('Login successful for user:', user.username, 'Token generated');
    return res.status(200).json(buildLoginSuccessPayload(user));
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Step 2 of login: verify Google Authenticator code
export const verify2FA = async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !String(tempToken).trim()) {
      return res.status(400).json({ message: 'Temporary login token is required' });
    }

    if (!code || !String(code).trim()) {
      return res.status(400).json({ message: 'Authenticator code is required' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not defined' });
    }

    const userId = getUserIdFromTempLoginToken(tempToken);
    if (!userId) {
      return res.status(401).json({
        message: 'Login session expired or invalid. Please log in again',
      });
    }

    const user = await User.findById(userId).select('+twoFactorSecret');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: 'Two-factor authentication is not enabled for this account' });
    }

    if (isSubscriptionExpired(user)) {
      return res.status(403).json({
        message: 'Please recharge your account',
        ...getSubscriptionInfo(user),
      });
    }

    const isCodeValid = verifyTotpCode(user.twoFactorSecret, code);
    if (!isCodeValid) {
      return res.status(400).json({ message: 'Invalid authenticator code' });
    }

    return res.status(200).json(buildLoginSuccessPayload(user));
  } catch (error) {
    console.error('verify2FA error:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate Google Authenticator secret and QR code (logged-in user)
export const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+twoFactorSecret');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: 'Two-factor authentication is already enabled' });
    }

    const secret = speakeasy.generateSecret({
      name: `${TOTP_APP_NAME} (${user.email})`,
      length: 20,
    });

    user.twoFactorSecret = secret.base32;
    user.twoFactorEnabled = false;
    await user.save();

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return res.status(200).json({
      message: 'Scan the QR code in Google Authenticator, then confirm with a code',
      secret: secret.base32,
      qrCode,
    });
  } catch (error) {
    console.error('setup2FA error:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Confirm and enable 2FA after scanning QR code
export const enable2FA = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || !String(code).trim()) {
      return res.status(400).json({ message: 'Authenticator code is required' });
    }

    const user = await User.findById(req.user.id).select('+twoFactorSecret');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: 'Two-factor authentication is already enabled' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: 'Please set up two-factor authentication first' });
    }

    const isCodeValid = verifyTotpCode(user.twoFactorSecret, code);
    if (!isCodeValid) {
      return res.status(400).json({ message: 'Invalid authenticator code' });
    }

    user.twoFactorEnabled = true;
    await user.save();

    return res.status(200).json({
      message: 'Two-factor authentication enabled successfully',
      twoFactorEnabled: true,
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error('enable2FA error:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Disable 2FA (requires password + authenticator code)
export const disable2FA = async (req, res) => {
  try {
    const { password, code } = req.body;

    if (!password || !String(password).trim()) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (!code || !String(code).trim()) {
      return res.status(400).json({ message: 'Authenticator code is required' });
    }

    const user = await User.findById(req.user.id).select('+twoFactorSecret');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: 'Two-factor authentication is not enabled' });
    }

    const isPasswordValid = await user.comparePassword(String(password).trim());
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    const isCodeValid = verifyTotpCode(user.twoFactorSecret, code);
    if (!isCodeValid) {
      return res.status(400).json({ message: 'Invalid authenticator code' });
    }

    user.twoFactorSecret = null;
    user.twoFactorEnabled = false;
    await user.save();

    return res.status(200).json({
      message: 'Two-factor authentication disabled successfully',
      twoFactorEnabled: false,
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error('disable2FA error:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Logout
export const logout = (req, res) => {
  console.log('Logout request received');
  res.status(200).json({ message: 'Logout successful' });
};

export const verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    console.log('No token provided in headers');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found. Please log in again.' });
    }

    if (isSubscriptionExpired(user)) {
      return res.status(403).json({
        message: 'Please recharge your account',
        ...getSubscriptionInfo(user),
      });
    }

    req.user = { id: decoded.id, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token', error: error.message });
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
    const { username, email, password, role, subscriptionExpiresAt } = req.body;
    const safeRole = cleanRole(role);
    console.log('Creating user with data:', { username, email, role: safeRole, subscriptionExpiresAt });

    if (!username || !email || !password) {
      console.log('Missing required fields for user creation');
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      console.log('User already exists:', { username, email });
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    const expiryValidation = validateSubscriptionExpiry({ role: safeRole, subscriptionExpiresAt });
    if (!expiryValidation.ok) {
      return res.status(400).json({ message: expiryValidation.message });
    }

    const user = new User({
      username,
      email,
      password,
      role: safeRole,
      subscriptionExpiresAt: expiryValidation.expiresAt,
    });
    await user.save();
    console.log('User created successfully:', { id: user._id, username, email, role: user.role });

    res.status(201).json({
      message: 'User created successfully',
      user: toSafeUser(user),
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
    const users = await User.find().select('-password -otp -otpExpiry');
    const safeUsers = users.map(toSafeUser);
    console.log('Users fetched:', users.length);
    res.status(200).json(safeUsers);
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
    const user = await User.findById(req.params.id).select('-password -otp -otpExpiry');
    if (!user) {
      console.log('User not found:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User fetched:', { id: user._id, username: user.username, email: user.email });
    res.status(200).json(toSafeUser(user));
  } catch (error) {
    console.error('Error fetching user by ID:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get own user data (for non-admin)
export const getOwnUser = async (req, res) => {
  try {
    console.log('Fetching own user data for ID:', req.user.id);
    const user = await User.findById(req.user.id).select('-password -otp -otpExpiry');
    if (!user) {
      console.log('User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Own user data fetched:', { id: user._id, username: user.username, email: user.email });
    res.status(200).json(toSafeUser(user));
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

    const { username, email, password, role, subscriptionExpiresAt } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('User not found for update:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) user.username = username.trim();
    if (email) user.email = email.trim();
    if (req.user.role === 'admin' && role) user.role = cleanRole(role);
    if (req.user.role === 'admin') {
      if (!LIMITED_ROLES.includes(user.role)) {
        user.subscriptionExpiresAt = null;
      } else {
        const expiryValidation = validateSubscriptionExpiry({ role: user.role, subscriptionExpiresAt });
        if (!expiryValidation.ok) {
          return res.status(400).json({ message: expiryValidation.message });
        }
        user.subscriptionExpiresAt = expiryValidation.expiresAt;
      }
    }
    if (password && password.trim()) {
      console.log('Updating password for user:', user._id);
      user.password = password;
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

    const updatedUser = await User.findById(req.params.id).select('-password -otp -otpExpiry');

    let newToken = null;
    if (req.user.id === req.params.id) {
      newToken = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
          subscriptionExpiresAt: user.subscriptionExpiresAt || null,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      console.log('Generated new token for updated user:', user.username);
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: toSafeUser(updatedUser),
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

const PASSWORD_CHANGE_PURPOSE = 'password-change';

const createPasswordChangeToken = (userId) =>
  jwt.sign(
    { id: userId, purpose: PASSWORD_CHANGE_PURPOSE },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );

const isValidPasswordChangeToken = (token, userId) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return (
      decoded.purpose === PASSWORD_CHANGE_PURPOSE &&
      String(decoded.id) === String(userId)
    );
  } catch {
    return false;
  }
};

// Step 1: Verify current password before allowing password change
export const verifyOldPassword = async (req, res) => {
  try {
    const { oldPassword } = req.body;

    if (!oldPassword || !String(oldPassword).trim()) {
      return res.status(400).json({ message: 'Current password is required' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not defined' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isOldPasswordValid = await user.comparePassword(String(oldPassword).trim());
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const passwordChangeToken = createPasswordChangeToken(user._id);

    return res.status(200).json({
      message: 'Current password verified successfully',
      verified: true,
      passwordChangeToken,
    });
  } catch (error) {
    console.error('Error verifying old password:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Step 2: Set new password after old password was verified
export const changePassword = async (req, res) => {
  try {
    const { password, confirmPassword, passwordChangeToken } = req.body;

    if (!passwordChangeToken || !String(passwordChangeToken).trim()) {
      return res.status(400).json({
        message: 'Please verify your current password first',
      });
    }

    if (!password || !String(password).trim()) {
      return res.status(400).json({ message: 'New password is required' });
    }

    if (!confirmPassword || !String(confirmPassword).trim()) {
      return res.status(400).json({ message: 'Confirm password is required' });
    }

    const trimmedPassword = String(password).trim();
    const trimmedConfirmPassword = String(confirmPassword).trim();

    if (trimmedPassword !== trimmedConfirmPassword) {
      return res.status(400).json({ message: 'Password and confirm password do not match' });
    }

    if (trimmedPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!isValidPasswordChangeToken(passwordChangeToken, req.user.id)) {
      return res.status(401).json({
        message: 'Password verification expired or invalid. Please verify your current password again',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = trimmedPassword;
    await user.save();

    const newToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        autoJobEnabled: user.autoJobEnabled,
        subscriptionExpiresAt: user.subscriptionExpiresAt || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Password updated successfully',
      token: newToken,
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error('Error changing password:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
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

    const newToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        autoJobEnabled: user.autoJobEnabled,
        subscriptionExpiresAt: user.subscriptionExpiresAt || null,
      },
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
