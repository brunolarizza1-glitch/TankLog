'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Card } from '@/components/design-system';

interface DemoLog {
  id: string;
  site: string;
  tank_id: string;
  occurred_at: string;
  leak_check: boolean;
  visual_ok?: boolean;
  pressure?: string;
  notes?: string;
  corrective_action?: string;
  compliance_mode: string;
  user: {
    name: string;
    email: string;
  };
}

interface DemoReportData {
  totalLogs: number;
  logsThisMonth: number;
  logsThisWeek: number;
  complianceRate: number;
  correctiveActions: number;
  openCorrectiveActions: number;
  logs: DemoLog[];
}

// Mock data for demo
const mockLogs: DemoLog[] = [
  {
    id: 'demo-1',
    site: 'Main Facility - Building A',
    tank_id: 'TANK-001',
    occurred_at: '2025-01-20T09:00:00Z',
    leak_check: true,
    visual_ok: true,
    pressure: '250',
    notes: 'Routine inspection completed. All systems functioning normally.',
    compliance_mode: 'US_NFPA58',
    user: {
      name: 'Demo Inspector',
      email: 'demo@tanklog.com'
    }
  },
  {
    id: 'demo-2',
    site: 'Secondary Facility - Building B',
    tank_id: 'TANK-002',
    occurred_at: '2025-01-19T14:30:00Z',
    leak_check: false,
    visual_ok: false,
    pressure: '180',
    notes: 'Minor leak detected at connection point. Corrective action required.',
    corrective_action: 'Replace gasket and retest system pressure',
    compliance_mode: 'US_NFPA58',
    user: {
      name: 'Demo Inspector',
      email: 'demo@tanklog.com'
    }
  },
  {
    id: 'demo-3',
    site: 'Main Facility - Building A',
    tank_id: 'TANK-003',
    occurred_at: '2025-01-18T11:15:00Z',
    leak_check: true,
    visual_ok: true,
    pressure: '275',
    notes: 'Weekly inspection. No issues found.',
    compliance_mode: 'US_NFPA58',
    user: {
      name: 'Demo Inspector',
      email: 'demo@tanklog.com'
    }
  },
  {
    id: 'demo-4',
    site: 'Remote Site - Location C',
    tank_id: 'TANK-004',
    occurred_at: '2025-01-17T16:45:00Z',
    leak_check: true,
    visual_ok: true,
    pressure: '220',
    notes: 'Monthly comprehensive inspection. All safety systems operational.',
    compliance_mode: 'CA_TSSA',
    user: {
      name: 'Demo Inspector',
      email: 'demo@tanklog.com'
    }
  },
  {
    id: 'demo-5',
    site: 'Main Facility - Building A',
    tank_id: 'TANK-005',
    occurred_at: '2025-01-16T08:30:00Z',
    leak_check: false,
    visual_ok: true,
    pressure: '190',
    notes: 'Pressure below recommended range. System maintenance scheduled.',
    corrective_action: 'Adjust pressure regulator and verify system integrity',
    compliance_mode: 'US_NFPA58',
    user: {
      name: 'Demo Inspector',
      email: 'demo@tanklog.com'
    }
  }
];

const mockReportData: DemoReportData = {
  totalLogs: mockLogs.length,
  logsThisMonth: mockLogs.length,
  logsThisWeek: 3,
  complianceRate: 60, // 3 out of 5 logs passed
  correctiveActions: 2,
  openCorrectiveActions: 2,
  logs: mockLogs
};

export default function DemoPage() {
  const [reportData, setReportData] = useState<DemoReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setReportData(mockReportData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter logs based on search and filters
  const filteredLogs = reportData?.logs?.filter((log) => {
    const matchesSearch =
      log.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.tank_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pass' && log.leak_check && (log.visual_ok === null || log.visual_ok)) ||
      (statusFilter === 'fail' && (!log.leak_check || log.visual_ok === false));

    const logDate = new Date(log.occurred_at);
    const now = new Date();
    const matchesDate =
      dateFilter === 'all' ||
      (dateFilter === 'week' && logDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'month' && logDate >= new Date(now.getFullYear(), now.getMonth(), 1)) ||
      (dateFilter === 'year' && logDate >= new Date(now.getFullYear(), 0, 1));

    return matchesSearch && matchesStatus && matchesDate;
  }) || [];

  if (loading) {
    return (
      <AppShell title="Demo - TankLog">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Demo - TankLog">
      <div className="space-y-6">
        {/* Demo Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Demo Mode
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  You're viewing TankLog in demo mode with sample data. 
                  <a href="/signin" className="font-medium underline hover:text-blue-600">
                    Sign in
                  </a> to access your real data and generate actual PDF reports.
                </p>
              </div>
            </div>
          </div>
        </div>

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
              <div className="text-3xl font-bold text-red-600">
                {reportData?.openCorrectiveActions || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Open Corrective Actions
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          <input
            type="text"
            placeholder="Search logs..."
            className="input input-bordered w-full md:flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="select select-bordered w-full md:w-auto"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | 'pass' | 'fail')
            }
          >
            <option value="all">All Statuses</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
          <select
            className="select select-bordered w-full md:w-auto"
            value={dateFilter}
            onChange={(e) =>
              setDateFilter(e.target.value as 'all' | 'week' | 'month' | 'year')
            }
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Site</th>
                <th>Tank ID</th>
                <th>Date</th>
                <th>Inspector</th>
                <th>Status</th>
                <th>Compliance Mode</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.site}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.tank_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.occurred_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.leak_check && (log.visual_ok === null || log.visual_ok) ? (
                        <span className="badge badge-success">Pass</span>
                      ) : (
                        <span className="badge badge-error">Fail</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.compliance_mode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          alert('Demo Mode: PDF generation is disabled. Sign in to generate actual PDFs.');
                        }}
                        className="text-primary hover:text-primary-dark underline text-sm"
                      >
                        PDF (Demo)
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No logs found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <ul className="space-y-2">
            {filteredLogs.slice(0, 5).map((log) => (
              <li key={log.id} className="text-gray-700">
                {new Date(log.occurred_at).toLocaleDateString()} - Log for{' '}
                <span className="font-medium">{log.tank_id}</span> at{' '}
                <span className="font-medium">{log.site}</span> by{' '}
                <span className="font-medium">{log.user.name}</span> (
                {log.leak_check ? 'Pass' : 'Fail'})
              </li>
            ))}
          </ul>
        </Card>

        {/* Demo Features */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Try TankLog Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Inspection Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create new inspection logs</li>
                <li>• Track leak detection results</li>
                <li>• Record visual inspections</li>
                <li>• Manage corrective actions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Compliance & Reporting</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Generate professional PDF reports</li>
                <li>• Track compliance rates</li>
                <li>• Export data for audits</li>
                <li>• Digital signature support</li>
              </ul>
            </div>
          </div>
          <div className="mt-6">
            <a
              href="/signin"
              className="btn btn-primary"
            >
              Get Started - Sign In
            </a>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
