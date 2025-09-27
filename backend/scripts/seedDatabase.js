const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Report = require('../models/Report');

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@urbanguardians.com',
    password: 'admin123',
    role: 'admin',
    phone: '+91-9876543210',
    isVerified: true,
    phoneVerified: true,
    location: {
      address: 'Municipal Corporation Building',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      coordinates: {
        lat: 19.0760,
        lng: 72.8777
      }
    },
    permissions: ['view_reports', 'edit_reports', 'delete_reports', 'manage_users', 'view_analytics', 'moderate_comments', 'send_notifications'],
    civicPoints: 1000
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'citizen',
    phone: '+91-9876543211',
    isVerified: true,
    phoneVerified: true,
    location: {
      address: '123 Main Street, Andheri',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      coordinates: {
        lat: 19.1136,
        lng: 72.8697
      }
    },
    civicPoints: 150
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'citizen',
    phone: '+91-9876543212',
    isVerified: true,
    phoneVerified: false,
    location: {
      address: '456 Oak Avenue, Bandra',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      coordinates: {
        lat: 19.0544,
        lng: 72.8406
      }
    },
    civicPoints: 85
  },
  {
    name: 'Municipal Officer - PWD',
    email: 'pwd.officer@municipality.gov',
    password: 'officer123',
    role: 'official',
    department: 'Public Works',
    phone: '+91-9876543213',
    isVerified: true,
    phoneVerified: true,
    location: {
      address: 'PWD Office, Fort',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      coordinates: {
        lat: 18.9322,
        lng: 72.8264
      }
    },
    permissions: ['view_reports', 'edit_reports'],
    civicPoints: 500
  },
  {
    name: 'Dr. Priya Sharma',
    email: 'priya@example.com',
    password: 'password123',
    role: 'citizen',
    phone: '+91-9876543214',
    isVerified: true,
    phoneVerified: true,
    location: {
      address: '789 Green Park, Powai',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      coordinates: {
        lat: 19.1176,
        lng: 72.9060
      }
    },
    civicPoints: 220
  },
  {
    name: 'Environmental Officer',
    email: 'env.officer@municipality.gov',
    password: 'officer123',
    role: 'official',
    department: 'Environment',
    phone: '+91-9876543215',
    isVerified: true,
    phoneVerified: true,
    location: {
      address: 'Environment Dept, Dadar',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      coordinates: {
        lat: 19.0178,
        lng: 72.8478
      }
    },
    permissions: ['view_reports', 'edit_reports'],
    civicPoints: 750
  }
];

const reports = [
  {
    title: 'Large Pothole on Western Express Highway',
    description: 'There is a massive pothole near the Andheri flyover on Western Express Highway that is causing traffic jams and vehicle damage. The pothole is approximately 3 feet wide and 6 inches deep. Multiple vehicles have been damaged, and it\'s becoming a safety hazard during the monsoon season.',
    category: 'Infrastructure',
    subcategory: 'Road Maintenance',
    priority: 'high',
    status: 'acknowledged',
    location: {
      address: 'Western Express Highway, Near Andheri Flyover',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      coordinates: {
        type: 'Point',
        coordinates: [72.8697, 19.1136]
      },
      landmark: 'Andheri Flyover',
      postalCode: '400058'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
        caption: 'Large pothole causing traffic issues'
      }
    ],
    department: 'Public Works',
    tags: ['pothole', 'highway', 'traffic', 'safety'],
    visibility: 'public'
  },
  {
    title: 'Overflowing Garbage Bins at Linking Road',
    description: 'The garbage bins at Linking Road market area have been overflowing for the past week. The waste is scattered on the road and footpath, creating unhygienic conditions and attracting stray animals. The smell is unbearable, especially during hot weather.',
    category: 'Waste Management',
    subcategory: 'Garbage Collection',
    priority: 'medium',
    status: 'in-progress',
    location: {
      address: 'Linking Road Market, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      coordinates: {
        type: 'Point',
        coordinates: [72.8269, 19.0544]
      },
      landmark: 'Linking Road Shopping Street',
      postalCode: '400050'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        caption: 'Overflowing garbage bins creating unhygienic conditions'
      }
    ],
    department: 'Environment',
    tags: ['garbage', 'waste', 'hygiene', 'market'],
    visibility: 'public'
  },
  {
    title: 'Broken Street Light at Juhu Beach Road',
    description: 'Street light pole number JB-234 has been non-functional for over two weeks. The area becomes very dark at night, posing safety concerns for pedestrians and joggers. There are also reports of increased petty crime in this poorly lit area.',
    category: 'Public Safety',
    subcategory: 'Street Lighting',
    priority: 'medium',
    status: 'pending',
    location: {
      address: 'Juhu Beach Road, Near SNDT University',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      coordinates: {
        type: 'Point',
        coordinates: [72.8267, 19.0969]
      },
      landmark: 'SNDT University Gate',
      postalCode: '400049'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800',
        caption: 'Broken street light creating safety issues'
      }
    ],
    department: 'Public Works',
    tags: ['streetlight', 'safety', 'lighting', 'beach'],
    visibility: 'public'
  },
  {
    title: 'Water Logging at Sion Circle During Monsoon',
    description: 'Severe water logging occurs at Sion Circle during heavy rainfall due to blocked storm drains. Water accumulates up to 2-3 feet, making it impossible for vehicles to pass. This has been a recurring problem for the past 3 years during monsoon season.',
    category: 'Water & Sanitation',
    subcategory: 'Drainage',
    priority: 'high',
    status: 'acknowledged',
    location: {
      address: 'Sion Circle, Sion East',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      coordinates: {
        type: 'Point',
        coordinates: [72.8606, 19.0430]
      },
      landmark: 'Sion Circle',
      postalCode: '400022'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
        caption: 'Severe water logging blocking traffic'
      }
    ],
    department: 'Water Department',
    tags: ['waterlogging', 'drainage', 'monsoon', 'traffic'],
    visibility: 'public'
  },
  {
    title: 'Illegal Construction Blocking Footpath',
    description: 'A shop owner has extended their construction onto the public footpath at Hill Road, making it impossible for pedestrians to walk safely. People are forced to walk on the busy road, creating traffic hazards and safety concerns.',
    category: 'Infrastructure',
    subcategory: 'Encroachment',
    priority: 'medium',
    status: 'pending',
    location: {
      address: 'Hill Road, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      coordinates: {
        type: 'Point',
        coordinates: [72.8310, 19.0538]
      },
      landmark: 'Hill Road Shopping Area',
      postalCode: '400050'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
        caption: 'Illegal construction blocking pedestrian walkway'
      }
    ],
    department: 'Public Works',
    tags: ['encroachment', 'footpath', 'safety', 'construction'],
    visibility: 'public'
  },
  {
    title: 'Park Playground Equipment Needs Repair',
    description: 'The children\'s playground equipment at Shivaji Park is in poor condition. Several swings have broken chains, the slide has sharp edges, and the see-saw is unstable. This poses safety risks to children who play here daily.',
    category: 'Parks & Recreation',
    subcategory: 'Playground Maintenance',
    priority: 'medium',
    status: 'resolved',
    location: {
      address: 'Shivaji Park, Dadar West',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      coordinates: {
        type: 'Point',
        coordinates: [72.8406, 19.0270]
      },
      landmark: 'Shivaji Park Ground',
      postalCode: '400028'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1554473675-d0904f3cbf38?w=800',
        caption: 'Playground equipment requiring safety repairs'
      }
    ],
    department: 'Parks & Recreation',
    tags: ['playground', 'children', 'safety', 'maintenance'],
    visibility: 'public',
    resolution: {
      description: 'All playground equipment has been repaired and safety-certified. New equipment has been installed where needed.',
      completedAt: new Date(Date.now() - 86400000) // 1 day ago
    }
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urban-guardians');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Report.deleteMany({});

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];
    
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    // Create reports with proper user references
    console.log('📝 Creating reports...');
    const createdReports = [];
    
    for (let i = 0; i < reports.length; i++) {
      const reportData = { ...reports[i] };
      // Assign random citizen as report creator
      const citizens = createdUsers.filter(u => u.role === 'citizen');
      const randomCitizen = citizens[Math.floor(Math.random() * citizens.length)];
      reportData.userId = randomCitizen._id;
      
      // Add some upvotes from random users
      const numUpvotes = Math.floor(Math.random() * 5) + 1;
      reportData.upvotes = [];
      
      for (let j = 0; j < numUpvotes; j++) {
        const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        if (!reportData.upvotes.find(u => u.userId.equals(randomUser._id))) {
          reportData.upvotes.push({
            userId: randomUser._id,
            createdAt: new Date(Date.now() - Math.random() * 86400000 * 7) // Random time in last week
          });
        }
      }

      // Assign to official if status is not pending
      if (reportData.status !== 'pending') {
        const officials = createdUsers.filter(u => u.role === 'official');
        if (officials.length > 0) {
          const randomOfficial = officials[Math.floor(Math.random() * officials.length)];
          reportData.assignedTo = randomOfficial._id;
          reportData.assignedAt = new Date(Date.now() - Math.random() * 86400000 * 3); // Random time in last 3 days
        }
      }

      // Set creation time to random time in last month
      const report = new Report(reportData);
      report.createdAt = new Date(Date.now() - Math.random() * 86400000 * 30);
      
      await report.save();
      createdReports.push(report);
      console.log(`✅ Created report: ${report.title}`);
    }

    // Update user stats
    console.log('📊 Updating user statistics...');
    for (const user of createdUsers) {
      const userReports = createdReports.filter(r => r.userId.equals(user._id));
      const resolvedReports = userReports.filter(r => r.status === 'resolved');
      const pendingReports = userReports.filter(r => r.status === 'pending');
      const upvotesReceived = createdReports.reduce((total, report) => {
        return total + report.upvotes.filter(upvote => 
          createdReports.some(r => r.userId.equals(user._id) && r._id.equals(report._id))
        ).length;
      }, 0);

      await User.findByIdAndUpdate(user._id, {
        'stats.totalReports': userReports.length,
        'stats.resolvedReports': resolvedReports.length,
        'stats.pendingReports': pendingReports.length,
        'stats.upvotesReceived': upvotesReceived
      });
    }

    console.log('✅ Database seeded successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Reports: ${createdReports.length}`);
    console.log(`   - Admin user: admin@urbanguardians.com / admin123`);
    console.log(`   - Test citizen: john@example.com / password123`);
    console.log(`   - Test official: pwd.officer@municipality.gov / officer123`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;