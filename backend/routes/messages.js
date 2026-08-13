const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup file upload folder
const uploadDir = 'uploads/messages';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max for videos
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|mp4|mov|avi|webm|quicktime|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext || mime) cb(null, true);
    else cb(new Error('Only images and videos allowed'));
  }
});

// Upload route
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = `/uploads/messages/${req.file.filename}`;
    res.status(200).json({ fileUrl, fileType: req.file.mimetype });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, message, conversationId, fileUrl, fileType } = req.body;

    const newMessage = new Message({
      conversationId,
      sender: req.user._id,
      receiver: receiverId,
      message: message || '',
      messageType: fileUrl ? 'media' : 'text',
      fileUrl,
      fileType
    });
    await newMessage.save();

    // Emit via socket
    const io = req.app.get('io');
    const receiverRoom = String(receiverId);
    console.log(`[Socket.IO] Emitting receiveMessage to room: ${receiverRoom}`);
    io.to(receiverRoom).emit('receiveMessage', {
      ...newMessage.toObject(),
      sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar, role: req.user.role }
    });

    res.status(201).json({ message: newMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages for a conversation
router.get('/:conversationId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { conversationId: req.params.conversationId, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all conversations
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    res.json({ conversations: messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear all chat in conversation
router.delete('/conversation/:conversationId', auth, async (req, res) => {
  try {
    const Application = require('../models/Application');
    const app = await Application.findById(req.params.conversationId);
    if (!app) return res.status(404).json({ error: 'Conversation not found' });

    const currentUserId = String(req.user._id);
    const creatorId = String(app.creatorId || app.creator);
    const brandId = String(app.brandId || app.brand);

    if (currentUserId !== creatorId && currentUserId !== brandId) {
      return res.status(403).json({ error: 'Unauthorized to clear this chat' });
    }

    await Message.deleteMany({ conversationId: req.params.conversationId });

    // Emit socket event to notify both parties
    const io = req.app.get('io');
    const otherUserId = currentUserId === creatorId ? brandId : creatorId;
    io.to(currentUserId).to(otherUserId).emit('chatCleared', { conversationId: req.params.conversationId });

    res.json({ message: 'Chat history cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete single message
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Verify sender
    if (String(message.senderId || message.sender) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await Message.findByIdAndDelete(req.params.id);

    // Emit socket event to notify other party about deletion
    const io = req.app.get('io');
    const receiverRoom = String(message.receiverId || message.receiver);
    const senderRoom = String(req.user._id);
    io.to(receiverRoom).to(senderRoom).emit('messageDeleted', { messageId: req.params.id, conversationId: message.conversationId });

    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
