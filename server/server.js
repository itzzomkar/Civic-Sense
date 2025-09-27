require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const database = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);
const defaultOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8081',
  // Vite dev server defaults
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
const envOrigins = (process.env.CLIENT_URL && process.env.CLIENT_URL.length > 0)
  ? process.env.CLIENT_URL.split(',')
  : [];
const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultOrigins]));

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  }
});

// Database connection
database.connect().then((connected) => {
  if (connected) {
    console.log('📦 Using MongoDB database');
  } else {
    console.log('📁 Using local JSON storage (fallback mode)');
  }
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!require('fs').existsSync(uploadsDir)) {
  require('fs').mkdirSync(uploadsDir, { recursive: true });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: database.isConnected ? 'MongoDB' : 'Local Storage',
    uptime: process.uptime()
  });
});

// Host info for LAN QR generation (returns first private IPv4)
app.get('/api/host-info', (req, res) => {
  try {
    const os = require('os');
    const nets = os.networkInterfaces();
    const isPrivate = (ip) => (
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      (ip.startsWith('172.') && (() => { const n = parseInt(ip.split('.')[1], 10); return n >= 16 && n <= 31; })())
    );

    let lanIPv4 = null;
    Object.values(nets).forEach((arr) => {
      (arr || []).forEach((net) => {
        if (net.family === 'IPv4' && !net.internal && isPrivate(net.address)) {
          if (!lanIPv4) lanIPv4 = net.address;
        }
      });
    });

    res.json({ success: true, lanIPv4, hostname: os.hostname() });
  } catch (err) {
    console.error('host-info error', err);
    res.status(500).json({ success: false, error: 'Failed to get host info' });
  }
});

// Export data endpoint
app.get('/api/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use json or csv' });
    }
    
    const result = await database.exportData(format);
    res.json({
      success: true,
      message: `Data exported successfully in ${format} format`,
      ...result
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation Error', details: errors });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ error: `${field} already exists` });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);
  
  // Join room for real-time updates
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`📡 User ${socket.id} joined room: ${roomId}`);
  });

  // Join user-specific room for personal notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${socket.id} joined personal room: user_${userId}`);
  });

  // Join chat room
  socket.on('join-chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`💬 User ${socket.id} joined chat: ${chatId}`);
  });

  // Leave chat room
  socket.on('leave-chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`👋 User ${socket.id} left chat: ${chatId}`);
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(`chat_${data.chatId}`).emit('user-typing', {
      userId: data.userId,
      userName: data.userName,
      isTyping: data.isTyping
    });
  });
  
  // Handle report updates
  socket.on('report-update', (data) => {
    socket.to(data.roomId).emit('report-status-changed', data);
  });
  
  // Handle new report submissions
  socket.on('new-report', (data) => {
    io.emit('new-report-notification', data);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`👋 User disconnected: ${socket.id}`);
  });
});

// Make io accessible to other modules
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚡ Socket.io enabled for real-time features`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await database.disconnect();
  process.exit(0);
});

module.exports = app;