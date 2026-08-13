const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  },
  messageType: {
    type: String,
    enum: ['text', 'deal', 'system', 'media'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileType: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
