'use client';

import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Card } from '@/components/design-system';

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

export default function ReportsPage() {
  const { profile } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'fail'>(
    'all'
  );
  const [dateFilter, setDateFilter] = useState<
    'all' | 'week' | 'month' | 'year'
  >('all');
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});

  const generatePdfUrls = async (logs: Log[]) => {
    console.log('🔍 Generating PDF URLs for', logs.length, 'logs');

    const pdfPaths = logs
      .filter((log) => log.pdf_url)
      .map((log) => ({ logId: log.id, pdfPath: log.pdf_url }));

    if (pdfPaths.length === 0) {
      console.log('🔍 No PDFs to generate URLs for');
      setPdfUrls({});
      return;
    }

    try {
      const response = await fetch('/api/generate-pdf-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfPaths }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(
          '✅ Generated PDF URLs:',
          Object.keys(data.urls).length,
          'URLs'
        );
        setPdfUrls(data.urls);
      } else {
        console.error('❌ Failed to generate PDF URLs:', response.status);
        setPdfUrls({});
      }
    } catch (error) {
      console.error('❌ Error generating PDF URLs:', error);
      setPdfUrls({});
    }
  };

  useEffect(() => {
    console.log('🔍 Reports Page: Profile changed:', {
      hasProfile: !!profile,
      orgId: profile?.org_id,
      name: profile?.name,
    });

    if (profile?.org_id) {
      console.log('🔍 Reports Page: Profile available, fetching data');
      fetchReportData();
    } else {
      console.log('🔍 Reports Page: No profile yet, waiting...');
    }
  }, [profile?.org_id]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Reports Page: Fetching report data...');
      const response = await fetch('/api/reports');
      console.log('🔍 Reports Page: API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Reports Page: API response data:', {
          totalLogs: data.totalLogs,
          logsCount: data.logs?.length || 0,
          logsThisMonth: data.logsThisMonth,
        });
        setReportData(data);

        // Generate PDF URLs for logs that have PDFs
        if (data.logs && data.logs.length > 0) {
          console.log(
            '🔍 Reports Page: Generating PDF URLs for',
            data.logs.length,
            'logs'
          );
          generatePdfUrls(data.logs);
        } else {
          console.log('🔍 Reports Page: No logs found for PDF URL generation');
        }
      } else {
        const errorData = await response.json();
        console.error('🔍 Reports Page: API error:', errorData);
      }
    } catch (error) {
      console.error('🔍 Reports Page: Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs based on search and filters
  const filteredLogs =
    reportData?.logs?.filter((log) => {
      const matchesSearch =
        log.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.tank_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pass' &&
          log.leak_check &&
          (log.visual_ok === null || log.visual_ok)) ||
        (statusFilter === 'fail' &&
          (!log.leak_check || log.visual_ok === false));

      const logDate = new Date(log.occurred_at);
      const now = new Date();
      const matchesDate =
        dateFilter === 'all' ||
        (dateFilter === 'week' &&
          logDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) ||
        (dateFilter === 'month' &&
          logDate >= new Date(now.getFullYear(), now.getMonth(), 1)) ||
        (dateFilter === 'year' && logDate >= new Date(now.getFullYear(), 0, 1));

      return matchesSearch && matchesStatus && matchesDate;
    }) || [];

  if (loading) {
    console.log('🔍 Reports Page: Loading state - showing spinner');
    return (
      <AppShell title="Reports">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  console.log('🔍 Reports Page: Rendering with data:', {
    hasReportData: !!reportData,
    totalLogs: reportData?.totalLogs,
    logsCount: reportData?.logs?.length || 0,
    pdfUrlsCount: Object.keys(pdfUrls).length,
    loading,
  });

  return (
    <AppShell title="Reports">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {reportData?.totalLogs || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Logs</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {reportData?.logsThisMonth || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">This Month</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {reportData?.complianceRate || 0}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Compliance Rate</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {reportData?.openCorrectiveActions || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Open Actions</div>
            </div>
          </Card>
        </div>

        {/* Logs Table */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Inspection Logs
              </h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as 'all' | 'pass' | 'fail')
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) =>
                    setDateFilter(
                      e.target.value as 'all' | 'week' | 'month' | 'year'
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tank ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inspector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compliance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => {
                  const logDate = new Date(log.occurred_at);
                  const status =
                    log.leak_check && (log.visual_ok === null || log.visual_ok)
                      ? 'pass'
                      : 'fail';

                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {logDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.site}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.tank_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            status === 'pass'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {status === 'pass' ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.compliance_mode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {log.pdf_url ? (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              try {
                                // Get the URL to use
                                let url = pdfUrls[log.id] || log.pdf_url;

                                // If no signed URL, try to generate one
                                if (!pdfUrls[log.id]) {
                                  const response = await fetch(
                                    '/api/generate-pdf-urls',
                                    {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        pdfPaths: [
                                          {
                                            logId: log.id,
                                            pdfPath: log.pdf_url,
                                          },
                                        ],
                                      }),
                                    }
                                  );

                                  if (response.ok) {
                                    const data = await response.json();
                                    url = data.urls[log.id] || log.pdf_url;
                                  }
                                }

                                if (url) {
                                  // Create download link
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `TankLog_Report_${log.tank_id}_${new Date(
                                    log.occurred_at
                                  )
                                    .toISOString()
                                    .replace('T', '_')
                                    .replace(/\.\d{3}Z$/, '')
                                    .replace(/:/g, '-')}.pdf`;
                                  link.target = '_blank';
                                  link.rel = 'noopener noreferrer';

                                  // Add to DOM, click, then remove
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                } else {
                                  alert('No PDF URL available');
                                }
                              } catch (error) {
                                alert(
                                  'Failed to download PDF: ' +
                                    (error instanceof Error
                                      ? error.message
                                      : 'Unknown error')
                                );
                              }
                            }}
                            className="text-primary hover:text-primary-dark underline text-sm"
                          >
                            PDF
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">No PDF</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Export Options */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Export Data
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Download your inspection data in various formats
              </p>
            </div>
            <button
              onClick={() => {
                // TODO: Implement CSV export
                alert('CSV export coming soon!');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Export to CSV</span>
            </button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
