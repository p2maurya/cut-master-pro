const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper: send token response
const sendToken = (user, statusCode, res, message = 'Success') => {
  const token = user.getSignedToken();
  res.status(statusCode).json({
    success: true, message, token,
    user: {
      id: user._id, name: user.name, email: user.email,
      avatar: user.avatar, plan: user.plan,
      storageUsed: user.storageUsed,
      storageLimit: user.getStorageLimit(),
      videosCount: user.videosCount, projectsCount: user.projectsCount,
      createdAt: user.createdAt
    }
  });
};

// @POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields required' });
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password });
    sendToken(user, 201, res, 'Account created! Welcome to CutMaster Pro 🎬');
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    sendToken(user, 200, res, 'Welcome back! 🎬');
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    user: {
      id: user._id, name: user.name, email: user.email,
      avatar: user.avatar, plan: user.plan,
      storageUsed: user.storageUsed,
      storageLimit: user.getStorageLimit(),
      videosCount: user.videosCount, projectsCount: user.projectsCount,
      aiUsageToday: user.aiUsageToday, createdAt: user.createdAt
    }
  });
});

// @PUT /api/auth/update-profile
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, avatar }, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated', user: { name: user.name, avatar: user.avatar } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    user.password = newPassword;
    await user.save();
    sendToken(user, 200, res, 'Password changed successfully');
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @POST /api/auth/upgrade (simulate plan upgrade)
router.post('/upgrade', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['pro', 'business'].includes(plan))
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    const storageLimit = plan === 'pro' ? 53687091200 : 536870912000;
    await User.findByIdAndUpdate(req.user.id, { plan, planExpiry: expiry, storageLimit });
    res.json({ success: true, message: `Upgraded to ${plan.toUpperCase()} plan! 🎉` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
