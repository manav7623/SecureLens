const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const { auth } = require('../middleware/auth');

// Create campaign
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'brand') {
      return res.status(403).json({ error: 'Only brands can create campaigns' });
    }

    const campaign = new Campaign({ ...req.body, brand: req.user._id });
    await campaign.save();

    // Update brand campaign count
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'brandProfile.campaignCount': 1 }
    });

    res.status(201).json({ message: 'Campaign created', campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all active campaigns (for creators to browse)
router.get('/', auth, async (req, res) => {
  try {
    const { niche, platform, minBudget, maxBudget, search, page = 1, limit = 12 } = req.query;
    
    const query = { status: 'active' };
    if (niche) query.niche = { $in: niche.split(',') };
    if (platform) query.platforms = { $in: platform.split(',') };
    if (minBudget) query['budget.min'] = { $gte: parseInt(minBudget) };
    if (maxBudget) query['budget.max'] = { $lte: parseInt(maxBudget) };
    if (search) query['$or'] = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];

    const total = await Campaign.countDocuments(query);
    const campaigns = await Campaign.find(query)
      .populate('brand', 'name brandProfile avatar')
      .sort({ isBoosted: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ campaigns, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get brand's own campaigns
router.get('/my', auth, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ brand: req.user._id })
      .populate('applications')
      .sort({ createdAt: -1 });
    res.json({ campaigns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single campaign
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('brand', 'name brandProfile avatar')
      .populate({
        path: 'applications',
        populate: { path: 'creator', select: 'name creatorProfile avatar' }
      });
    
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // Increment views
    campaign.views += 1;
    await campaign.save();

    res.json({ campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update campaign
router.put('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, brand: req.user._id });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    Object.assign(campaign, req.body);
    await campaign.save();
    res.json({ message: 'Campaign updated', campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete campaign
router.delete('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, brand: req.user._id });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
