const fetch = require('node-fetch');

async function testLogCreation() {
  console.log('🧪 Testing log creation and PDF generation...');
  
  try {
    const testLogData = {
      site: 'Test Site',
      tank_id: 'TEST-001',
      occurred_at: new Date().toISOString(),
      leak_check: true,
      visual_ok: true,
      pressure: '100 PSI',
      notes: 'Test log for PDF generation',
      compliance_mode: 'EPA'
    };
    
    console.log('📋 Creating test log with data:', testLogData);
    
    const response = await fetch('http://localhost:3000/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'test=true' // This might need actual auth
      },
      body: JSON.stringify(testLogData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Log creation successful!');
      console.log('📄 Result:', result);
    } else {
      console.error('❌ Log creation failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLogCreation();
