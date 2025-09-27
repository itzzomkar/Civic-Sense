const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Report = require('../models/Report');

async function exportDataToFile() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urban_guardians');
    console.log('\n✅ Connected to MongoDB\n');

    // Fetch all data
    const users = await User.find().select('-password').lean();
    const reports = await Report.find().populate('userId', 'name email').lean();

    // Prepare export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      database: 'urban_guardians',
      statistics: {
        totalUsers: users.length,
        totalReports: reports.length,
        pendingReports: reports.filter(r => r.status === 'pending').length,
        inProgressReports: reports.filter(r => r.status === 'in-progress').length,
        resolvedReports: reports.filter(r => r.status === 'resolved').length
      },
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        civicPoints: user.civicPoints,
        location: user.location,
        createdAt: user.createdAt,
        stats: user.stats
      })),
      reports: reports.map(report => ({
        id: report._id,
        title: report.title,
        description: report.description,
        category: report.category,
        status: report.status,
        priority: report.priority,
        location: report.location,
        reportedBy: report.userId ? `${report.userId.name} (${report.userId.email})` : 'Unknown',
        upvotes: report.upvotes?.length || 0,
        comments: report.comments?.length || 0,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      }))
    };

    // Create exports directory if it doesn't exist
    const exportDir = path.join(__dirname, '../data/exports');
    await fs.mkdir(exportDir, { recursive: true });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `urban_guardians_data_${timestamp}.json`;
    const filepath = path.join(exportDir, filename);

    // Write to file
    await fs.writeFile(filepath, JSON.stringify(exportData, null, 2), 'utf8');

    console.log('========================================');
    console.log('📁 DATA EXPORTED SUCCESSFULLY!');
    console.log('========================================\n');
    console.log(`📍 File Location: ${filepath}\n`);
    console.log('📊 Export Summary:');
    console.log(`   • Total Users: ${users.length}`);
    console.log(`   • Total Reports: ${reports.length}`);
    console.log(`   • File Size: ${JSON.stringify(exportData).length} bytes\n`);

    // Also create a simplified CSV for reports
    const csvFilename = `reports_${timestamp}.csv`;
    const csvFilepath = path.join(exportDir, csvFilename);
    
    const csvHeader = 'ID,Title,Category,Status,Priority,Location,Reported By,Created Date\n';
    const csvContent = reports.map(r => 
      `"${r._id}","${r.title}","${r.category}","${r.status}","${r.priority || 'medium'}","${typeof r.location === 'string' ? r.location : r.location.address}","${r.userId ? r.userId.name : 'Unknown'}","${new Date(r.createdAt).toLocaleDateString()}"`
    ).join('\n');
    
    await fs.writeFile(csvFilepath, csvHeader + csvContent, 'utf8');
    console.log(`📄 CSV Export: ${csvFilepath}\n`);

    await mongoose.disconnect();
    console.log('✅ Export Complete!\n');
    console.log('💡 You can now open these files in any text editor or Excel!\n');

    return filepath;

  } catch (error) {
    console.error('Export Error:', error);
    process.exit(1);
  }
}

// Run the export
exportDataToFile();