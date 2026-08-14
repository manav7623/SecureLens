const express = require('express');
const { sequelize, initializeDatabase } = require('./config/database');
const setupAssociations = require('./models/associations');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/security', require('./routes/security'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/content', require('./routes/content'));
app.use('/api/instagram', require('./routes/instagram'));
app.use('/api/instagram', require('./routes/instagram'));

// Socket.IO for real-time chat
const connectedUsers = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    const userRoom = String(userId);
    console.log(`[Socket.IO] User ${userId} connected and joined room: ${userRoom}`);
    connectedUsers[userRoom] = socket.id;
    socket.join(userRoom);
  });

  socket.on('sendMessage', async (data) => {
    const { receiverId, message, senderId, conversationId } = data;
    const receiverRoom = String(receiverId);
    console.log(`[Socket.IO] sendMessage socket event from ${senderId} to ${receiverRoom}`);
    
    // Emit to receiver if online
    if (connectedUsers[receiverRoom]) {
      io.to(connectedUsers[receiverRoom]).emit('receiveMessage', {
        senderId,
        message,
        conversationId,
        timestamp: new Date()
      });
    }
  });

  socket.on('disconnect', () => {
    Object.keys(connectedUsers).forEach(userId => {
      if (connectedUsers[userId] === socket.id) {
        console.log(`[Socket.IO] User ${userId} disconnected`);
        delete connectedUsers[userId];
      }
    });
  });
});

// Make io accessible in routes
app.set('io', io);

// MongoDB Connection & Initialization
(async () => {
  try {
    await initializeDatabase();
    setupAssociations();
    console.log('✅ MongoDB Database Connected');

    // Automatically populate mock analytics for any creator that has uninitialized values (like Manav Patel)
    const User = require('./models/User');
    const creators = await User.find({ role: 'creator' });
    for (const c of creators) {
      const p = c.creatorProfile || {};
      if (!p.aiScore || p.aiScore === 0 || !p.totalFollowers) {
        const followers = Math.floor(10000 + Math.random() * 90000);
        const engagement = parseFloat((3 + Math.random() * 5).toFixed(2));
        const fake = Math.floor(2 + Math.random() * 10);
        const aiScore = Math.floor(70 + Math.random() * 20);

        c.creatorProfile = {
          niche: p.niche && p.niche.length > 0 ? p.niche : ['Tech', 'Lifestyle'],
          socialLinks: p.socialLinks && Object.keys(p.socialLinks).length > 0 ? p.socialLinks : {
            instagram: { username: c.name.toLowerCase().replace(/ /g, '_'), followers: Math.floor(followers * 0.6) },
            youtube: { username: c.name.toLowerCase().replace(/ /g, ''), subscribers: Math.floor(followers * 0.4) }
          },
          aiScore,
          totalFollowers: followers,
          engagementRate: engagement,
          fakeFollowerPercentage: fake,
          bio: p.bio || 'Content creator sharing tech reviews and styling ideas.',
          location: p.location || 'Mumbai, India',
          portfolio: p.portfolio || []
        };
        c.markModified('creatorProfile');
        await c.save();
        console.log(`[Database Init] Populated mock profile metrics for creator: ${c.name}`);
      }
    }
  } catch (err) {
    console.error('❌ Database Initialization Error:', err);
  }
})();

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
