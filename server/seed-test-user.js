const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function seedTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urban_guardians');
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'rahul@example.com' });
    
    if (existingUser) {
      console.log('User already exists. Updating password...');
      // Set password directly without hashing (the pre-save hook will hash it)
      existingUser.password = 'password123';
      await existingUser.save();
      console.log('Password updated successfully');
    } else {
      // Create new user (pre-save hook will hash the password)
      const newUser = new User({
        name: 'Rahul Kumar',
        email: 'rahul@example.com',
        password: 'password123',
        role: 'citizen',
        civicPoints: 100,
        location: {
          city: 'Mumbai',
          state: 'Maharashtra'
        }
      });
      
      await newUser.save();
      console.log('Test user created successfully');
    }

    console.log('Test user credentials:');
    console.log('Email: rahul@example.com');
    console.log('Password: password123');

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedTestUser();