require('dotenv').config();
const mongoose = require('mongoose');

async function testMongoConnection() {
  console.log('🔗 Testing MongoDB Atlas connection...');
  console.log('Connection string:', process.env.MONGODB_URI?.replace(/:[^:]*@/, ':****@')); // Hide password
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test basic operations
    console.log('\n📊 Database Info:');
    console.log('Database Name:', mongoose.connection.db.databaseName);
    console.log('Connection State:', mongoose.connection.readyState); // 1 = connected
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Collections found:', collections.length);
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Test a simple query
    if (collections.some(col => col.name === 'reports')) {
      const Report = mongoose.model('Report', new mongoose.Schema({}, { collection: 'reports' }));
      const reportCount = await Report.countDocuments();
      console.log(`\n📄 Reports in database: ${reportCount}`);
    }
    
    if (collections.some(col => col.name === 'users')) {
      const User = mongoose.model('User', new mongoose.Schema({}, { collection: 'users' }));
      const userCount = await User.countDocuments();
      console.log(`👥 Users in database: ${userCount}`);
    }
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔐 Authentication Error Solutions:');
      console.log('1. Check username and password in connection string');
      console.log('2. Ensure user has proper database permissions');
      console.log('3. Check if IP address is whitelisted in Atlas');
    } else if (error.message.includes('network')) {
      console.log('\n🌐 Network Error Solutions:');
      console.log('1. Check internet connection');
      console.log('2. Ensure Atlas cluster is running');
      console.log('3. Check firewall settings');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

testMongoConnection();