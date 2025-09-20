const { createClient } = require('@supabase/supabase-js');

async function testBucket() {
  const supabaseUrl = 'https://ztfjmgnjypcaubuvqdsg.supabase.co';
  const supabaseKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZmptZ25qeXBjYXVidXZxZHNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk3NTM4NiwiZXhwIjoyMDczNTUxMzg2fQ.hOz0xeaGpvzS8b-BU9IGJPcvgaL9y6VnU7ACAlmRzS8';

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Testing storage bucket access...');

    // Try to list buckets
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log('❌ Error listing buckets:', bucketsError.message);
      return;
    }

    console.log('✅ Available buckets:');
    buckets.forEach((bucket) => {
      console.log(
        `  - ${bucket.id} (${bucket.name}) - Public: ${bucket.public}`
      );
    });

    // Check if log-pdfs bucket exists
    const logPdfsBucket = buckets.find((b) => b.id === 'log-pdfs');
    if (logPdfsBucket) {
      console.log('✅ log-pdfs bucket exists!');

      // Try to upload a test file
      const testContent = 'test';
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('log-pdfs')
        .upload('test/test.txt', testContent);

      if (uploadError) {
        console.log('❌ Upload test failed:', uploadError.message);
      } else {
        console.log('✅ Upload test successful:', uploadData);

        // Clean up test file
        await supabase.storage.from('log-pdfs').remove(['test/test.txt']);
        console.log('✅ Test file cleaned up');
      }
    } else {
      console.log('❌ log-pdfs bucket not found');
      console.log('Please run this SQL in Supabase:');
      console.log(
        "INSERT INTO storage.buckets (id, name, public) VALUES ('log-pdfs', 'log-pdfs', false) ON CONFLICT (id) DO NOTHING;"
      );
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testBucket();




