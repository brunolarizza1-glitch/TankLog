// Test PDF generation and email functionality
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPdfEmail() {
  try {
    console.log('Testing PDF generation and email...');

    // First, let's create a test log
    const testLog = {
      root_id: 'test-pdf-' + Date.now(),
      version: 1,
      org_id: '00000000-0000-0000-0000-000000000000', // You'll need to replace with actual org ID
      user_id: '00000000-0000-0000-0000-000000000000', // You'll need to replace with actual user ID
      compliance_mode: 'US_NFPA58',
      occurred_at: new Date().toISOString(),
      site: 'Test Site for PDF',
      vehicle_id: 'TEST-VEHICLE-001',
      tank_id: 'TANK-001',
      pressure: '150',
      leak_check: true,
      visual_ok: true,
      notes: 'This is a test log for PDF generation and email testing.',
      corrective_action: 'No corrective action needed',
      customer_email: 'test@example.com', // Change this to your email for testing
      photo_urls: [],
    };

    console.log('Creating test log...');
    const { data: logData, error: logError } = await supabase
      .from('logs')
      .insert([testLog])
      .select()
      .single();

    if (logError) {
      console.error('Error creating test log:', logError);
      return;
    }

    console.log('✅ Test log created:', logData.id);

    // Now test the PDF generation endpoint
    console.log('Testing PDF generation...');
    const pdfResponse = await fetch(
      `http://localhost:3000/api/test/pdf?logId=${logData.id}`
    );

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('❌ PDF generation failed:', errorText);
      return;
    }

    const pdfResult = await pdfResponse.json();
    console.log('✅ PDF generated successfully:', pdfResult);

    // Clean up test log
    await supabase.from('logs').delete().eq('id', logData.id);
    console.log('✅ Test log cleaned up');
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testPdfEmail();


