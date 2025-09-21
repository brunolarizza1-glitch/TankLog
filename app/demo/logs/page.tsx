'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Card } from '@/components/design-system';

interface DemoLog {
  id: string;
  site: string;
  tank_id: string;
  vehicle_id?: string;
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

// Mock data for demo
const mockLogs: DemoLog[] = [
  {
    id: 'demo-1',
    site: 'Main Facility - Building A',
    tank_id: 'TANK-001',
    vehicle_id: 'VEH-001',
    occurred_at: '2025-01-20T09:00:00Z',
    leak_check: true,
    visual_ok: true,
    pressure: '250',
    notes: 'Routine inspection completed. All systems functioning normally. No leaks detected during soap bubble test.',
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
    notes: 'Minor leak detected at connection point. Soap bubble test confirmed leak at valve connection.',
    corrective_action: 'Replace gasket and retest system pressure. Schedule follow-up inspection within 24 hours.',
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
    vehicle_id: 'VEH-002',
    occurred_at: '2025-01-18T11:15:00Z',
    leak_check: true,
    visual_ok: true,
    pressure: '275',
    notes: 'Weekly inspection. No issues found. All safety systems operational.',
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
    notes: 'Monthly comprehensive inspection. All safety systems operational. Documentation updated.',
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
    vehicle_id: 'VEH-003',
    occurred_at: '2025-01-16T08:30:00Z',
    leak_check: false,
    visual_ok: true,
    pressure: '190',
    notes: 'Pressure below recommended range. Visual inspection passed but pressure needs adjustment.',
    corrective_action: 'Adjust pressure regulator and verify system integrity. Retest within 48 hours.',
    compliance_mode: 'US_NFPA58',
    user: {
      name: 'Demo Inspector',
      email: 'demo@tanklog.com'
    }
  }
];

export default function DemoLogsPage() {
  const [logs, setLogs] = useState<DemoLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLogs(mockLogs);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <AppShell title="Demo - Inspection Logs">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Demo - Inspection Logs">
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
                Demo Mode - Inspection Logs
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Viewing sample inspection logs. 
                  <a href="/signin" className="font-medium underline hover:text-blue-600">
                    Sign in
                  </a> to create and manage your own inspection logs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {log.tank_id}
                    </h3>
                    <span className={`badge ${
                      log.leak_check && (log.visual_ok === null || log.visual_ok)
                        ? 'badge-success'
                        : 'badge-error'
                    }`}>
                      {log.leak_check && (log.visual_ok === null || log.visual_ok) ? 'Pass' : 'Fail'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {log.compliance_mode}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Site:</span> {log.site}
                      </p>
                      {log.vehicle_id && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Vehicle:</span> {log.vehicle_id}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Date:</span> {new Date(log.occurred_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Inspector:</span> {log.user.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Leak Check:</span> 
                        <span className={`ml-1 ${log.leak_check ? 'text-green-600' : 'text-red-600'}`}>
                          {log.leak_check ? '✓ Pass' : '✗ Fail'}
                        </span>
                      </p>
                      {log.visual_ok !== null && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Visual:</span> 
                          <span className={`ml-1 ${log.visual_ok ? 'text-green-600' : 'text-red-600'}`}>
                            {log.visual_ok ? '✓ OK' : '✗ Issues'}
                          </span>
                        </p>
                      )}
                      {log.pressure && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Pressure:</span> {log.pressure} psi
                        </p>
                      )}
                    </div>
                  </div>

                  {log.notes && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {log.notes}
                      </p>
                    </div>
                  )}

                  {log.corrective_action && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-red-700 mb-1">Corrective Action Required:</p>
                      <p className="text-sm text-red-600 bg-red-50 p-3 rounded border-l-4 border-red-200">
                        {log.corrective_action}
                      </p>
                    </div>
                  )}
                </div>

                <div className="ml-4 flex flex-col space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      alert('Demo Mode: PDF generation is disabled. Sign in to generate actual PDFs.');
                    }}
                    className="btn btn-outline btn-sm"
                  >
                    View PDF (Demo)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      alert('Demo Mode: Log editing is disabled. Sign in to create and edit your own logs.');
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    Edit (Demo)
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Demo Features */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Try TankLog Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Create New Logs</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create detailed inspection logs with leak detection, visual inspections, 
                pressure readings, and corrective actions.
              </p>
              <button
                type="button"
                onClick={() => {
                  alert('Demo Mode: Log creation is disabled. Sign in to create your own logs.');
                }}
                className="btn btn-primary btn-sm"
              >
                Create New Log (Demo)
              </button>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Generate Reports</h3>
              <p className="text-sm text-gray-600 mb-4">
                Generate professional PDF reports for compliance, audits, and record keeping.
              </p>
              <button
                type="button"
                onClick={() => {
                  alert('Demo Mode: PDF generation is disabled. Sign in to generate actual PDFs.');
                }}
                className="btn btn-outline btn-sm"
              >
                Generate Report (Demo)
              </button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
