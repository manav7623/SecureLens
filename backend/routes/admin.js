const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Application = require('../models/Application');
const { adminAuth } = require('../middleware/auth');

// Platform overview stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalCreators = await User.countDocuments({ role: 'creator' });
    const totalBrands = await User.countDocuments({ role: 'brand' });
    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
    const totalApplications = await Application.countDocuments();
    const completedDeals = await Application.countDocuments({ status: 'completed' });
    const bannedUsers = await User.countDocuments({ isBanned: true });

    res.json({
      totalUsers, totalCreators, totalBrands, totalCampaigns,
      activeCampaigns, totalApplications, completedDeals, bannedUsers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query['$or'] = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ban / Unban user
router.put('/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const { isBanned } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned },
      { new: true }
    ).select('-password');
    res.json({ message: `User ${isBanned ? 'banned' : 'unbanned'}`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify user
router.put('/users/:id/verify', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select('-password');
    res.json({ message: 'User verified', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Feature creator
router.put('/users/:id/feature', adminAuth, async (req, res) => {
  try {
    const { isFeatured } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 'creatorProfile.isFeatured': isFeatured },
      { new: true }
    ).select('-password');
    res.json({ message: `Creator ${isFeatured ? 'featured' : 'unfeatured'}`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all campaigns
router.get('/campaigns', adminAuth, async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('brand', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ campaigns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete campaign
router.delete('/campaigns/:id', adminAuth, async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
