const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function basicSeed() {
  try {
    console.log('🌱 Starting basic database seeding...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urban-guardians');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    console.log('🗑️ Cleared existing users');

    // Create basic users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@urbanguardians.com',
        password: 'admin123',
        role: 'admin',
        isVerified: true,
        civicPoints: 1000
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'citizen',
        isVerified: true,
        civicPoints: 150
      },
      {
        name: 'Municipal Officer',
        email: 'officer@municipality.gov',
        password: 'officer123',
        role: 'official',
        department: 'Public Works',
        isVerified: true,
        permissions: ['view_reports', 'edit_reports'],
        civicPoints: 500
      }
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    console.log('\n🎉 Basic seeding completed!');
    console.log('🎯 Test accounts:');
    console.log('   Admin: admin@urbanguardians.com / admin123');
    console.log('   User: john@example.com / password123');
    console.log('   Official: officer@municipality.gov / officer123');
    console.log('\n🚀 Start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
  }
}

basicSeed();