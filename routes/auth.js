const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, sendOTP, sendWelcomeEmail } = require('../utils/emailService');
const auth = require('../middleware/auth');

const router = express.Router();

const OTP_EXPIRY_MINUTES = 10;

// ─── POST /signup ─────────────────────────────────────────────────────────────
router.post('/signup', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required.',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(409).json({
        success: false,
        message: `${field} already exists.`,
      });
    }

    // Create user (not verified yet)
    const user = await User.create({ username, email, password });

    // Generate and save OTP
    const otp = generateOTP();
    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    };
    await user.save();

    // Send OTP email
    await sendOTP(email, otp, 'signup');

    res.status(201).json({
      success: true,
      message: 'OTP sent to email',
      userId: user._id,
    });
  } catch (error) {
    // Handle mongoose duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
      });
    }
    next(error);
  }
});

// ─── POST /verify-otp ────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required.',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check OTP validity
    if (!user.otp.code || user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP.',
      });
    }

    if (user.otp.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Mark as verified, clear OTP
    user.isVerified = true;
    user.otp = { code: null, expiresAt: null };
    await user.save();

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.username).catch((err) => {
      console.error('Failed to send welcome email:', err.message);
    });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /login ──────────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Generate OTP for verification
      const otp = generateOTP();
      user.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      };
      await user.save();
      await sendOTP(user.email, otp, 'signup');

      return res.json({
        success: true,
        message: 'Account not verified. OTP sent to email.',
        userId: user._id,
        requiresOTP: true,
        requiresVerification: true,
      });
    }

    // If 2FA is enabled, send OTP
    if (user.twoFactorEnabled) {
      const otp = generateOTP();
      user.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      };
      await user.save();
      await sendOTP(user.email, otp, 'login');

      return res.json({
        success: true,
        message: 'OTP sent',
        userId: user._id,
        requiresOTP: true,
      });
    }

    // No 2FA — issue token directly
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /verify-login-otp ──────────────────────────────────────────────────
router.post('/verify-login-otp', async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required.',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Verify OTP
    if (!user.otp.code || user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP.',
      });
    }

    if (user.otp.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Clear OTP
    user.otp = { code: null, expiresAt: null };
    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /resend-otp ────────────────────────────────────────────────────────
router.post('/resend-otp', async (req, res, next) => {
  try {
    const { userId, purpose } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const otp = generateOTP();
    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    };
    await user.save();

    await sendOTP(user.email, otp, purpose || 'signup');

    res.json({
      success: true,
      message: 'OTP resent successfully.',
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /forgot-password ────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account exists with that email, an OTP has been sent.',
      });
    }

    const otp = generateOTP();
    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    };
    await user.save();

    await sendOTP(user.email, otp, 'password-reset');

    res.json({
      success: true,
      message: 'If an account exists with that email, an OTP has been sent.',
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /reset-password ─────────────────────────────────────────────────────
router.post('/reset-password', async (req, res, next) => {
  try {
    const { userId, otp, newPassword } = req.body;

    if (!userId || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'User ID, OTP, and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (!user.otp.code || user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP.',
      });
    }

    if (user.otp.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    user.password = newPassword;
    user.otp = { code: null, expiresAt: null };
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      message: 'Password reset successfully.',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /change-password (Protected) ───────────────────────────────────────
router.post('/change-password', auth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /me (Protected) ─────────────────────────────────────────────────────
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
