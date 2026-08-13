const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
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
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  platformFee: {
    type: Number,
    default: 0
  },
  creatorAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'held', 'released', 'refunded', 'disputed'],
    default: 'pending'
  },
  paymentMethod: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({ type: 'card' })
  },
  transactionId: {
    type: String,
    unique: true
  },
  paidAt: {
    type: Date,
    default: null
  },
  heldAt: {
    type: Date,
    default: null
  },
  releasedAt: {
    type: Date,
    default: null
  },
  refundedAt: {
    type: Date,
    default: null
  },
  creatorBankDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Pre-validate hook to generate transaction ID
PaymentSchema.pre('validate', function (next) {
  if (!this.transactionId) {
    this.transactionId = 'TXN' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;
