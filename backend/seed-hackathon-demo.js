const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/urban-guardians';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phoneNumber: String,
  password: String,
  isPhoneVerified: Boolean,
  role: { type: String, default: 'citizen' },
  points: { type: Number, default: 0 },
  badge: { type: String, default: 'Newcomer' },
  joinedAt: { type: Date, default: Date.now },
  location: {
    city: String,
    state: String,
    pincode: String
  }
});

const reportSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'pending' },
  location: String,
  coordinates: {
    lat: Number,
    lng: Number
  },
  userId: String,
  userName: String,
  userPhone: String,
  images: [String],
  votes: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  assignedDepartment: String,
  assignedOfficer: String,
  estimatedResolutionTime: String,
  actualResolutionTime: Date,
  resolutionCost: Number,
  weatherCondition: String,
  qrCode: String,
  aiConfidence: Number,
  keywords: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const departmentSchema = new mongoose.Schema({
  name: String,
  code: String,
  description: String,
  headName: String,
  contactEmail: String,
  contactPhone: String,
  jurisdiction: [String],
  workload: { type: Number, default: 0 },
  avgResolutionTime: Number,
  successRate: Number
});

// Models
const User = mongoose.model('User', userSchema);
const Report = mongoose.model('Report', reportSchema);
const Department = mongoose.model('Department', departmentSchema);

// Demo Data
const demoUsers = [
  // Citizens
  { name: 'Rajesh Kumar', email: 'rajesh.kumar@gmail.com', phoneNumber: '+91-9876543210', role: 'citizen', points: 250, badge: 'Civic Champion', location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' } },
  { name: 'Priya Sharma', email: 'priya.sharma@gmail.com', phoneNumber: '+91-9876543211', role: 'citizen', points: 180, badge: 'Active Reporter', location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400002' } },
  { name: 'Amit Patel', email: 'amit.patel@gmail.com', phoneNumber: '+91-9876543212', role: 'citizen', points: 120, badge: 'Community Helper', location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400003' } },
  { name: 'Sneha Reddy', email: 'sneha.reddy@gmail.com', phoneNumber: '+91-9876543213', role: 'citizen', points: 95, badge: 'Newcomer', location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400004' } },
  { name: 'Vikram Singh', email: 'vikram.singh@gmail.com', phoneNumber: '+91-9876543214', role: 'citizen', points: 310, badge: 'Civic Champion', location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400005' } },
  
  // Municipal Staff
  { name: 'Dr. Suresh Patil', email: 'suresh.patil@mumbai.gov.in', phoneNumber: '+91-9876543220', role: 'admin', location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' } },
  { name: 'Meera Joshi', email: 'meera.joshi@mumbai.gov.in', phoneNumber: '+91-9876543221', role: 'department_head', location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' } },
  { name: 'Ravi Kulkarni', email: 'ravi.kulkarni@mumbai.gov.in', phoneNumber: '+91-9876543222', role: 'field_worker', location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' } }
];

const demoDepartments = [
  { name: 'Public Works Department', code: 'PWD', description: 'Roads, bridges, and infrastructure', headName: 'Eng. Sunil Rao', contactEmail: 'pwd@mumbai.gov.in', contactPhone: '+91-22-24567890', jurisdiction: ['400001', '400002', '400003'], workload: 45, avgResolutionTime: 7, successRate: 87 },
  { name: 'Waste Management', code: 'WM', description: 'Garbage collection and sanitation', headName: 'Mrs. Kavita Desai', contactEmail: 'waste@mumbai.gov.in', contactPhone: '+91-22-24567891', jurisdiction: ['400001', '400002', '400003', '400004', '400005'], workload: 32, avgResolutionTime: 3, successRate: 92 },
  { name: 'Water Department', code: 'WD', description: 'Water supply and drainage', headName: 'Eng. Anil Mehta', contactEmail: 'water@mumbai.gov.in', contactPhone: '+91-22-24567892', jurisdiction: ['400001', '400002', '400003', '400004'], workload: 28, avgResolutionTime: 5, successRate: 89 },
  { name: 'Electrical Department', code: 'ED', description: 'Street lighting and electrical issues', headName: 'Eng. Deepak Shah', contactEmail: 'electrical@mumbai.gov.in', contactPhone: '+91-22-24567893', jurisdiction: ['400001', '400002', '400003', '400004', '400005'], workload: 19, avgResolutionTime: 4, successRate: 94 },
  { name: 'Traffic Police', code: 'TP', description: 'Traffic management and signals', headName: 'DCP Rajesh Tope', contactEmail: 'traffic@mumbai.gov.in', contactPhone: '+91-22-24567894', jurisdiction: ['400001', '400002', '400003', '400004', '400005'], workload: 37, avgResolutionTime: 2, successRate: 96 },
  { name: 'Parks & Gardens', code: 'PG', description: 'Public parks and green spaces', headName: 'Mrs. Sunita Kadam', contactEmail: 'parks@mumbai.gov.in', contactPhone: '+91-22-24567895', jurisdiction: ['400001', '400002', '400003', '400004', '400005'], workload: 15, avgResolutionTime: 6, successRate: 91 }
];

const weatherConditions = ['Sunny', 'Rainy', 'Cloudy', 'Humid', 'Windy'];
const mumbaiLocations = [
  { area: 'Colaba', lat: 18.9067, lng: 72.8147, pincode: '400001' },
  { area: 'Fort', lat: 18.9390, lng: 72.8354, pincode: '400001' },
  { area: 'Churchgate', lat: 18.9322, lng: 72.8264, pincode: '400002' },
  { area: 'Marine Drive', lat: 18.9435, lng: 72.8234, pincode: '400002' },
  { area: 'Worli', lat: 18.9894, lng: 72.8184, pincode: '400018' },
  { area: 'Bandra', lat: 19.0596, lng: 72.8295, pincode: '400050' },
  { area: 'Juhu', lat: 19.0883, lng: 72.8265, pincode: '400049' },
  { area: 'Andheri', lat: 19.1136, lng: 72.8697, pincode: '400053' },
  { area: 'Powai', lat: 19.1197, lng: 72.9056, pincode: '400076' },
  { area: 'Mulund', lat: 19.1728, lng: 72.9544, pincode: '400080' }
];

// Generate comprehensive demo reports
const generateDemoReports = () => {
  const reports = [];
  const categories = [
    { name: 'Road Maintenance', dept: 'PWD', priority: 'high' },
    { name: 'Waste Management', dept: 'WM', priority: 'medium' },
    { name: 'Water & Utilities', dept: 'WD', priority: 'high' },
    { name: 'Lighting', dept: 'ED', priority: 'medium' },
    { name: 'Traffic', dept: 'TP', priority: 'urgent' },
    { name: 'Infrastructure', dept: 'PWD', priority: 'medium' },
    { name: 'Vandalism', dept: 'PWD', priority: 'low' }
  ];

  const roadIssues = [
    { title: 'Large Pothole on Western Express Highway', desc: 'Dangerous pothole near Bandra exit causing vehicle damage. Multiple cars have suffered punctures.', keywords: ['pothole', 'dangerous', 'highway', 'vehicle damage'] },
    { title: 'Road Cave-in at Linking Road', desc: 'Road surface has caved in due to recent rains. Creating traffic bottleneck during peak hours.', keywords: ['cave-in', 'road damage', 'traffic', 'monsoon'] },
    { title: 'Broken Speed Breaker in Residential Area', desc: 'Speed breaker broken and creating sharp edges. Risk to two-wheelers and pedestrians.', keywords: ['speed breaker', 'broken', 'sharp edges', 'safety'] },
    { title: 'Road Construction Debris Left Uncleared', desc: 'Construction work completed but debris not cleared. Blocking pedestrian walkway.', keywords: ['construction', 'debris', 'walkway', 'obstruction'] },
    { title: 'Manholes Without Proper Covers', desc: 'Three manholes without covers on SV Road. Extremely dangerous during night time.', keywords: ['manholes', 'covers', 'dangerous', 'night safety'] }
  ];

  const wasteIssues = [
    { title: 'Overflowing Garbage Bins in Market Area', desc: 'Garbage bins overflowing for past 3 days. Causing bad smell and attracting stray animals.', keywords: ['overflowing', 'garbage bins', 'smell', 'stray animals'] },
    { title: 'Illegal Dumping in Vacant Plot', desc: 'People dumping construction waste in vacant plot. Creating health hazard for nearby residents.', keywords: ['illegal dumping', 'construction waste', 'health hazard'] },
    { title: 'Missed Garbage Collection in Housing Society', desc: 'Garbage collection missed for 2 days in our society. Residents forced to dump outside.', keywords: ['missed collection', 'housing society', 'accumulated waste'] },
    { title: 'Broken Waste Compactor Machine', desc: 'Community waste compactor not working. Causing overflow and unhygienic conditions.', keywords: ['compactor', 'not working', 'overflow', 'unhygienic'] },
    { title: 'Plastic Waste Burning in Slum Area', desc: 'Residents burning plastic waste due to lack of collection. Causing air pollution.', keywords: ['plastic burning', 'slum', 'air pollution', 'collection'] }
  ];

  const waterIssues = [
    { title: 'Water Pipe Burst on Main Road', desc: 'Major water pipeline burst causing road flooding. Traffic disrupted and water waste.', keywords: ['pipe burst', 'flooding', 'traffic disruption', 'water waste'] },
    { title: 'Sewage Overflow in Residential Colony', desc: 'Sewage overflowing from manholes. Spreading in residential area creating health emergency.', keywords: ['sewage overflow', 'manholes', 'residential', 'health emergency'] },
    { title: 'No Water Supply for 48 Hours', desc: 'Entire building without water supply. Affecting 200+ families. No prior notice given.', keywords: ['no water supply', 'building', 'families', 'no notice'] },
    { title: 'Contaminated Water from Municipal Tap', desc: 'Brownish water coming from municipal connection. Residents fear contamination.', keywords: ['contaminated water', 'brownish', 'municipal', 'contamination'] },
    { title: 'Blocked Storm Water Drain', desc: 'Storm water drain completely blocked with plastic and debris. Will cause flooding in monsoon.', keywords: ['blocked drain', 'storm water', 'plastic debris', 'monsoon flooding'] }
  ];

  const lightingIssues = [
    { title: 'Street Light Not Working Since 2 Weeks', desc: 'Three consecutive street lights not working. Making area unsafe for evening walkers.', keywords: ['street light', 'not working', 'unsafe', 'evening', 'darkness'] },
    { title: 'Flickering LED Street Light', desc: 'Newly installed LED light continuously flickering. Causing disturbance to nearby residents.', keywords: ['flickering', 'LED', 'disturbance', 'residents'] },
    { title: 'Electrical Pole Damaged in Accident', desc: 'Electric pole damaged in vehicle accident. Wires hanging dangerously low.', keywords: ['electrical pole', 'damaged', 'accident', 'wires hanging', 'dangerous'] },
    { title: 'Park Area Completely Dark', desc: 'All lights in community park not working. Park unusable after sunset.', keywords: ['park', 'dark', 'lights not working', 'sunset', 'unusable'] },
    { title: 'Transformer Sparking Near School', desc: 'Electrical transformer sparking intermittently. Located near school premises - safety concern.', keywords: ['transformer', 'sparking', 'school', 'safety concern', 'electrical'] }
  ];

  const trafficIssues = [
    { title: 'Traffic Signal Not Working at Junction', desc: 'Main traffic signal malfunctioned since morning. Causing major traffic jams and accidents.', keywords: ['traffic signal', 'malfunctioned', 'traffic jams', 'accidents', 'junction'] },
    { title: 'Road Divider Broken by Truck', desc: 'Heavy truck broke road divider. Creating dangerous situation for opposite traffic.', keywords: ['road divider', 'broken', 'truck', 'dangerous', 'opposite traffic'] },
    { title: 'Missing Stop Sign at School Zone', desc: 'Stop sign missing at school crossing. Children safety at risk during school hours.', keywords: ['stop sign', 'missing', 'school crossing', 'children safety', 'school hours'] },
    { title: 'Zebra Crossing Paint Completely Faded', desc: 'Pedestrian crossing paint completely invisible. Drivers not stopping for pedestrians.', keywords: ['zebra crossing', 'paint faded', 'invisible', 'drivers', 'pedestrians'] },
    { title: 'Illegal Parking Blocking Emergency Lane', desc: 'Vehicles parked in emergency lane of highway. Will block ambulance and fire brigade access.', keywords: ['illegal parking', 'emergency lane', 'highway', 'ambulance', 'fire brigade'] }
  ];

  // Generate 60+ reports across categories
  const allIssues = [
    ...roadIssues.map(issue => ({ ...issue, category: 'Road Maintenance', dept: 'PWD', priority: 'high' })),
    ...wasteIssues.map(issue => ({ ...issue, category: 'Waste Management', dept: 'WM', priority: 'medium' })),
    ...waterIssues.map(issue => ({ ...issue, category: 'Water & Utilities', dept: 'WD', priority: 'urgent' })),
    ...lightingIssues.map(issue => ({ ...issue, category: 'Lighting', dept: 'ED', priority: 'medium' })),
    ...trafficIssues.map(issue => ({ ...issue, category: 'Traffic', dept: 'TP', priority: 'urgent' }))
  ];

  const statuses = [
    { status: 'pending', weight: 0.3 },
    { status: 'in-progress', weight: 0.4 },
    { status: 'resolved', weight: 0.25 },
    { status: 'closed', weight: 0.05 }
  ];

  for (let i = 0; i < allIssues.length; i++) {
    const issue = allIssues[i];
    const location = mumbaiLocations[i % mumbaiLocations.length];
    const user = demoUsers[i % 5]; // Only citizen users
    
    // Randomly assign status based on weights
    const statusRand = Math.random();
    let cumulativeWeight = 0;
    let selectedStatus = 'pending';
    
    for (const statusOption of statuses) {
      cumulativeWeight += statusOption.weight;
      if (statusRand <= cumulativeWeight) {
        selectedStatus = statusOption.status;
        break;
      }
    }

    const report = {
      title: issue.title,
      description: issue.desc,
      category: issue.category,
      priority: issue.priority,
      status: selectedStatus,
      location: `${location.area}, Mumbai, Maharashtra ${location.pincode}`,
      coordinates: {
        lat: location.lat + (Math.random() - 0.5) * 0.01, // Add slight variation
        lng: location.lng + (Math.random() - 0.5) * 0.01
      },
      userId: user.phoneNumber,
      userName: user.name,
      userPhone: user.phoneNumber,
      votes: Math.floor(Math.random() * 20) + 1,
      verified: Math.random() > 0.3,
      assignedDepartment: issue.dept,
      assignedOfficer: demoDepartments.find(d => d.code === issue.dept)?.headName || 'Unassigned',
      estimatedResolutionTime: `${Math.floor(Math.random() * 10) + 1} days`,
      weatherCondition: weatherConditions[Math.floor(Math.random() * weatherConditions.length)],
      qrCode: `QR-${Date.now()}-${i}`,
      aiConfidence: 0.75 + Math.random() * 0.2, // 75-95% confidence
      keywords: issue.keywords,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      updatedAt: new Date()
    };

    // Add resolution details for resolved reports
    if (selectedStatus === 'resolved' || selectedStatus === 'closed') {
      report.actualResolutionTime = new Date(report.createdAt.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000);
      report.resolutionCost = Math.floor(Math.random() * 50000) + 5000; // ₹5,000 to ₹55,000
    }

    reports.push(report);
  }

  // Add some additional reports for different scenarios
  const additionalReports = [
    {
      title: 'Smart City Initiative: IoT Sensor Installation Request',
      description: 'Request to install air quality monitoring sensor at busy intersection. Citizens want real-time pollution data.',
      category: 'Infrastructure',
      priority: 'medium',
      status: 'in-progress',
      location: 'Bandra Kurla Complex, Mumbai, Maharashtra 400051',
      coordinates: { lat: 19.0593, lng: 72.8614 },
      userId: demoUsers[0].phoneNumber,
      userName: demoUsers[0].name,
      userPhone: demoUsers[0].phoneNumber,
      votes: 45,
      verified: true,
      assignedDepartment: 'PWD',
      assignedOfficer: 'Eng. Sunil Rao',
      estimatedResolutionTime: '30 days',
      weatherCondition: 'Sunny',
      qrCode: `QR-SMART-${Date.now()}`,
      aiConfidence: 0.92,
      keywords: ['smart city', 'iot sensor', 'air quality', 'monitoring', 'pollution'],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    }
  ];

  return [...reports, ...additionalReports];
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting Smart India Hackathon Demo Data Seeding...');
    
    // Clear existing data
    await User.deleteMany({});
    await Report.deleteMany({});
    await Department.deleteMany({});
    
    console.log('✅ Cleared existing data');

    // Create users with hashed passwords
    const hashedPassword = await bcrypt.hash('password123', 10);
    const usersWithHashedPasswords = demoUsers.map(user => ({
      ...user,
      password: hashedPassword,
      isPhoneVerified: true
    }));

    const createdUsers = await User.insertMany(usersWithHashedPasswords);
    console.log(`✅ Created ${createdUsers.length} demo users`);

    // Create departments
    const createdDepartments = await Department.insertMany(demoDepartments);
    console.log(`✅ Created ${createdDepartments.length} municipal departments`);

    // Create reports
    const demoReports = generateDemoReports();
    const createdReports = await Report.insertMany(demoReports);
    console.log(`✅ Created ${createdReports.length} demo reports`);

    console.log('\n🎉 Smart India Hackathon Demo Data Seeding Completed!');
    console.log('\n📊 Summary:');
    console.log(`   Citizens: ${createdUsers.filter(u => u.role === 'citizen').length}`);
    console.log(`   Officials: ${createdUsers.filter(u => u.role !== 'citizen').length}`);
    console.log(`   Departments: ${createdDepartments.length}`);
    console.log(`   Reports: ${createdReports.length}`);
    
    const statusCounts = {};
    createdReports.forEach(report => {
      statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
    });
    
    console.log('\n📈 Report Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log('\n🔑 Test Login Credentials:');
    console.log('   👤 Citizens:');
    console.log('      Email: rajesh.kumar@gmail.com | Password: password123');
    console.log('      Email: priya.sharma@gmail.com | Password: password123');
    console.log('   🏛️ Officials:');
    console.log('      Admin: suresh.patil@mumbai.gov.in | Password: password123');
    console.log('      Dept Head: meera.joshi@mumbai.gov.in | Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();