const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...');
  console.log('Connection string:', process.env.MONGODB_URI || 'mongodb://localhost:27017/urban-guardians');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urban-guardians', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('Database:', mongoose.connection.name);
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('Test', testSchema);
    
    const testDoc = new TestModel({ test: 'Connection successful' });
    await testDoc.save();
    console.log('✅ Test document created successfully!');
    
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Test document cleaned up');
    
    console.log('\n🎉 MongoDB is ready for Urban Guardians!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run seed (to add sample data)');
    console.log('2. Run: npm run dev (to start the server)');
    
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    console.log('\n💡 Solutions:');
    console.log('1. Install MongoDB locally: https://www.mongodb.com/try/download/community');
    console.log('2. Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas');
    console.log('3. Update MONGODB_URI in .env file');
    console.log('\n📋 For MongoDB Atlas:');
    console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/urban-guardians');
  } finally {
    await mongoose.connection.close();
  }
}

testConnection();