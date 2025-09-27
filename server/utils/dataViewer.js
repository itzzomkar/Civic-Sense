const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Report = require('../models/Report');

async function viewData() {
  console.log('\n========================================');
  console.log('📊 URBAN GUARDIANS DATA STORAGE VIEWER');
  console.log('========================================\n');

  // Check MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urban_guardians');
    console.log('✅ MongoDB Connected\n');
    
    // Count documents in MongoDB
    const userCount = await User.countDocuments();
    const reportCount = await Report.countDocuments();
    
    console.log('📦 MongoDB Database: urban_guardians');
    console.log('   Location: mongodb://localhost:27017/urban_guardians');
    console.log(`   • Users Collection: ${userCount} documents`);
    console.log(`   • Reports Collection: ${reportCount} documents`);
    
    // Show sample data
    if (userCount > 0) {
      const sampleUsers = await User.find().limit(3).select('name email role createdAt');
      console.log('\n   Sample Users:');
      sampleUsers.forEach(user => {
        console.log(`     - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }
    
    if (reportCount > 0) {
      const sampleReports = await Report.find().limit(3).select('title category status createdAt');
      console.log('\n   Sample Reports:');
      sampleReports.forEach(report => {
        console.log(`     - ${report.title} [${report.category}] - Status: ${report.status}`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.log('⚠️  MongoDB not available:', error.message);
  }

  // Check JSON files
  console.log('\n📁 Local JSON Storage (Fallback):');
  const dataPath = path.join(__dirname, '../data');
  console.log(`   Location: ${dataPath}`);
  
  try {
    const files = await fs.readdir(dataPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    if (jsonFiles.length > 0) {
      for (const file of jsonFiles) {
        const filePath = path.join(dataPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        console.log(`   • ${file}: ${Array.isArray(data) ? data.length : 'N/A'} records`);
      }
    } else {
      console.log('   No JSON files found (will be created when MongoDB is unavailable)');
    }
  } catch (error) {
    console.log('   JSON storage not initialized yet');
  }

  // Browser Storage Info
  console.log('\n🌐 Browser LocalStorage Keys:');
  console.log('   Location: Browser Developer Tools > Application > Local Storage');
  console.log('   Common Keys:');
  console.log('   • auth_token - JWT authentication token');
  console.log('   • current_user - Current logged-in user data');
  console.log('   • language - Selected language (en/hi)');
  console.log('   • civic_users - User data (fallback mode)');
  console.log('   • civic_reports - Reports data (fallback mode)');
  console.log('   • civic_passwords - Encrypted passwords (fallback mode)');

  // Data Export Locations
  console.log('\n📤 Data Export Locations:');
  console.log('   • JSON Export: server/data/exports/urban_guardians_export_[timestamp].json');
  console.log('   • CSV Export: server/data/exports/reports_[timestamp].csv');
  
  console.log('\n========================================');
  console.log('💡 How to Access Your Data:');
  console.log('========================================');
  console.log('\n1. MongoDB (Primary):');
  console.log('   - Use MongoDB Compass GUI: mongodb://localhost:27017/urban_guardians');
  console.log('   - Command line: mongosh --db urban_guardians');
  console.log('   - Query example: db.users.find() or db.reports.find()');
  
  console.log('\n2. API Endpoints:');
  console.log('   - View all reports: GET http://localhost:5000/api/reports');
  console.log('   - Export JSON: GET http://localhost:5000/api/export/json');
  console.log('   - Export CSV: GET http://localhost:5000/api/export/csv');
  
  console.log('\n3. Browser Console:');
  console.log('   - Open DevTools (F12)');
  console.log('   - Go to Application tab > Local Storage');
  console.log('   - Or in Console: localStorage.getItem("current_user")');
  
  console.log('\n========================================\n');
}

// Run the viewer
viewData().catch(console.error);