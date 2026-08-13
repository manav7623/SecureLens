const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  proposal: {
    type: String,
    required: true
  },
  proposedRate: {
    type: Number,
    required: true
  },
  deliverables: {
    type: [String],
    default: []
  },
  timeline: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'shortlisted', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  dealAmount: {
    type: Number,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  rating: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({ brandRating: {}, creatorRating: {} })
  }
}, {
  timestamps: true
});

const Application = mongoose.model('Application', ApplicationSchema);

module.exports = Application;
