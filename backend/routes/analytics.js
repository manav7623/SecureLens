const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Application = require('../models/Application');
const { auth } = require('../middleware/auth');

// Creator analytics
router.get('/creator', auth, async (req, res) => {
  try {
    const creator = await User.findById(req.user._id);
    
    const totalApplications = await Application.countDocuments({ creator: req.user._id });
    const acceptedApplications = await Application.countDocuments({ 
      creator: req.user._id, 
      status: 'accepted' 
    });
    const completedCollabs = await Application.countDocuments({
      creator: req.user._id,
      status: 'completed'
    });
    
    const earnings = await Application.aggregate([
      { $match: { creator: req.user._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$dealAmount' } } }
    ]);

    // Monthly application trend
    const monthlyData = await Application.aggregate([
      { $match: { creator: req.user._id } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);

    res.json({
      stats: {
        totalApplications,
        acceptedApplications,
        completedCollabs,
        totalEarnings: earnings[0]?.total || 0,
        successRate: totalApplications > 0 ? Math.round((acceptedApplications / totalApplications) * 100) : 0
      },
      profile: creator.creatorProfile,
      monthlyData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Brand analytics
router.get('/brand', auth, async (req, res) => {
  try {
    const totalCampaigns = await Campaign.countDocuments({ brand: req.user._id });
    const activeCampaigns = await Campaign.countDocuments({ brand: req.user._id, status: 'active' });
    const totalApplications = await Application.countDocuments({ brand: req.user._id });
    const acceptedApplications = await Application.countDocuments({
      brand: req.user._id,
      status: 'accepted'
    });

    const totalSpend = await Application.aggregate([
      { $match: { brand: req.user._id, status: { $in: ['accepted', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$dealAmount' } } }
    ]);

    // Campaign performance
    const campaigns = await Campaign.find({ brand: req.user._id })
      .select('title views status')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalCampaigns,
        activeCampaigns,
        totalApplications,
        acceptedApplications,
        totalSpend: totalSpend[0]?.total || 0
      },
      recentCampaigns: campaigns
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
