'use client';

import { useState, useEffect } from 'react';

interface ReportData {
  totalLogs: number;
  logsThisMonth: number;
  logsThisWeek: number;
  complianceRate: number;
  correctiveActions: number;
  openCorrectiveActions: number;
  logs: Log[];
}

interface Log {
  id: string;
  site: string;
  tank_id: string;
  occurred_at: string;
  leak_check: boolean;
  visual_ok?: boolean;
  compliance_mode: string;
  pdf_url?: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

export default function TestReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Test Reports Page: Fetching report data...');
      const response = await fetch('/api/reports');
      console.log(
        '🔍 Test Reports Page: API response status:',
        response.status
      );

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Test Reports Page: API response data:', {
          totalLogs: data.totalLogs,
          logsCount: data.logs?.length || 0,
          logsThisMonth: data.logsThisMonth,
        });
        setReportData(data);

        // Generate PDF URLs for logs that have PDFs
        if (data.logs && data.logs.length > 0) {
          console.log(
            '🔍 Test Reports Page: Generating PDF URLs for',
            data.logs.length,
            'logs'
          );
          generatePdfUrls(data.logs);
        }
      } else {
        const errorData = await response.json();
        console.error('🔍 Test Reports Page: API error:', errorData);
      }
    } catch (error) {
      console.error('🔍 Test Reports Page: Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePdfUrls = async (logs: Log[]) => {
    try {
      console.log('🔍 Test Reports Page: Generating PDF URLs...');
      const pdfPaths = logs
        .filter((log) => log.pdf_url)
        .map((log) => ({
          logId: log.id,
          pdfPath: log.pdf_url!,
        }));

      if (pdfPaths.length === 0) {
        console.log('🔍 Test Reports Page: No PDFs to generate URLs for');
        return;
      }

      const response = await fetch('/api/generate-pdf-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfPaths }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Test Reports Page: Generated PDF URLs:', data.urls);
        setPdfUrls(data.urls);
      } else {
        console.error('🔍 Test Reports Page: Failed to generate PDF URLs');
      }
    } catch (error) {
      console.error('❌ Error generating PDF URLs:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Data</h1>
          <p className="text-gray-600">Unable to load report data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Reports</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Total Logs</h3>
            <p className="text-3xl font-bold text-gray-900">
              {reportData.totalLogs}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">This Month</h3>
            <p className="text-3xl font-bold text-gray-900">
              {reportData.logsThisMonth}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">
              Compliance Rate
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {reportData.complianceRate}%
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Open Actions</h3>
            <p className="text-3xl font-bold text-gray-900">
              {reportData.openCorrectiveActions}
            </p>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Logs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tank ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PDF
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.logs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.site}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.tank_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.occurred_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.leak_check
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.leak_check ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.pdf_url ? (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            console.log('🔍 PDF Click Debug:', {
                              logId: log.id,
                              pdfUrl: log.pdf_url,
                              signedUrl: pdfUrls[log.id],
                              hasSignedUrl: !!pdfUrls[log.id],
                            });

                            if (!pdfUrls[log.id]) {
                              // Try to generate the URL on demand
                              console.log(
                                '🔍 Generating PDF URL on demand for log',
                                log.id
                              );
                              try {
                                const response = await fetch(
                                  '/api/generate-pdf-urls',
                                  {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      pdfPaths: [
                                        { logId: log.id, pdfPath: log.pdf_url },
                                      ],
                                    }),
                                  }
                                );

                                if (response.ok) {
                                  const data = await response.json();
                                  const signedUrl = data.urls[log.id];
                                  if (signedUrl) {
                                    console.log(
                                      '✅ Generated signed URL on demand:',
                                      signedUrl
                                    );
                                    // Download the PDF with the exact same filename as generated for email
                                    const link = document.createElement('a');
                                    link.href = signedUrl;
                                    link.download = `TankLog_Report_${log.tank_id}_${new Date(
                                      log.occurred_at
                                    )
                                      .toISOString()
                                      .replace('T', '_')
                                      .replace(/\.\d{3}Z$/, '')
                                      .replace(/:/g, '-')}.pdf`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  } else {
                                    console.log(
                                      '❌ PDF file not found for log',
                                      log.id
                                    );
                                    alert(
                                      'PDF file not found. The PDF may not have been generated yet or may have been deleted.'
                                    );
                                  }
                                } else {
                                  console.error(
                                    '❌ Failed to generate signed URL on demand:',
                                    response.status
                                  );
                                  alert(
                                    'Failed to generate PDF URL. Please try again.'
                                  );
                                }
                              } catch (error) {
                                console.error(
                                  '❌ Error generating PDF URL on demand:',
                                  error
                                );
                                alert(
                                  'Failed to generate PDF URL. Please try again.'
                                );
                              }
                            } else {
                              console.log(
                                '🔍 Downloading PDF URL:',
                                pdfUrls[log.id]
                              );
                              // Download the PDF with the exact same filename as generated for email
                              const link = document.createElement('a');
                              link.href = pdfUrls[log.id];
                              link.download = `TankLog_Report_${log.tank_id}_${new Date(
                                log.occurred_at
                              )
                                .toISOString()
                                .replace('T', '_')
                                .replace(/\.\d{3}Z$/, '')
                                .replace(/:/g, '-')}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }}
                          className="text-primary hover:text-primary-dark cursor-pointer border-0 bg-transparent p-0 m-0"
                          style={{ outline: 'none' }}
                        >
                          PDF
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No PDF</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
