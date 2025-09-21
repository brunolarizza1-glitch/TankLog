const { generateLogPdfPuppeteer } = require('./server/pdf/generateLogPdfPuppeteer.ts');

async function testPdfGeneration() {
  console.log('🧪 Testing PDF generation...');
  
  try {
    // Test with a recent log ID from the terminal logs
    const testLogId = '0b7006cc-19a4-4bba-814c-d444e9fdc008'; // From the terminal logs
    
    console.log('📋 Testing with log ID:', testLogId);
    
    const result = await generateLogPdfPuppeteer(testLogId);
    
    console.log('✅ PDF generation successful!');
    console.log('📄 Result:', {
      filename: result.filename,
      storagePath: result.storagePath,
      hasPdfUrl: !!result.pdfUrl,
      bufferSize: result.pdfBuffer?.length || 0
    });
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPdfGeneration();
