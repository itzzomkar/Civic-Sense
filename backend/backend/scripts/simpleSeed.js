const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Report = require('../models/Report');

// Simple sample data without complex geospatial structures
const users = [
  {
    name: 'Admin User',
    email: 'admin@urbanguardians.com',
    password: 'admin123',
    role: 'admin',
    phone: '+91-9876543210',
    isVerified: true,
    civicPoints: 1000
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'citizen',
    phone: '+91-9876543211',
    isVerified: true,
    civicPoints: 150
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'citizen',
    phone: '+91-9876543212',
    isVerified: true,
    civicPoints: 85
  },
  {
    name: 'Municipal Officer',
    email: 'officer@municipality.gov',
    password: 'officer123',
    role: 'official',
    department: 'Public Works',
    phone: '+91-9876543213',
    isVerified: true,
    permissions: ['view_reports', 'edit_reports'],
    civicPoints: 500
  }
];

const reports = [
  {
    title: 'Street Light Not Working',
    description: 'The street light on Main Street has been broken for a week. It\'s creating safety concerns for pedestrians at night.',
    category: 'Public Safety',
    priority: 'medium',
    status: 'pending',
    location: {
      address: 'Main Street, Downtown',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      coordinates: {
        type: 'Point',
        coordinates: [72.8777, 19.0760] // [longitude, latitude]
      }
    },
    department: 'Public Works',
    tags: ['streetlight', 'safety'],
    visibility: 'public'
  },
  {
    title: 'Pothole on Highway',
    description: 'Large pothole causing damage to vehicles. Needs immediate attention.',
    category: 'Infrastructure',
    priority: 'high',
    status: 'acknowledged',
    location: {
      address: 'Highway Road, Sector 5',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      coordinates: {
        type: 'Point',
        coordinates: [72.8697, 19.1136]
      }
    },
    department: 'Public Works',
    tags: ['pothole', 'highway'],
    visibility: 'public'
  },
  {
    title: 'Garbage Collection Issue',
    description: 'Garbage bins overflowing for 3 days. Starting to smell and attract pests.',
    category: 'Waste Management',
    priority: 'medium',
    status: 'in-progress',
    location: {
      address: 'Park Avenue, Block A',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      coordinates: {
        type: 'Point',
        coordinates: [72.8406, 19.0544]
      }
    },
    department: 'Environment',
    tags: ['garbage', 'waste'],
    visibility: 'public'
  }
];

async function simpleSeed() {
  try {
    console.log('🌱 Starting simple database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urban-guardians');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Report.deleteMany({});

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];
    
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    // Create reports
    console.log('📝 Creating reports...');
    const createdReports = [];
    
    for (let i = 0; i < reports.length; i++) {
      const reportData = { ...reports[i] };
      
      // Assign to first citizen
      const citizens = createdUsers.filter(u => u.role === 'citizen');
      reportData.userId = citizens[i % citizens.length]._id;
      
      // Add some upvotes
      reportData.upvotes = [{
        userId: createdUsers[0]._id,
        createdAt: new Date()
      }];

      // Assign to official if not pending
      if (reportData.status !== 'pending') {
        const officials = createdUsers.filter(u => u.role === 'official');
        if (officials.length > 0) {
          reportData.assignedTo = officials[0]._id;
          reportData.assignedAt = new Date();
        }
      }

      const report = new Report(reportData);
      await report.save();
      createdReports.push(report);
      console.log(`✅ Created report: ${report.title}`);
    }

    console.log('✅ Database seeded successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Reports: ${createdReports.length}`);
    console.log(`\n🎯 Test accounts:`);
    console.log(`   Admin: admin@urbanguardians.com / admin123`);
    console.log(`   User: john@example.com / password123`);
    console.log(`   Official: officer@municipality.gov / officer123`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  simpleSeed();
}

module.exports = simpleSeed;