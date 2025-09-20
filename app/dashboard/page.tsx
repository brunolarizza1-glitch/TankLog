'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalLogs: 0,
    thisMonth: 0,
    pendingIssues: 0,
  });
  const [recentLogs, setRecentLogs] = useState<
    Array<{
      id: string;
      site?: string;
      vehicle_id?: string;
      occurred_at: string;
      leak_check: boolean;
      visual_ok?: boolean;
    }>
  >([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/logs/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      // Error handling is done in the API route
    }
  }, []);

  const fetchRecentLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const response = await fetch('/api/logs');
      if (response.ok) {
        const data = await response.json();
        setRecentLogs(data.logs?.slice(0, 5) || []); // Get last 5 logs
      }
    } catch (error) {
      // Error handling is done in the API route
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile?.org_id) {
      fetchStats();
      fetchRecentLogs();
    }
  }, [profile, fetchStats, fetchRecentLogs]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell
      title="Dashboard"
      breadcrumbs={[
        { label: 'Dashboard' }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">
              Welcome back, {profile?.name || 'User'}!
            </h1>
            <p className="text-gray-600">
              {profile?.org_id
                ? 'Ready to log your next inspection'
                : 'Complete your setup to get started'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{profile?.role}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="heading-2 text-gray-700">{stats.totalLogs}</p>
            <p className="text-sm text-gray-500">Total Logs</p>
          </div>
          <div className="card p-4">
            <p className="heading-2 text-gray-700">{stats.thisMonth}</p>
            <p className="text-sm text-gray-500">This Month</p>
          </div>
          <div className="card p-4">
            <p className="heading-2 text-danger">{stats.pendingIssues}</p>
            <p className="text-sm text-gray-500">Issues</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/logs/new"
            className="btn btn-primary btn-lg w-full text-center"
          >
            New Log Entry
          </Link>

          <Link
            href="/logs"
            className="btn btn-outline btn-lg w-full text-center"
          >
            View All Logs
          </Link>
        </div>

        {/* Recent Logs Preview */}
        <div className="card p-4">
          <h3 className="heading-4 text-gray-700 mb-4">Recent Logs</h3>
          {logsLoading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Loading logs...</p>
            </div>
          ) : recentLogs.length > 0 ? (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">
                      {log.site || log.vehicle_id || 'Unknown Site'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.occurred_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {log.leak_check === false && (
                      <span className="badge badge-danger">Leak Issue</span>
                    )}
                    {log.visual_ok === false && (
                      <span className="badge badge-warning">Visual Issue</span>
                    )}
                    {log.leak_check !== false && log.visual_ok !== false && (
                      <span className="badge badge-success">OK</span>
                    )}
                  </div>
                </div>
              ))}
              <div className="text-center pt-2">
                <Link
                  href="/logs"
                  className="text-primary text-sm hover:underline"
                >
                  View all logs →
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent logs found</p>
              <Link href="/logs/new" className="text-primary hover:underline">
                Create your first log
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
