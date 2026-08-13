const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  niche: {
    type: [String],
    default: []
  },
  platforms: {
    type: [String],
    default: []
  },
  budget: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({ min: 0, max: 0, currency: 'INR' })
  },
  requirements: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({ minFollowers: 1000, minEngagement: 1, location: [] })
  },
  deliverables: {
    type: [String],
    default: []
  },
  deadline: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed', 'completed'],
    default: 'active'
  },
  shortlistedCreators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isBoosted: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for applications matching this campaign
CampaignSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'campaign'
});

const Campaign = mongoose.model('Campaign', CampaignSchema);

module.exports = Campaign;
