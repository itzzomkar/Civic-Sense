// One-time maintenance script to fix report location shapes and 2dsphere index
// Usage: node backend/scripts/fix-geo-index.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');

(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/urban_guardians';
  console.log('Connecting to MongoDB:', uri.replace(/:\w+@/, ':***@'));

  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = mongoose.connection.db;
    const collection = db.collection('reports');

    // 1) Migrate documents with old shapes to GeoJSON
    let fixed = 0;

    // a) location.coordinates with { lat, lng }
    const cursor1 = collection.find({ 'location.coordinates.lat': { $exists: true }, 'location.coordinates.lng': { $exists: true } });
    while (await cursor1.hasNext()) {
      const doc = await cursor1.next();
      const lat = Number(doc.location.coordinates.lat);
      const lng = Number(doc.location.coordinates.lng);
      await collection.updateOne({ _id: doc._id }, {
        $set: { 'location.coordinates': { type: 'Point', coordinates: [lng, lat] } },
        $unset: { 'location.coordinates.lat': '', 'location.coordinates.lng': '' }
      });
      fixed++;
    }

    // b) location with { lat, lng }
    const cursor2 = collection.find({ 'location.lat': { $exists: true }, 'location.lng': { $exists: true } });
    while (await cursor2.hasNext()) {
      const doc = await cursor2.next();
      const lat = Number(doc.location.lat);
      const lng = Number(doc.location.lng);
      await collection.updateOne({ _id: doc._id }, {
        $set: { 'location.coordinates': { type: 'Point', coordinates: [lng, lat] } },
        $unset: { 'location.lat': '', 'location.lng': '' }
      });
      fixed++;
    }

    // c) location.coordinates as a raw array [lng,lat]
    const cursor3 = collection.find({ 'location.coordinates': { $type: 'array' } });
    while (await cursor3.hasNext()) {
      const doc = await cursor3.next();
      const arr = doc.location.coordinates;
      if (Array.isArray(arr) && arr.length === 2) {
        const lng = Number(arr[0]);
        const lat = Number(arr[1]);
        await collection.updateOne({ _id: doc._id }, {
          $set: { 'location.coordinates': { type: 'Point', coordinates: [lng, lat] } }
        });
        fixed++;
      }
    }

    console.log(`Migrated ${fixed} report document(s) to GeoJSON format.`);

    // 2) Drop any legacy 2dsphere index variants on reports
    const indexes = await collection.indexes();
    console.log('Existing indexes:', indexes.map(i => i.name));

    const toDrop = indexes.filter(ix => ix.key && (ix.key['location.coordinates'] || ix.key['location.coordinates.coordinates']) && ix.name !== 'location.coordinates_2dsphere');

    for (const ix of toDrop) {
      console.log('Dropping index:', ix.name, ix.key);
      try {
        await collection.dropIndex(ix.name);
      } catch (e) {
        console.warn('Failed to drop index', ix.name, e.message);
      }
    }

    // 3) Ensure 2dsphere index on 'location.coordinates'
    const hasCorrect = indexes.some(ix => ix.name === 'location.coordinates_2dsphere');
    if (!hasCorrect) {
      console.log('Creating 2dsphere index on location.coordinates');
      await collection.createIndex({ 'location.coordinates': '2dsphere' }, { name: 'location.coordinates_2dsphere' });
    } else {
      console.log('Correct 2dsphere index already exists.');
    }

    console.log('Geo index fix complete.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error during geo index fix:', err);
    process.exit(1);
  }
})();
