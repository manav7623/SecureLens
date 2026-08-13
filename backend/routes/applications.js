const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Campaign = require('../models/Campaign');
const { auth } = require('../middleware/auth');

// Apply to campaign
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'creator') {
      return res.status(403).json({ error: 'Only creators can apply' });
    }

    const { campaignId, proposal, proposedRate, deliverables, timeline } = req.body;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status !== 'active') return res.status(400).json({ error: 'Campaign is not active' });

    // Check if already applied
    const existingApp = await Application.findOne({
      campaign: campaignId,
      creator: req.user._id
    });
    if (existingApp) return res.status(400).json({ error: 'Already applied to this campaign' });

    const application = new Application({
      campaign: campaignId,
      creator: req.user._id,
      brand: campaign.brand,
      proposal,
      proposedRate,
      deliverables: deliverables || [],
      timeline
    });
    await application.save();

    // Update creator collaboration count
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'creatorProfile.collaborationCount': 1 }
    });

    res.status(201).json({ message: 'Application submitted', application });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get creator's applications
router.get('/my', auth, async (req, res) => {
  try {
    const applications = await Application.find({ creator: req.user._id })
      .populate('campaign', 'title budget status niche')
      .populate('brand', 'name brandProfile avatar')
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get campaign applications (for brand)
router.get('/campaign/:campaignId', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.campaignId,
      brand: req.user._id
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const applications = await Application.find({ campaign: req.params.campaignId })
      .populate('creator', 'name creatorProfile avatar email')
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update application status (brand only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, dealAmount } = req.body;
    
    const application = await Application.findOne({
      _id: req.params.id,
      brand: req.user._id
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    application.status = status;
    if (dealAmount) application.dealAmount = dealAmount;
    if (status === 'completed') {
      application.completedAt = new Date();
    } else {
      application.completedAt = null;
    }

    await application.save();
    res.json({ message: 'Status updated', application });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single application
router.get('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('campaign')
      .populate('creator', '-password')
      .populate('brand', '-password');

    if (!application) return res.status(404).json({ error: 'Not found' });

    // Only allow participants to view
    const isParticipant = 
      application.creator._id.toString() === req.user._id.toString() ||
      application.brand._id.toString() === req.user._id.toString();
    
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ application });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
