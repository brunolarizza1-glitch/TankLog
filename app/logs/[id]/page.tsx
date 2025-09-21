'use client';

import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Card } from '@/components/design-system';
import { getComplianceModeInfo } from '@/lib/compliance';

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
  notes?: string;
  corrective_action?: string;
  photo_urls: string[];
  pressure?: string;
  vehicle_id?: string;
  user: {
    name: string;
    email: string;
  };
}

export default function LogDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [log, setLog] = useState<Log | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    if (params.id) {
      loadLog();
    }
  }, [user, params.id, router]);

  const loadLog = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/logs/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setLog(data);
      } else {
        router.push('/logs');
      }
    } catch (error) {
      console.error('Error fetching log:', error);
      router.push('/logs');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <AppShell
        title="Log Details"
        breadcrumbs={[{ label: 'Logs', href: '/logs' }, { label: 'Details' }]}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell
        title="Log Details"
        breadcrumbs={[{ label: 'Logs', href: '/logs' }, { label: 'Details' }]}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  if (!log) {
    return (
      <AppShell
        title="Log Details"
        breadcrumbs={[{ label: 'Logs', href: '/logs' }, { label: 'Details' }]}
      >
        <div className="text-center py-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Log not found
          </h2>
          <p className="text-gray-600 mb-4">
            The log you&apos;re looking for doesn&apos;t exist or you don&apos;t have
            permission to view it.
          </p>
          <button
            onClick={() => router.push('/logs')}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Logs
          </button>
        </div>
      </AppShell>
    );
  }

  const complianceInfo = getComplianceModeInfo(log.compliance_mode);
  const hasFailures = !log.leak_check || log.visual_ok === false;

  return (
    <AppShell
      title="Log Details"
      breadcrumbs={[{ label: 'Logs', href: '/logs' }, { label: 'Details' }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">
              {log.site || 'Unnamed Site'}
            </h1>
            <p className="text-gray-600">Tank ID: {log.tank_id}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push('/logs')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Back to Logs
            </button>
            {log.pdf_url && (
              <a
                href={log.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                View PDF
              </a>
            )}
          </div>
        </div>

        {/* Status Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Inspection Status
            </h2>
            <span
              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                hasFailures
                  ? 'text-red-600 bg-red-100'
                  : 'text-green-600 bg-green-100'
              }`}
            >
              {hasFailures ? 'Failed' : 'Passed'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${log.leak_check ? 'bg-green-500' : 'bg-red-500'}`}
              ></div>
              <span className="text-sm font-medium">
                Leak Check: {log.leak_check ? 'Pass' : 'Fail'}
              </span>
            </div>
            {log.visual_ok !== null && (
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${log.visual_ok ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <span className="text-sm font-medium">
                  Visual Inspection: {log.visual_ok ? 'Pass' : 'Fail'}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Inspection Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Inspection Details
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Date of Inspection
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(log.occurred_at).toLocaleDateString()} at{' '}
                  {new Date(log.occurred_at).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Inspector
                </label>
                <p className="text-sm text-gray-900">{log.user.name}</p>
                <p className="text-xs text-gray-500">{log.user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Compliance Mode
                </label>
                <p className="text-sm text-gray-900">{complianceInfo.mode}</p>
              </div>
              {log.pressure && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Pressure
                  </label>
                  <p className="text-sm text-gray-900">
                    {log.pressure} {complianceInfo.labels.pressureUnit}
                  </p>
                </div>
              )}
              {log.vehicle_id && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Vehicle ID
                  </label>
                  <p className="text-sm text-gray-900">{log.vehicle_id}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Log ID
                </label>
                <p className="text-sm text-gray-900 font-mono">{log.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Created
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(log.created_at).toLocaleDateString()} at{' '}
                  {new Date(log.created_at).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Version
                </label>
                <p className="text-sm text-gray-900">1</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Notes */}
        {log.notes && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {log.notes}
              </p>
            </div>
          </Card>
        )}

        {/* Corrective Action */}
        {log.corrective_action && (
          <Card className="p-6 border-red-200 bg-red-50">
            <h3 className="text-lg font-semibold text-red-900 mb-4">
              Corrective Action Required
            </h3>
            <div className="bg-red-100 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-700 whitespace-pre-wrap">
                {log.corrective_action}
              </p>
            </div>
          </Card>
        )}

        {/* Photos */}
        {log.photo_urls && log.photo_urls.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Photos ({log.photo_urls.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {log.photo_urls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Inspection photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}


