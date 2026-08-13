const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (!['creator', 'brand'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    let creatorProfile = {};
    if (role === 'creator') {
      const followers = Math.floor(10000 + Math.random() * 90000);
      const engagement = parseFloat((3 + Math.random() * 5).toFixed(2));
      const fake = Math.floor(2 + Math.random() * 10);
      const aiScore = Math.floor(70 + Math.random() * 20);
      
      creatorProfile = {
        niche: ['Tech', 'Lifestyle'],
        socialLinks: {
          instagram: { username: name.toLowerCase().replace(/ /g, '_'), followers: Math.floor(followers * 0.6) },
          youtube: { username: name.toLowerCase().replace(/ /g, ''), subscribers: Math.floor(followers * 0.4) }
        },
        aiScore,
        totalFollowers: followers,
        engagementRate: engagement,
        fakeFollowerPercentage: fake,
        bio: 'Tech enthusiast, content creator, and gadget reviewer.',
        location: 'Mumbai, India',
        portfolio: []
      };
    }

    const user = new User({ name, email, password, role, creatorProfile });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        creatorProfile: user.creatorProfile,
        brandProfile: user.brandProfile
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    if (user.isBanned) return res.status(403).json({ error: 'Account has been banned' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        creatorProfile: user.creatorProfile,
        brandProfile: user.brandProfile,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});


const { sendResetPasswordOTPEmail } = require('../utils/email');

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User does not exist, sorry.' });
    }

    // Generate a 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to user DB
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = new Date(Date.now() + 600000); // 10 minutes from now
    await user.save();

    // Send email
    const emailResult = await sendResetPasswordOTPEmail(user.email, otp);

    let message = 'We have sent a 6-digit OTP code to your email.';
    if (emailResult.mock) {
      message = `Mock Mode: OTP generated: ${emailResult.otp}. Use this to reset password.`;
    }

    res.json({ message, mockUrl: emailResult.resetUrl, otp: emailResult.otp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ error: 'Email, OTP code, and new password are required' });
    }

    const emailCheck = await User.findOne({ email });
    if (!emailCheck) {
      return res.status(404).json({ error: 'Email is not exist' });
    }

    const user = await User.findOne({ email, resetPasswordToken: otp });

    if (!user || !user.resetPasswordExpires || new Date(user.resetPasswordExpires) < new Date()) {
      return res.status(400).json({ error: 'OTP code is invalid or has expired.' });
    }

    // Update password
    user.password = password; // Hook will automatically hash it
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
