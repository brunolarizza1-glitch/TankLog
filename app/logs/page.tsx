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
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

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

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  if (!user) {
    return (
      <AppShell title="Logs" breadcrumbs={[{ label: 'Logs' }]}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell title="Logs" breadcrumbs={[{ label: 'Logs' }]}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Logs" breadcrumbs={[{ label: 'Logs' }]}>
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
              const isExpanded = expandedLogs.has(log.id);
              return (
                <div
                  key={log.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => toggleExpanded(log.id)}
                >
                  {/* Summary View */}
                  <div className="p-4">
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
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm text-gray-500">
                          <p>Version {log.version}</p>
                          <p>{new Date(log.created_at).toLocaleDateString()}</p>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">
                            Inspection Details
                          </h4>
                          {log.visual_ok !== null && (
                            <p className="text-sm">
                              <strong>Visual Inspection:</strong>
                              <span
                                className={`ml-1 ${log.visual_ok ? 'text-green-600' : 'text-red-600'}`}
                              >
                                {log.visual_ok ? 'All OK' : 'Issues Found'}
                              </span>
                            </p>
                          )}
                          {log.pressure && (
                            <p className="text-sm">
                              <strong>Pressure:</strong> {log.pressure}{' '}
                              {complianceInfo.labels.pressureUnit}
                            </p>
                          )}
                          <p className="text-sm">
                            <strong>Compliance Mode:</strong>{' '}
                            {complianceInfo.mode}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">
                            Additional Info
                          </h4>
                          <p className="text-sm">
                            <strong>Created:</strong>{' '}
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                          <p className="text-sm">
                            <strong>Occurred:</strong>{' '}
                            {new Date(log.occurred_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {log.notes && (
                        <div className="pt-3 border-t border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Notes
                          </h4>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {log.notes}
                          </p>
                        </div>
                      )}

                      {log.corrective_action && (
                        <div className="pt-3 border-t border-gray-200">
                          <h4 className="font-medium text-red-600 mb-2">
                            Corrective Action Required
                          </h4>
                          <p className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                            {log.corrective_action}
                          </p>
                        </div>
                      )}

                      {log.photo_urls && log.photo_urls.length > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Photos ({log.photo_urls.length})
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {log.photo_urls.map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`Inspection photo ${index + 1}`}
                                className="w-full h-20 object-cover rounded border"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-200 flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add edit functionality here
                          }}
                          className="text-sm text-primary hover:text-primary-dark underline"
                        >
                          Edit Log
                        </button>
                        {log.pdf_url && (
                          <a
                            href={log.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-primary hover:text-primary-dark underline"
                          >
                            View PDF
                          </a>
                        )}
                      </div>
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
