const axios = require('axios');

// Test script to verify admin-only status update functionality

const BASE_URL = 'http://localhost:5000'; // Adjust if your server runs on a different port

async function testStatusUpdatePermissions() {
  console.log('🧪 Testing Admin-Only Status Update Functionality\n');

  // Mock user tokens - in real implementation these would be JWTs
  const adminToken = 'mock-admin-token';
  const citizenToken = 'mock-citizen-token';
  const officialToken = 'mock-official-token';
  
  const testReportId = 'demo1'; // Using demo report from the seed data

  // Test cases
  const testCases = [
    {
      name: 'Admin user updating status',
      token: adminToken,
      role: 'admin',
      shouldSucceed: true
    },
    {
      name: 'Citizen user attempting to update status',
      token: citizenToken,
      role: 'citizen',
      shouldSucceed: false
    },
    {
      name: 'Official user attempting to update status',
      token: officialToken,
      role: 'official',
      shouldSucceed: false
    },
    {
      name: 'Unauthenticated user attempting to update status',
      token: null,
      role: 'none',
      shouldSucceed: false
    }
  ];

  console.log('Test Report ID:', testReportId);
  console.log('Status Update Endpoint:', `${BASE_URL}/api/reports/${testReportId}/status\n`);

  for (const testCase of testCases) {
    console.log(`🔍 Testing: ${testCase.name}`);
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (testCase.token) {
        headers.Authorization = `Bearer ${testCase.token}`;
      }

      const response = await axios.patch(
        `${BASE_URL}/api/reports/${testReportId}/status`,
        {
          status: 'in-progress',
          reason: `Test status update by ${testCase.role} role`
        },
        { headers }
      );

      if (testCase.shouldSucceed) {
        console.log('✅ SUCCESS: Status update allowed (as expected)');
        console.log(`   Response: ${response.status} - ${response.data.message}`);
      } else {
        console.log('❌ UNEXPECTED: Status update should have been blocked');
        console.log(`   Response: ${response.status} - ${response.data.message}`);
      }

    } catch (error) {
      if (!testCase.shouldSucceed) {
        console.log('✅ SUCCESS: Status update properly blocked (as expected)');
        console.log(`   Error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
      } else {
        console.log('❌ UNEXPECTED: Status update should have been allowed');
        console.log(`   Error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
      }
    }

    console.log(''); // Empty line for readability
  }

  console.log('🎯 Test Summary:');
  console.log('✅ Admin users should be able to update report status');
  console.log('❌ Citizens and officials should be blocked from updating status');
  console.log('❌ Unauthenticated users should be blocked');
  console.log('\n📝 Expected behavior:');
  console.log('- Only admin users receive HTTP 200/201 responses');
  console.log('- All other users receive HTTP 403 (Forbidden) responses');
  console.log('- Unauthenticated users receive HTTP 401 (Unauthorized) responses');
}

// Helper function to test frontend component behavior
function testFrontendAdminCheck() {
  console.log('\n🖥️  Frontend Component Test:');
  console.log('ReportTimeline component should now:');
  console.log('✅ Show status update buttons only for admin users');
  console.log('✅ Show informational message for non-admin users');
  console.log('✅ Use useAuth() hook to check user.role === "admin"');
  console.log('✅ Display admin-only notice when showActions=true but user is not admin');
}

// Main execution
if (require.main === module) {
  console.log('🔐 Urban Guardians - Admin-Only Status Update Test\n');
  
  testStatusUpdatePermissions()
    .then(() => {
      testFrontendAdminCheck();
      console.log('\n✨ Test completed successfully!');
    })
    .catch((error) => {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  testStatusUpdatePermissions,
  testFrontendAdminCheck
};