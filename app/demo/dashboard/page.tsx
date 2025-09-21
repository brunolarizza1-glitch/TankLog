'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Card } from '@/components/design-system';

interface DemoStats {
  totalLogs: number;
  logsThisMonth: number;
  logsThisWeek: number;
  complianceRate: number;
  correctiveActions: number;
  openCorrectiveActions: number;
  recentLogs: Array<{
    id: string;
    tank_id: string;
    site: string;
    occurred_at: string;
    leak_check: boolean;
    visual_ok?: boolean;
  }>;
}

// Mock data for demo
const mockStats: DemoStats = {
  totalLogs: 47,
  logsThisMonth: 12,
  logsThisWeek: 3,
  complianceRate: 85,
  correctiveActions: 8,
  openCorrectiveActions: 3,
  recentLogs: [
    {
      id: 'demo-1',
      tank_id: 'TANK-001',
      site: 'Main Facility - Building A',
      occurred_at: '2025-01-20T09:00:00Z',
      leak_check: true,
      visual_ok: true
    },
    {
      id: 'demo-2',
      tank_id: 'TANK-002',
      site: 'Secondary Facility - Building B',
      occurred_at: '2025-01-19T14:30:00Z',
      leak_check: false,
      visual_ok: false
    },
    {
      id: 'demo-3',
      tank_id: 'TANK-003',
      site: 'Main Facility - Building A',
      occurred_at: '2025-01-18T11:15:00Z',
      leak_check: true,
      visual_ok: true
    },
    {
      id: 'demo-4',
      tank_id: 'TANK-004',
      site: 'Remote Site - Location C',
      occurred_at: '2025-01-17T16:45:00Z',
      leak_check: true,
      visual_ok: true
    },
    {
      id: 'demo-5',
      tank_id: 'TANK-005',
      site: 'Main Facility - Building A',
      occurred_at: '2025-01-16T08:30:00Z',
      leak_check: false,
      visual_ok: true
    }
  ]
};

export default function DemoDashboardPage() {
  const [stats, setStats] = useState<DemoStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <AppShell title="Demo - Dashboard">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Demo - Dashboard">
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
                Demo Mode - Dashboard
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Viewing sample dashboard data. 
                  <a href="/signin" className="font-medium underline hover:text-blue-600">
                    Sign in
                  </a> to access your real inspection data and analytics.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {stats?.totalLogs || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Logs</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats?.logsThisMonth || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">This Month</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats?.complianceRate || 0}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Compliance Rate</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {stats?.openCorrectiveActions || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Open Corrective Actions
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => {
                alert('Demo Mode: Log creation is disabled. Sign in to create your own logs.');
              }}
              className="btn btn-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Inspection Log
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/demo/reports';
              }}
              className="btn btn-outline"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Reports
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/demo/logs';
              }}
              className="btn btn-outline"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View All Logs
            </button>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {stats?.recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    log.leak_check && (log.visual_ok === null || log.visual_ok)
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {log.tank_id} - {log.site}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.occurred_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`badge badge-sm ${
                    log.leak_check && (log.visual_ok === null || log.visual_ok)
                      ? 'badge-success'
                      : 'badge-error'
                  }`}>
                    {log.leak_check && (log.visual_ok === null || log.visual_ok) ? 'Pass' : 'Fail'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      alert('Demo Mode: Log details are disabled. Sign in to view detailed logs.');
                    }}
                    className="text-primary hover:text-primary-dark text-sm"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Demo Features */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">TankLog Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Inspection Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create detailed inspection logs</li>
                <li>• Track leak detection results</li>
                <li>• Record visual inspections</li>
                <li>• Manage corrective actions</li>
                <li>• Digital signature support</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Compliance & Reporting</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Generate professional PDF reports</li>
                <li>• Track compliance rates</li>
                <li>• Export data for audits</li>
                <li>• Regulatory compliance tracking</li>
                <li>• Automated reminders</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Analytics & Insights</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time dashboard</li>
                <li>• Performance metrics</li>
                <li>• Trend analysis</li>
                <li>• Custom reporting</li>
                <li>• Data visualization</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 text-center">
            <a
              href="/signin"
              className="btn btn-primary btn-lg"
            >
              Get Started - Sign In
            </a>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
