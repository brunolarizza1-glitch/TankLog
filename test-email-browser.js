// Test script to run in browser console
// This will test the complete email flow with authentication

async function testEmailFlow() {
  console.log('🧪 Testing TankLog Email Flow...');

  try {
    // Test 1: Check if user is authenticated
    console.log('1️⃣ Checking authentication...');
    const profileResponse = await fetch('/api/profile');
    if (!profileResponse.ok) {
      console.error('❌ Not authenticated. Please sign in first.');
      return;
    }
    const profile = await profileResponse.json();
    console.log('✅ Authenticated as:', profile.name, profile.email);

    // Test 2: Create a test log
    console.log('2️⃣ Creating test log...');
    const logData = {
      site: 'Test Site for Email',
      tank_id: 'TANK-EMAIL-001',
      pressure: '150',
      leak_check: 'Pass',
      visual_ok: true,
      notes: 'Test log for email verification',
      corrective_action: '',
      customer_email: 'brunolarizza1@gmail.com', // Your email
      compliance_mode: 'US_NFPA58',
      photo_urls: [],
      initials: 'TT',
    };

    const logResponse = await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
    });

    if (!logResponse.ok) {
      const error = await logResponse.json();
      console.error('❌ Failed to create log:', error);
      return;
    }

    const logResult = await logResponse.json();
    console.log('✅ Log created:', logResult.log.id);

    // Test 3: Check if PDF was generated and email sent
    console.log('3️⃣ Checking PDF generation...');
    console.log('📧 Email should be sent to:', logData.customer_email);
    console.log('📄 Check your email inbox for the PDF attachment');

    // Test 4: Verify log was saved
    console.log('4️⃣ Verifying log was saved...');
    const logsResponse = await fetch('/api/logs');
    if (logsResponse.ok) {
      const logs = await logsResponse.json();
      const testLog = logs.logs.find((l) => l.id === logResult.log.id);
      if (testLog) {
        console.log('✅ Log found in database');
        console.log('📊 Log details:', {
          id: testLog.id,
          site: testLog.site,
          customer_email: testLog.customer_email,
          pdf_url: testLog.pdf_url,
          created_at: testLog.created_at,
        });
      } else {
        console.log('⚠️ Log not found in database');
      }
    }

    console.log('🎉 Test completed! Check your email for the PDF.');
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testEmailFlow();








