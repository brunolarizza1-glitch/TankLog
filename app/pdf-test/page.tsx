'use client';

import { useState } from 'react';
import PDFDownloadButton from '@/components/PDFDownloadButton';

export default function PDFTestPage() {
  const [testResult, setTestResult] = useState<string>('');

  const testLog = {
    id: 'test-123',
    site: 'Test Site',
    tank_id: 'TANK-001',
    occurred_at: new Date().toISOString(),
    leak_check: true,
    visual_ok: true,
    pressure: '100 PSI',
    notes: 'Test inspection notes',
    corrective_action: undefined,
    compliance_mode: 'EPA',
    user: {
      name: 'Test User',
      email: 'test@example.com',
    },
  };

  const handleSimpleTest = () => {
    console.log('🔍 Simple Test: Button clicked');
    setTestResult('Simple test button works!');
  };

  const handlePDFTest = () => {
    console.log('🔍 PDF Test: Button clicked');
    setTestResult('PDF test button clicked - check console for details');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          PDF Download Test Page
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Buttons</h2>

          <div className="space-y-4">
            <div>
              <button
                onClick={handleSimpleTest}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-4"
              >
                Simple Test
              </button>
              <button
                onClick={handlePDFTest}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                PDF Test
              </button>
            </div>

            {testResult && (
              <div className="p-4 bg-gray-100 rounded">
                <p className="text-gray-700">{testResult}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            PDF Download Button Test
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">
                Client-side PDF Generation (no URL):
              </h3>
              <PDFDownloadButton
                log={testLog}
                variant="button"
                size="md"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Generate PDF
              </PDFDownloadButton>
            </div>

            <div>
              <h3 className="font-medium mb-2">PDF Download from URL:</h3>
              <PDFDownloadButton
                log={testLog}
                pdfUrl="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                variant="button"
                size="md"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Download PDF
              </PDFDownloadButton>
            </div>

            <div>
              <h3 className="font-medium mb-2">Link Style PDF Button:</h3>
              <PDFDownloadButton
                log={testLog}
                pdfUrl="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                variant="link"
                size="sm"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                PDF Link
              </PDFDownloadButton>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm text-gray-700">
              {JSON.stringify(testLog, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
