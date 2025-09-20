// Test script to check database schema
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchema() {
  try {
    // Try to insert a test log with minimal data
    const testLog = {
      root_id: 'test-' + Date.now(),
      version: 1,
      org_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      compliance_mode: 'US_NFPA58',
      occurred_at: new Date().toISOString(),
      site: 'Test Site',
      vehicle_id: 'TEST-001',
      tank_id: 'TANK-001',
      pressure: '150',
      leak_check: true,
      visual_ok: true,
      notes: 'Test log',
      corrective_action: '',
      customer_email: 'test@example.com',
      photo_urls: [],
    };

    console.log('Testing database schema...');
    console.log('Test log data:', JSON.stringify(testLog, null, 2));

    const { data, error } = await supabase
      .from('logs')
      .insert([testLog])
      .select();

    if (error) {
      console.error('Database error:', error);
      console.log('\nThis confirms the database schema needs to be updated.');
      console.log('Please run the SQL migration in your Supabase dashboard.');
    } else {
      console.log('Success! Database schema is correct.');
      console.log('Inserted log:', data);
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testSchema();
