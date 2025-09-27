const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Report = require('../models/Report');

async function viewAndManageData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urban_guardians');
    console.log('\n✅ Connected to MongoDB\n');
    console.log('========================================');
    console.log('📊 CURRENT DATA IN YOUR DATABASE');
    console.log('========================================\n');

    // Get all users
    const users = await User.find().select('-password');
    console.log(`📤 USERS (${users.length} total):`);
    console.log('----------------------------------------');
    
    if (users.length === 0) {
      console.log('   No users found. Creating sample data...\n');
      
      // Create sample users
      const sampleUsers = [
        {
          name: 'Rahul Kumar',
          email: 'rahul@example.com',
          password: 'Test@123',
          phone: '9876543210',
          role: 'citizen',
          location: {
            city: 'Mumbai',
            state: 'Maharashtra'
          }
        },
        {
          name: 'Admin User',
          email: 'admin@urbanguardians.com',
          password: 'Admin@123',
          role: 'admin',
          location: {
            city: 'Delhi',
            state: 'Delhi'
          }
        }
      ];

      for (const userData of sampleUsers) {
        const user = await User.create(userData);
        console.log(`   ✅ Created user: ${user.name} (${user.email})`);
      }
      console.log();
    } else {
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. Name: ${user.name}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Civic Points: ${user.civicPoints || 0}`);
        console.log(`      Created: ${new Date(user.createdAt).toLocaleDateString()}`);
        console.log();
      });
    }

    // Get all reports
    const reports = await Report.find().populate('userId', 'name email');
    console.log(`📋 REPORTS (${reports.length} total):`);
    console.log('----------------------------------------');
    
    if (reports.length === 0) {
      console.log('   No reports found. Creating sample reports...\n');
      
      // Get a user to assign reports to
      const user = await User.findOne();
      if (user) {
        const sampleReports = [
          {
            title: 'Pothole on MG Road',
            description: 'Large pothole causing traffic issues near the main junction. Multiple vehicles have been damaged.',
            category: 'Road Maintenance',
            location: {
              address: 'MG Road, Near City Mall',
              city: 'Mumbai',
              state: 'Maharashtra',
              coordinates: { lat: 19.0760, lng: 72.8777 }
            },
            userId: user._id,
            priority: 'high',
            status: 'pending'
          },
          {
            title: 'Street Light Not Working',
            description: 'Street lights have been non-functional for the past week, causing safety concerns at night.',
            category: 'Lighting',
            location: {
              address: 'Park Street, Sector 5',
              city: 'Mumbai',
              state: 'Maharashtra',
              coordinates: { lat: 19.0825, lng: 72.8812 }
            },
            userId: user._id,
            priority: 'medium',
            status: 'in-progress'
          },
          {
            title: 'Garbage Accumulation',
            description: 'Garbage has not been collected for several days, causing health hazards and bad smell.',
            category: 'Waste Management',
            location: {
              address: 'Green Colony, Block B',
              city: 'Mumbai',
              state: 'Maharashtra',
              coordinates: { lat: 19.0890, lng: 72.8856 }
            },
            userId: user._id,
            priority: 'high',
            status: 'pending'
          }
        ];

        for (const reportData of sampleReports) {
          const report = await Report.create(reportData);
          console.log(`   ✅ Created report: ${report.title}`);
        }
        console.log();
      }
    } else {
      reports.forEach((report, index) => {
        console.log(`   ${index + 1}. Title: ${report.title}`);
        console.log(`      Category: ${report.category}`);
        console.log(`      Status: ${report.status}`);
        console.log(`      Priority: ${report.priority || 'medium'}`);
        console.log(`      Location: ${typeof report.location === 'string' ? report.location : report.location.address}`);
        console.log(`      Reported by: ${report.userId.name || 'Unknown'}`);
        console.log(`      Created: ${new Date(report.createdAt).toLocaleDateString()}`);
        console.log(`      Upvotes: ${report.upvoteCount || 0}`);
        console.log();
      });
    }

    // Show statistics
    console.log('📈 DATABASE STATISTICS:');
    console.log('----------------------------------------');
    console.log(`   Total Users: ${await User.countDocuments()}`);
    console.log(`   Total Reports: ${await Report.countDocuments()}`);
    console.log(`   Pending Reports: ${await Report.countDocuments({ status: 'pending' })}`);
    console.log(`   In-Progress Reports: ${await Report.countDocuments({ status: 'in-progress' })}`);
    console.log(`   Resolved Reports: ${await Report.countDocuments({ status: 'resolved' })}`);

    console.log('\n========================================');
    console.log('💾 HOW TO VIEW THIS DATA:');
    console.log('========================================\n');
    console.log('1. MongoDB Compass (GUI - Recommended):');
    console.log('   - Download from: https://www.mongodb.com/products/compass');
    console.log('   - Connect to: mongodb://localhost:27017');
    console.log('   - Browse: urban_guardians → users/reports\n');
    
    console.log('2. Command Line (mongosh):');
    console.log('   mongosh');
    console.log('   use urban_guardians');
    console.log('   db.users.find().pretty()');
    console.log('   db.reports.find().pretty()\n');
    
    console.log('3. Via API (Browser):');
    console.log('   http://localhost:5000/api/reports');
    console.log('   http://localhost:5000/api/export/json\n');
    
    console.log('4. Export to File:');
    console.log('   node server/utils/exportToFile.js\n');

    await mongoose.disconnect();
    console.log('✅ Done!\n');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the function
viewAndManageData();