const {
  generateLogPdfPuppeteer,
} = require('./server/pdf/generateLogPdfPuppeteer.ts');

async function testPdfGeneration() {
  try {
    console.log('Testing PDF generation...');

    // Test with a mock log ID - this will fail but we can see the error
    const result = await generateLogPdfPuppeteer('test-log-id');
    console.log('PDF generation successful:', result);
  } catch (error) {
    console.log('PDF generation error:', error.message);

    // Check if it's the bucket error or a different error
    if (error.message.includes('Bucket not found')) {
      console.log('❌ Storage bucket issue - need to create log-pdfs bucket');
    } else if (error.message.includes('Log not found')) {
      console.log('✅ PDF generation working - just need a real log ID');
    } else {
      console.log('❌ Other error:', error.message);
    }
  }
}

testPdfGeneration();
