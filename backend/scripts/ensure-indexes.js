const mongoose = require('mongoose');
require('dotenv').config();

const Report = require('../models/Report');

async function ensureIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urban-guardians', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Ensure all indexes for the Report model
    await Report.collection.createIndexes();
    console.log('✅ Report indexes ensured');

    // Specifically ensure the geospatial index
    try {
      await Report.collection.createIndex({ 'location.coordinates': '2dsphere' });
      console.log('✅ Geospatial index created');
    } catch (error) {
      if (error.codeName === 'IndexOptionsConflict') {
        console.log('✅ Geospatial index already exists');
      } else {
        console.error('❌ Error creating geospatial index:', error);
      }
    }

    // List all indexes to verify
    const indexes = await Report.collection.indexes();
    console.log('📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)}: ${index.name}`);
    });

    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

ensureIndexes();