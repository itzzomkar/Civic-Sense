import fetch from 'node-fetch';

async function testStatusUpdate() {
  try {
    // First, let's test if the server is responding
    console.log('Testing server health...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log('Server health:', healthData);
    
    // Test getting reports to see what IDs we have
    console.log('\nGetting reports...');
    const reportsResponse = await fetch('http://localhost:5000/api/reports');
    const reportsData = await reportsResponse.json();
    console.log(`Found ${reportsData.data?.length || 0} reports`);
    
    if (reportsData.data && reportsData.data.length > 0) {
      const firstReport = reportsData.data[0];
      console.log('First report:', {
        id: firstReport._id || firstReport.id,
        title: firstReport.title,
        status: firstReport.status
      });
      
      // Try to update status (this will fail without auth, but shows us the error)
      console.log('\nTesting status update without auth...');
      const statusResponse = await fetch(`http://localhost:5000/api/reports/${firstReport._id || firstReport.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'acknowledged',
          reason: 'Test update'
        }),
      });
      
      const statusResult = await statusResponse.json();
      console.log('Status update response:', statusResponse.status, statusResult);
    }
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testStatusUpdate();