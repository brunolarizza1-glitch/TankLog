'use client';

import { useState, useEffect } from 'react';

interface Log {
  id: string;
  site: string;
  tank_id: string;
  occurred_at: string;
  leak_check: boolean;
  pdf_url?: string;
}

interface ReportData {
  totalLogs: number;
  logsThisMonth: number;
  complianceRate: number;
  openCorrectiveActions: number;
  logs: Log[];
}

export default function WorkingReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Working Reports: Fetching data...');

      const response = await fetch('/api/reports');
      console.log('🔍 Working Reports: API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Working Reports: Data received:', {
          totalLogs: data.totalLogs,
          logsCount: data.logs?.length || 0,
        });
        setReportData(data);
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        setError(`API Error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Fetch Error:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfDownload = async (log: Log) => {
    console.log('🔍 PDF Download for log:', log.id);

    if (!log.pdf_url) {
      alert('No PDF available for this log');
      return;
    }

    try {
      // Try to generate a signed URL first
      const response = await fetch('/api/generate-pdf-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfPaths: [{ logId: log.id, pdfPath: log.pdf_url }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const signedUrl = data.urls[log.id];

        if (signedUrl) {
          console.log('✅ Using signed URL:', signedUrl);
          downloadPdf(signedUrl, log);
        } else {
          console.log('⚠️ No signed URL, using direct URL');
          downloadPdf(log.pdf_url, log);
        }
      } else {
        console.log('⚠️ Failed to generate signed URL, using direct URL');
        downloadPdf(log.pdf_url, log);
      }
    } catch (error) {
      console.error('❌ Error generating signed URL:', error);
      console.log('⚠️ Using direct URL as fallback');
      downloadPdf(log.pdf_url, log);
    }
  };

  const downloadPdf = (url: string, log: Log) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `TankLog_Report_${log.tank_id}_${new Date(log.occurred_at)
      .toISOString()
      .replace('T', '_')
      .replace(/\.\d{3}Z$/, '')
      .replace(/:/g, '-')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchReportData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">No Data</div>
          <p className="text-gray-500">No report data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Working Reports
        </h1>

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
            <h2 className="text-lg font-semibold text-gray-900">Recent Logs</h2>
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
                    PDF
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.logs.slice(0, 20).map((log) => (
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
                      {log.pdf_url ? (
                        <button
                          onClick={() => handlePdfDownload(log)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Download PDF
                        </button>
                      ) : (
                        <span className="text-gray-400">No PDF</span>
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
