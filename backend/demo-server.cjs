const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:8080', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock Data for Smart India Hackathon Demo
const mockUsers = [
  { id: '1', name: 'Rajesh Kumar', email: 'rajesh.kumar@gmail.com', role: 'citizen', points: 2850, badge: 'Civic Champion' },
  { id: '2', name: 'Priya Sharma', email: 'priya.sharma@gmail.com', role: 'citizen', points: 2340, badge: 'Active Reporter' },
  { id: '3', name: 'Dr. Suresh Patil', email: 'suresh.patil@mumbai.gov.in', role: 'admin', points: 0, badge: 'Administrator' }
];

const mockReports = [
  {
    id: '1',
    _id: '1',
    title: 'Large Pothole on NH-33 Near Ranchi',
    description: 'Dangerous pothole on National Highway 33 causing vehicle damage and traffic disruption',
    category: 'Road Maintenance',
    status: 'in-progress',
    priority: 'high',
    location: {
      address: 'NH-33, Kanke Road, Ranchi, Jharkhand 834008',
      city: 'Ranchi',
      state: 'Jharkhand',
      coordinates: { lat: 23.3441, lng: 85.3096 }
    },
    userId: '1',
    userName: 'Rajesh Kumar',
    upvotes: [
      { userId: '1', createdAt: new Date('2024-01-20').toISOString() },
      { userId: '3', createdAt: new Date('2024-01-21').toISOString() }
    ],
    comments: [
      { userId: '3', text: 'This is causing serious traffic issues for commuters!', createdAt: new Date('2024-01-21').toISOString() }
    ],
    verified: true,
    createdAt: new Date('2024-01-20').toISOString(),
    updatedAt: new Date('2024-01-21').toISOString(),
    aiConfidence: 0.94,
    weatherCondition: 'Rainy'
  },
  {
    id: '2',
    _id: '2',
    title: 'Overflowing Garbage Bins in Jamshedpur Market',
    description: 'Garbage bins overflowing for past 3 days in Sakchi market area causing bad smell and health hazards',
    category: 'Waste Management',
    status: 'pending',
    priority: 'medium',
    location: {
      address: 'Sakchi Market, Jamshedpur, Jharkhand 831001',
      city: 'Jamshedpur',
      state: 'Jharkhand',
      coordinates: { lat: 22.8046, lng: 86.2029 }
    },
    userId: '2',
    userName: 'Priya Sharma',
    upvotes: [
      { userId: '1', createdAt: new Date('2024-01-22').toISOString() },
      { userId: '2', createdAt: new Date('2024-01-22').toISOString() }
    ],
    comments: [],
    verified: false,
    createdAt: new Date('2024-01-22').toISOString(),
    updatedAt: new Date('2024-01-22').toISOString(),
    aiConfidence: 0.87,
    weatherCondition: 'Sunny'
  },
  {
    id: '3',
    _id: '3',
    title: 'Broken Street Light in Dhanbad Coal Area',
    description: 'Street light non-functional near coal mining area creating safety concerns for workers and residents',
    category: 'Lighting',
    status: 'resolved',
    priority: 'high',
    location: {
      address: 'Coal India Colony, Dhanbad, Jharkhand 826001',
      city: 'Dhanbad',
      state: 'Jharkhand',
      coordinates: { lat: 23.7957, lng: 86.4304 }
    },
    userId: '1',
    userName: 'Rajesh Kumar',
    upvotes: [
      { userId: '1', createdAt: new Date('2024-01-18').toISOString() },
      { userId: '2', createdAt: new Date('2024-01-18').toISOString() },
      { userId: '3', createdAt: new Date('2024-01-19').toISOString() }
    ],
    comments: [
      { userId: '3', text: 'This has been fixed by the municipal team. Thank you for reporting!', createdAt: new Date('2024-01-25').toISOString() }
    ],
    verified: true,
    createdAt: new Date('2024-01-18').toISOString(),
    updatedAt: new Date('2024-01-25').toISOString(),
    aiConfidence: 0.91,
    weatherCondition: 'Clear'
  },
  {
    id: '4',
    _id: '4',
    title: 'Water Supply Issue in Bokaro Steel City',
    description: 'Irregular water supply affecting residential areas near steel plant, causing hardship to families',
    category: 'Water & Utilities',
    status: 'in-progress',
    priority: 'urgent',
    location: {
      address: 'Sector 4, Bokaro Steel City, Jharkhand 827004',
      city: 'Bokaro',
      state: 'Jharkhand',
      coordinates: { lat: 23.6693, lng: 86.1511 }
    },
    userId: '2',
    userName: 'Priya Sharma',
    upvotes: [
      { userId: '1', createdAt: new Date('2024-01-23').toISOString() },
      { userId: '2', createdAt: new Date('2024-01-23').toISOString() },
      { userId: '3', createdAt: new Date('2024-01-23').toISOString() }
    ],
    comments: [
      { userId: '1', text: 'Water department has been notified. Work will start tomorrow.', createdAt: new Date('2024-01-24').toISOString() }
    ],
    verified: true,
    createdAt: new Date('2024-01-23').toISOString(),
    updatedAt: new Date('2024-01-24').toISOString(),
    aiConfidence: 0.96,
    weatherCondition: 'Clear'
  },
  {
    id: '5',
    _id: '5',
    title: 'Damaged Traffic Signal in Deoghar',
    description: 'Traffic signal at main temple route intersection malfunctioning during festival season causing congestion',
    category: 'Traffic',
    status: 'acknowledged',
    priority: 'high',
    location: {
      address: 'Baba Baidyanath Temple Road, Deoghar, Jharkhand 814112',
      city: 'Deoghar',
      state: 'Jharkhand',
      coordinates: { lat: 24.4843, lng: 86.6905 }
    },
    userId: '1',
    userName: 'Rajesh Kumar',
    upvotes: [
      { userId: '2', createdAt: new Date('2024-01-24').toISOString() },
      { userId: '3', createdAt: new Date('2024-01-24').toISOString() }
    ],
    comments: [],
    verified: true,
    createdAt: new Date('2024-01-24').toISOString(),
    updatedAt: new Date('2024-01-24').toISOString(),
    aiConfidence: 0.89,
    weatherCondition: 'Partly Cloudy'
  }
];

const mockDepartments = [
  { id: '1', name: 'Public Works Department', code: 'PWD', workload: 45, successRate: 87 },
  { id: '2', name: 'Waste Management', code: 'WM', workload: 32, successRate: 92 },
  { id: '3', name: 'Water Department', code: 'WD', workload: 28, successRate: 89 }
];

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Smart India Hackathon 2025 - Urban Guardians Demo API',
    timestamp: new Date().toISOString(),
    features: ['AI Categorization', 'Weather Integration', 'QR Codes', 'IoT Sensors', 'Blockchain']
  });
});

// API Base Route
app.get('/api', (req, res) => {
  res.json({
    message: '🏆 Smart India Hackathon 2025 - Urban Guardians API',
    version: '1.0.0',
    features: {
      aiCategorization: 'Active - 92.5% accuracy',
      weatherIntegration: 'Active - Real-time alerts',
      qrCodeNetwork: 'Active - 5 locations',
      iotSensors: 'Active - Environmental monitoring',
      gamification: 'Active - Points & badges',
      blockchain: 'Active - Transparency audit'
    },
    endpoints: [
      'GET /api/auth - Authentication endpoints',
      'GET /api/reports - Civic issue reports',
      'GET /api/users - User management',
      'GET /api/analytics - Dashboard analytics',
      'GET /api/weather - Weather integration',
      'GET /api/qr - QR code management',
      'GET /api/iot - IoT sensor data'
    ]
  });
});

// Authentication Routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = mockUsers.find(u => u.email === email);
  if (user && password === 'password123') {
    res.json({
      success: true,
      message: 'Login successful',
      user: { ...user, password: undefined },
      token: 'demo-jwt-token-' + user.id
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  
  const newUser = {
    id: String(mockUsers.length + 1),
    name,
    email,
    role: 'citizen',
    points: 0,
    badge: 'Newcomer'
  };
  
  mockUsers.push(newUser);
  
  res.json({
    success: true,
    message: 'Registration successful',
    user: newUser,
    token: 'demo-jwt-token-' + newUser.id
  });
});

// Reports Routes
app.get('/api/reports', (req, res) => {
  res.json({
    success: true,
    data: mockReports,
    pagination: {
      total: mockReports.length,
      page: 1,
      limit: 50
    }
  });
});

app.post('/api/reports', (req, res) => {
  const newReport = {
    id: String(mockReports.length + 1),
    _id: String(mockReports.length + 1),
    ...req.body,
    status: 'pending',
    upvotes: [],
    comments: [],
    verified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    aiConfidence: 0.75 + Math.random() * 0.2
  };
  
  mockReports.push(newReport);
  
  res.json({
    success: true,
    message: 'Report submitted successfully',
    data: newReport
  });
});

// Upvote report endpoint
app.post('/api/reports/:id/upvote', (req, res) => {
  const reportId = req.params.id;
  const report = mockReports.find(r => r.id === reportId || r._id === reportId);
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }
  
  // For demo purposes, assume user ID is '1'
  const userId = '1';
  const existingUpvote = report.upvotes.find(upvote => upvote.userId === userId);
  
  if (existingUpvote) {
    // Remove upvote
    report.upvotes = report.upvotes.filter(upvote => upvote.userId !== userId);
  } else {
    // Add upvote
    report.upvotes.push({
      userId: userId,
      createdAt: new Date().toISOString()
    });
  }
  
  report.updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    data: report,
    message: existingUpvote ? 'Upvote removed' : 'Report upvoted'
  });
});

// Analytics Routes
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalReports: 267,
      activeUsers: 1542,
      pendingIssues: 34,
      resolvedToday: 12,
      aiAccuracy: 92.5,
      weatherAlerts: 2,
      qrLocations: 5,
      carbonSaved: 267,
      departments: mockDepartments,
      recentActivity: mockReports.slice(-5),
      resolutionRates: {
        'Water & Utilities': 89,
        'Road Maintenance': 76,
        'Waste Management': 92,
        'Traffic Issues': 85
      }
    }
  });
});

// Weather Integration
app.get('/api/weather/current', (req, res) => {
  res.json({
    success: true,
    data: {
      temperature: 28,
      humidity: 75,
      condition: 'rainy',
      precipitation: 25,
      alerts: [
        {
          id: 'alert_001',
          title: 'Heavy Rainfall Warning',
          description: 'Intense rainfall expected for next 48 hours',
          severity: 'high',
          expectedIssues: ['Storm drain blockages', 'Road waterlogging']
        }
      ]
    }
  });
});

// QR Code Routes
app.get('/api/qr/locations', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'mumbai-bandra-station',
        name: 'Bandra Railway Station West',
        coordinates: { lat: 19.0544, lng: 72.8406 },
        reportCount: 23,
        qrCode: 'QR-BANDRA-001'
      },
      {
        id: 'mumbai-marine-drive',
        name: 'Marine Drive Promenade', 
        coordinates: { lat: 18.9435, lng: 72.8234 },
        reportCount: 12,
        qrCode: 'QR-MARINE-002'
      }
    ]
  });
});

// IoT Sensors
app.get('/api/iot/sensors', (req, res) => {
  res.json({
    success: true,
    data: {
      airQuality: { value: 85, status: 'moderate', unit: 'AQI' },
      noiseLevel: { value: 72, status: 'above_normal', unit: 'dB' },
      trafficFlow: { value: 'normal', congestion: 0.2 },
      sensors: [
        { id: 'AQ001', type: 'Air Quality', location: 'Bandra West', status: 'active' },
        { id: 'NL001', type: 'Noise Monitor', location: 'Marine Drive', status: 'active' },
        { id: 'TF001', type: 'Traffic Sensor', location: 'Worli Junction', status: 'active' }
      ]
    }
  });
});

// Geolocation and Nearby Reports API
app.get('/api/reports/nearby', (req, res) => {
  const { lat, lng, radius = 5 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }
  
  // Calculate distance (simplified)
  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const maxRadius = parseFloat(radius);
  
  const nearbyReports = mockReports.filter(report => {
    const reportLat = report.location.coordinates.lat;
    const reportLng = report.location.coordinates.lng;
    
    // Simple distance calculation (in km)
    const distance = Math.sqrt(
      Math.pow((userLat - reportLat) * 111, 2) + 
      Math.pow((userLng - reportLng) * 111 * Math.cos(userLat * Math.PI / 180), 2)
    );
    
    return distance <= maxRadius;
  });
  
  res.json({
    success: true,
    data: nearbyReports,
    location: { lat: userLat, lng: userLng },
    radius: maxRadius,
    found: nearbyReports.length
  });
});

// Users/Gamification
app.get('/api/users/leaderboard', (req, res) => {
  res.json({
    success: true,
    data: mockUsers.map((user, index) => ({
      userId: user.id,
      name: user.name,
      rank: index + 1,
      score: user.points,
      badge: user.badge,
      stats: {
        reports: Math.floor(Math.random() * 50) + 10,
        resolved: Math.floor(Math.random() * 40) + 5
      }
    }))
  });
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  // Send welcome message with hackathon info
  socket.emit('welcome', {
    message: '🏆 Welcome to Smart India Hackathon 2025 - Urban Guardians!',
    features: ['Real-time updates', 'AI categorization', 'Weather alerts', 'IoT data']
  });
  
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`📱 Client ${socket.id} joined room: ${room}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Start server
server.listen(PORT, () => {
  console.log('🚀 =================================');
  console.log('🏆 SMART INDIA HACKATHON 2025');
  console.log('🏛️ Urban Guardians Demo API Server');
  console.log('🚀 =================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`💻 Frontend URL: http://localhost:8080`);
  console.log('✨ Features: AI, IoT, Weather, QR, Blockchain');
  console.log('🔥 Real-time Socket.IO enabled');
  console.log('=================================');
});

module.exports = app;