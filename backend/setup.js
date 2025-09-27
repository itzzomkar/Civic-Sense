#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Urban Guardians Backend Setup');
console.log('================================\n');

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: options.cwd || process.cwd(),
      ...options
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
      } else {
        resolve();
      }
    });

    child.on('error', reject);
  });
}

async function checkMongoDB() {
  console.log('🔍 Checking MongoDB connection...');
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urban-guardians');
    console.log('✅ MongoDB connected successfully');
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    console.log('\n💡 Solutions:');
    console.log('   1. Install and start MongoDB locally');
    console.log('   2. Or use MongoDB Atlas (cloud)');
    console.log('   3. Update MONGODB_URI in .env file\n');
    return false;
  }
}

async function setup() {
  try {
    console.log('1️⃣ Installing dependencies...');
    await runCommand('npm', ['install']);
    console.log('✅ Dependencies installed\n');

    console.log('2️⃣ Checking environment configuration...');
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
      console.log('📝 Creating .env file from template...');
      const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
      fs.writeFileSync(envPath, envExample);
      console.log('✅ Created .env file');
    } else {
      console.log('✅ .env file exists');
    }

    // Load environment variables
    require('dotenv').config();
    console.log('');

    console.log('3️⃣ Testing MongoDB connection...');
    const mongoConnected = await checkMongoDB();
    
    if (mongoConnected) {
      console.log('4️⃣ Seeding database with sample data...');
      const seedDatabase = require('./scripts/seedDatabase');
      await seedDatabase();
      console.log('✅ Database seeded successfully\n');
    } else {
      console.log('⚠️ Skipping database seed due to connection issues\n');
    }

    console.log('🎉 Setup completed successfully!');
    console.log('\n🚀 Next steps:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Visit: http://localhost:5000/health');
    console.log('   3. Test API endpoints with sample accounts');
    console.log('\n📚 Sample accounts:');
    console.log('   Admin: admin@urbanguardians.com / admin123');
    console.log('   Citizen: john@example.com / password123');
    console.log('   Official: pwd.officer@municipality.gov / officer123');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🆘 Manual setup:');
    console.log('   1. npm install');
    console.log('   2. Copy .env.example to .env');
    console.log('   3. Update MongoDB connection in .env');
    console.log('   4. npm run seed');
    console.log('   5. npm run dev');
    process.exit(1);
  }
}

// Run setup
setup();