const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Report = require('./models/Report');

// Demo data sets
const demoUsers = [
  {
    name: "Amit Sharma",
    email: "amit.sharma@example.com", 
    password: "demo123",
    phone: "9876543210",
    role: "citizen",
    location: {
      address: "MG Road, Bangalore",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
      coordinates: { lat: 12.9716, lng: 77.5946 }
    },
    civicPoints: 45
  },
  {
    name: "Priya Patel",
    email: "priya.patel@example.com",
    password: "demo123", 
    phone: "9876543211",
    role: "citizen",
    location: {
      address: "Connaught Place, Delhi",
      city: "Delhi", 
      state: "Delhi",
      pincode: "110001",
      coordinates: { lat: 28.6315, lng: 77.2167 }
    },
    civicPoints: 78
  },
  {
    name: "Rajesh Kumar",
    email: "rajesh.kumar@admin.gov",
    password: "admin123",
    phone: "9876543212",
    role: "admin",
    location: {
      address: "Secretariat Complex, Delhi",
      city: "Delhi",
      state: "Delhi", 
      pincode: "110001"
    }
  },
  {
    name: "Sunita Menon",
    email: "sunita.menon@municipal.gov",
    password: "official123",
    phone: "9876543213", 
    role: "official",
    location: {
      address: "Municipal Corporation, Mumbai",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001"
    }
  },
  {
    name: "Vikram Singh",
    email: "vikram.singh@example.com",
    password: "demo123",
    phone: "9876543214",
    role: "citizen",
    location: {
      address: "Park Street, Kolkata",
      city: "Kolkata",
      state: "West Bengal", 
      pincode: "700016",
      coordinates: { lat: 22.5541, lng: 88.3420 }
    },
    civicPoints: 32
  },
  {
    name: "Anita Reddy",
    email: "anita.reddy@example.com",
    password: "demo123",
    phone: "9876543215",
    role: "citizen", 
    location: {
      address: "Banjara Hills, Hyderabad", 
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500034",
      coordinates: { lat: 17.4065, lng: 78.4772 }
    },
    civicPoints: 56
  }
];

const reportTitles = [
  "Pothole on Main Street needs immediate repair",
  "Streetlight not working near park for 2 weeks", 
  "Garbage collection missed for 3 consecutive days",
  "Water leakage in residential area causing flooding",
  "Traffic signal malfunction at busy intersection",
  "Broken footpath causing safety hazard",
  "Overflowing drainage system during monsoon",
  "Illegal dumping in vacant lot behind market",
  "Bus stop shelter damaged by recent storm",
  "Road marking faded and completely invisible",
  "Stray dogs menace in residential colony",
  "Open manhole cover without safety barriers",
  "Public toilet in deplorable condition",
  "Tree branches blocking road signs",
  "Broken playground equipment in park",
  "Public bench vandalized with graffiti",
  "Waterlogging issue at underpass",
  "Construction debris blocking sidewalk",
  "Public dustbin overflowing for days",
  "Street vendor encroachment on footpath",
  "Broken speed breaker causing vehicle damage",
  "Public park lighting inadequate at night",
  "Unauthorized parking on main road",
  "Public fountain not working for months",
  "Pedestrian crossing signal not functioning",
  "Public library roof leaking badly",
  "Community center door broken",
  "Public Wi-Fi hotspot not working",
  "Bus route signboard missing information",
  "Public phone booth vandalized",
  "Street food stall blocking fire hydrant",
  "Public garden gate lock broken",
  "Community hall booking system offline",
  "Public restroom lacks basic amenities",
  "Street light pole tilting dangerously",
  "Public water cooler not functioning",
  "Traffic police booth abandoned",
  "Public swimming pool maintenance needed",
  "Community notice board damaged",
  "Public parking meter malfunctioning",
  "Street cleaning schedule inconsistent",
  "Public transport shelter needs repair", 
  "Community garbage collection point overflowing",
  "Public sports complex equipment broken",
  "Street vendor blocking emergency access",
  "Public health center signage unclear",
  "Community center air conditioning broken",
  "Public market toilet facilities poor",
  "Street dog sterilization camp needed",
  "Public charging station not working"
];

const categories = [
  'Road Maintenance',
  'Lighting', 
  'Waste Management',
  'Water & Utilities',
  'Traffic',
  'Infrastructure'
];

const departments = [
  'PWD',
  'Municipal Corporation',
  'Water Board', 
  'Electricity Board',
  'Traffic Police',
  'Other'
];

const statuses = ['pending', 'acknowledged', 'in-progress', 'resolved', 'rejected'];
const priorities = ['low', 'medium', 'high', 'urgent'];

const indianCities = [
  { name: "MG Road, Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Connaught Place, Delhi", state: "Delhi", lat: 28.6315, lng: 77.2167 },
  { name: "Marine Drive, Mumbai", state: "Maharashtra", lat: 18.9220, lng: 72.8347 },
  { name: "Park Street, Kolkata", state: "West Bengal", lat: 22.5541, lng: 88.3420 },
  { name: "Anna Salai, Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Banjara Hills, Hyderabad", state: "Telangana", lat: 17.4065, lng: 78.4772 },
  { name: "City Center, Pune", state: "Maharashtra", lat: 18.5196, lng: 73.8553 },
  { name: "Mall Road, Shimla", state: "Himachal Pradesh", lat: 31.1048, lng: 77.1734 },
  { name: "MG Road, Gurgaon", state: "Haryana", lat: 28.4595, lng: 77.0266 },
  { name: "Brigade Road, Bangalore", state: "Karnataka", lat: 12.9698, lng: 77.6205 }
];

const sampleComments = [
  "I have the same issue in my area too!",
  "This has been a problem for months",
  "Thanks for reporting, I was about to report the same", 
  "The municipal corporation should act fast",
  "This is causing traffic jams daily",
  "Safety concern for pedestrians",
  "Affecting quality of life in the neighborhood",
  "Hope this gets resolved soon",
  "Similar issue near the school as well",
  "This needs urgent attention"
];

async function generateDemoReports(users) {
  const reports = [];
  
  for (let i = 0; i < 55; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomCity = indianCities[Math.floor(Math.random() * indianCities.length)];
    const randomTitle = reportTitles[Math.floor(Math.random() * reportTitles.length)];
    
    // Generate timestamp within last 30 days
    const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    const report = {
      title: randomTitle,
      description: `Detailed description of the issue: ${randomTitle.toLowerCase()}. This is causing significant inconvenience to residents and needs immediate attention from the concerned authorities. The problem has been persisting and requires proper resolution.`,
      category: categories[Math.floor(Math.random() * categories.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      location: {
        address: randomCity.name,
        city: randomCity.name.split(',')[1]?.trim() || randomCity.name,
        state: randomCity.state,
        coordinates: {
          lat: randomCity.lat + (Math.random() - 0.5) * 0.01, // Add small random offset
          lng: randomCity.lng + (Math.random() - 0.5) * 0.01
        }
      },
      userId: randomUser._id,
      department: departments[Math.floor(Math.random() * departments.length)],
      createdAt: timestamp,
      updatedAt: timestamp,
      
      // Add some upvotes randomly
      upvotes: Array.from({ length: Math.floor(Math.random() * 15) }, () => ({
        userId: users[Math.floor(Math.random() * users.length)]._id,
        createdAt: new Date(timestamp.getTime() + Math.random() * 24 * 60 * 60 * 1000)
      })),
      
      // Add some comments randomly  
      comments: Array.from({ length: Math.floor(Math.random() * 8) }, () => ({
        userId: users[Math.floor(Math.random() * users.length)]._id,
        text: sampleComments[Math.floor(Math.random() * sampleComments.length)],
        createdAt: new Date(timestamp.getTime() + Math.random() * 24 * 60 * 60 * 1000)
      })),
      
      // Add status history
      statusHistory: [{
        status: 'pending',
        changedBy: randomUser._id,
        reason: 'Initial submission',
        changedAt: timestamp
      }]
    };
    
    // Add resolution data for resolved reports
    if (report.status === 'resolved') {
      report.resolution = {
        resolvedBy: users.find(u => u.role === 'admin' || u.role === 'official')?._id,
        resolvedAt: new Date(timestamp.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000),
        resolutionNotes: "Issue has been successfully resolved by the concerned department."
      };
      
      report.statusHistory.push({
        status: 'resolved',
        changedBy: users.find(u => u.role === 'admin')?._id,
        reason: 'Issue resolved successfully',
        changedAt: report.resolution.resolvedAt
      });
    }
    
    reports.push(report);
  }
  
  return reports;
}

async function seedDemoData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civic-reports', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔄 Connected to MongoDB...');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Report.deleteMany({});
    
    // Create demo users
    console.log('👥 Creating demo users...');
    const createdUsers = await User.create(demoUsers);
    console.log(`✅ Created ${createdUsers.length} demo users`);
    
    // Generate and create demo reports
    console.log('📋 Generating demo reports...');
    const demoReports = await generateDemoReports(createdUsers);
    const createdReports = await Report.create(demoReports);
    console.log(`✅ Created ${createdReports.length} demo reports`);
    
    // Update user stats based on their reports
    console.log('📊 Updating user statistics...');
    for (const user of createdUsers) {
      const userReports = createdReports.filter(r => r.userId.toString() === user._id.toString());
      const resolvedReports = userReports.filter(r => r.status === 'resolved');
      const pendingReports = userReports.filter(r => r.status === 'pending');
      
      await User.findByIdAndUpdate(user._id, {
        'stats.totalReports': userReports.length,
        'stats.resolvedReports': resolvedReports.length,
        'stats.pendingReports': pendingReports.length,
        'civicPoints': user.civicPoints + (resolvedReports.length * 10) + (userReports.length * 5)
      });
    }
    
    console.log('📈 Updated user statistics');
    
    // Print summary
    console.log('\n🎉 Demo data seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`👤 Users created: ${createdUsers.length}`);
    console.log(`📋 Reports created: ${createdReports.length}`);
    console.log(`🏛️ Cities covered: ${indianCities.length}`);
    console.log(`📂 Categories: ${categories.join(', ')}`);
    
    console.log('\n🔑 Demo Login Credentials:');
    console.log('👨‍💼 Admin: rajesh.kumar@admin.gov / admin123');
    console.log('👩‍💼 Official: sunita.menon@municipal.gov / official123'); 
    console.log('👤 Citizen: amit.sharma@example.com / demo123');
    console.log('👤 Citizen: priya.patel@example.com / demo123');
    
    console.log('\n🚀 You can now start the application and explore the features!');
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeding function
if (require.main === module) {
  seedDemoData().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { seedDemoData };