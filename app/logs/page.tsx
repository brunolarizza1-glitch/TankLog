'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import { Log } from '@/server/db';
import { getComplianceModeInfo } from '@/lib/compliance';

export default function LogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    loadLogs();
  }, [user, router]);

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-dark">Logs</h1>
          <a
            href="/logs/new"
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            New Log
          </a>
        </div>

        {/* Logs List */}
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-lg font-semibold text-brand-dark mb-2">
              No logs yet
            </h2>
            <p className="text-gray-600 mb-4">
              Create your first log to get started.
            </p>
            <a
              href="/logs/new"
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create First Log
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const complianceInfo = getComplianceModeInfo(log.compliance_mode);
              return (
                <div
                  key={log.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-brand-dark">
                          {log.site || log.vehicle_id || 'Unnamed Site'}
                        </h3>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {complianceInfo.mode}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Tank ID:</strong> {log.tank_id}
                        </p>
                        <p>
                          <strong>Date:</strong>{' '}
                          {new Date(log.occurred_at).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Leak Check:</strong>
                          <span
                            className={`ml-1 ${log.leak_check ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {log.leak_check ? 'Pass' : 'Fail'}
                          </span>
                        </p>
                        {log.visual_ok !== null && (
                          <p>
                            <strong>Visual Inspection:</strong>
                            <span
                              className={`ml-1 ${log.visual_ok ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {log.visual_ok ? 'All OK' : 'Issues Found'}
                            </span>
                          </p>
                        )}
                        {log.pressure && (
                          <p>
                            <strong>Pressure:</strong> {log.pressure}{' '}
                            {complianceInfo.labels.pressureUnit}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Version {log.version}</p>
                      <p>{new Date(log.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {log.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <strong>Notes:</strong> {log.notes}
                      </p>
                    </div>
                  )}
                  {log.corrective_action && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-red-600">
                        <strong>Corrective Action:</strong>{' '}
                        {log.corrective_action}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Back to home */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-primary text-sm font-medium hover:underline"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </AppShell>
  );
}
