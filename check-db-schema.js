// Check current database schema
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('Checking database schema...');

    // Try to get the table structure
    const { data, error } = await supabase.from('logs').select('*').limit(1);

    if (error) {
      console.error('Error accessing logs table:', error);
      return;
    }

    console.log('✅ Logs table is accessible');

    // Try to insert a minimal log to test schema
    const testLog = {
      root_id: 'test-' + Date.now(),
      version: 1,
      org_id: '00000000-0000-0000-0000-000000000000',
      user_id: '00000000-0000-0000-0000-000000000000',
      compliance_mode: 'US_NFPA58',
      occurred_at: new Date().toISOString(),
      site: 'Test Site',
      tank_id: 'TANK-001',
      pressure: '150',
      leak_check: true,
      visual_ok: true,
      notes: 'Test log',
      corrective_action: '',
      customer_email: 'test@example.com',
    };

    const { data: insertData, error: insertError } = await supabase
      .from('logs')
      .insert([testLog])
      .select();

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      console.log('\n🔧 Database schema needs to be updated.');
      console.log(
        'Please run this SQL in your Supabase Dashboard → SQL Editor:'
      );
      console.log(`
-- Add missing columns to logs table
ALTER TABLE logs ADD COLUMN IF NOT EXISTS vehicle_id text;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS initials text;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';
ALTER TABLE logs ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS email_message_id text;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_logs_vehicle_id ON logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_logs_initials ON logs(initials);
CREATE INDEX IF NOT EXISTS idx_logs_pdf_url ON logs(pdf_url);
      `);
    } else {
      console.log('✅ Database schema is correct!');
      console.log('Inserted test log:', insertData);
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

checkSchema();
