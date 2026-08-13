const mongoose = require('mongoose');

const ContentSubmissionSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
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
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  contentLinks: {
    type: [String],
    default: []
  },
  files: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  screenshots: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  deliverable: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'approved', 'revision_requested', 'rejected'],
    default: 'submitted'
  },
  brandFeedback: {
    type: String,
    default: null
  },
  revisionNote: {
    type: String,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const ContentSubmission = mongoose.model('ContentSubmission', ContentSubmissionSchema);

module.exports = ContentSubmission;
