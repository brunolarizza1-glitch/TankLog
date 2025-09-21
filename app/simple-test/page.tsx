'use client';

import { useState, useEffect } from 'react';
import PDFDownloadButton from '@/components/PDFDownloadButton';

interface ReportData {
  totalLogs: number;
  logsThisMonth: number;
  complianceRate: number;
  logs: any[];
}

export default function SimpleTestPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/reports');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Test Page</h1>
      <p>Total Logs: {data?.totalLogs || 0}</p>
      <p>Logs This Month: {data?.logsThisMonth || 0}</p>
      <p>Compliance Rate: {data?.complianceRate || 0}%</p>

      {data?.logs && data.logs.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Sample Logs:</h2>
          <div className="space-y-2">
            {data.logs.slice(0, 5).map((log: any) => (
              <div key={log.id} className="border p-2 rounded">
                <p>
                  <strong>Site:</strong> {log.site}
                </p>
                <p>
                  <strong>Tank ID:</strong> {log.tank_id}
                </p>
                <p>
                  <strong>Date:</strong>{' '}
                  {new Date(log.occurred_at).toLocaleDateString()}
                </p>
                <p>
                  <strong>Status:</strong> {log.leak_check ? 'Pass' : 'Fail'}
                </p>
                {log.pdf_url && (
                  <PDFDownloadButton
                    log={{
                      id: log.id,
                      site: log.site,
                      tank_id: log.tank_id,
                      occurred_at: log.occurred_at,
                      leak_check: log.leak_check,
                      visual_ok: log.visual_ok,
                      pressure: log.pressure,
                      notes: log.notes,
                      corrective_action: log.corrective_action,
                      compliance_mode: log.compliance_mode,
                      user: {
                        name: 'Test User',
                        email: 'test@example.com',
                      },
                    }}
                    pdfUrl={log.pdf_url}
                    variant="button"
                    size="md"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Download PDF
                  </PDFDownloadButton>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

