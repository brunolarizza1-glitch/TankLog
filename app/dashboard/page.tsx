'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import {
  ComplianceOverviewCard,
  QuickActionsCard,
  AlertSummaryCard,
  SkeletonCard,
  EmptyState,
} from '@/components/dashboard';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalLogs: 0,
    thisMonth: 0,
    pendingIssues: 0,
  });
  const [complianceData, setComplianceData] = useState({
    percentage: 0,
    status: 'compliant' as 'compliant' | 'warning' | 'critical',
    trend: 'stable' as 'up' | 'down' | 'stable',
    trendValue: 0,
  });
  const [alertData, setAlertData] = useState({
    overdueCount: 0,
    dueSoonCount: 0,
    completedToday: 0,
  });
  const [recentActivity, setRecentActivity] = useState<
    Array<{
      id: string;
      action: string;
      timestamp: string;
      type: 'inspection' | 'action' | 'completion';
    }>
  >([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/logs/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);

        // Calculate compliance percentage based on logs
        const totalLogs = data.totalLogs || 0;
        const pendingIssues = data.pendingIssues || 0;
        const compliancePercentage =
          totalLogs > 0
            ? Math.round(((totalLogs - pendingIssues) / totalLogs) * 100)
            : 100;

        setComplianceData({
          percentage: compliancePercentage,
          status:
            compliancePercentage >= 90
              ? 'compliant'
              : compliancePercentage >= 70
                ? 'warning'
                : 'critical',
          trend: 'stable', // This would come from historical data
          trendValue: 0,
        });
      }
    } catch (error) {
      // Error handling is done in the API route
    }
  }, []);

  const fetchAlertData = useCallback(async () => {
    try {
      // Fetch corrective actions for alert data
      const response = await fetch('/api/corrective-actions');
      if (response.ok) {
        const data = await response.json();
        const actions = data.actions || [];

        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        const overdueCount = actions.filter(
          (action: any) =>
            new Date(action.due_date) < now && action.status !== 'completed'
        ).length;

        const dueSoonCount = actions.filter((action: any) => {
          const dueDate = new Date(action.due_date);
          const daysUntilDue = Math.ceil(
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return (
            daysUntilDue <= 3 &&
            daysUntilDue > 0 &&
            action.status !== 'completed'
          );
        }).length;

        const completedToday = actions.filter((action: any) => {
          const completedAt = new Date(action.completed_at);
          return completedAt >= today && action.status === 'completed';
        }).length;

        setAlertData({
          overdueCount,
          dueSoonCount,
          completedToday,
        });
      }
    } catch (error) {
      // Error handling
    }
  }, []);

  const fetchRecentActivity = useCallback(async () => {
    setLogsLoading(true);
    try {
      const response = await fetch('/api/logs');
      if (response.ok) {
        const data = await response.json();
        const logs = data.logs?.slice(0, 5) || [];

        // Convert logs to activity items
        const activity = logs.map((log: any) => ({
          id: log.id,
          action: `Log completed at ${log.site || log.vehicle_id || 'Unknown Site'}`,
          timestamp: log.occurred_at,
          type: 'inspection' as const,
        }));

        setRecentActivity(activity);
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
      fetchAlertData();
      fetchRecentActivity();
    }
  }, [profile, fetchStats, fetchAlertData, fetchRecentActivity]);

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
    <AppShell title="Dashboard" breadcrumbs={[{ label: 'Dashboard' }]}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="text-center md:text-left">
          <h1 className="heading-2 text-gray-700 mb-2">
            Welcome back, {profile?.name || 'User'}!
          </h1>
          <p className="text-gray-500">
            {profile?.org_id
              ? `Organization: ${profile.org_id}`
              : 'No organization assigned'}
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Compliance Overview Card - Full width on mobile, spans 2 columns on desktop */}
          <div className="md:col-span-2 lg:col-span-1">
            {logsLoading ? (
              <SkeletonCard variant="compliance" />
            ) : (
              <ComplianceOverviewCard
                compliancePercentage={complianceData.percentage}
                status={complianceData.status}
                trend={complianceData.trend}
                trendValue={complianceData.trendValue}
              />
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="md:col-span-2 lg:col-span-1">
            {logsLoading ? (
              <SkeletonCard variant="actions" />
            ) : (
              <QuickActionsCard
                overdueCount={alertData.overdueCount}
                recentActivity={recentActivity}
              />
            )}
          </div>

          {/* Alert Summary Card */}
          <div className="md:col-span-2 lg:col-span-1">
            {logsLoading ? (
              <SkeletonCard variant="alerts" />
            ) : (
              <AlertSummaryCard
                overdueCount={alertData.overdueCount}
                dueSoonCount={alertData.dueSoonCount}
                completedToday={alertData.completedToday}
              />
            )}
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="card p-4 text-center">
            <p className="heading-2 text-gray-700 mb-1">{stats.totalLogs}</p>
            <p className="text-sm text-gray-500">Total Inspections</p>
          </div>
          <div className="card p-4 text-center">
            <p className="heading-2 text-gray-700 mb-1">{stats.thisMonth}</p>
            <p className="text-sm text-gray-500">This Month</p>
          </div>
          <div className="card p-4 text-center">
            <p className="heading-2 text-danger mb-1">{stats.pendingIssues}</p>
            <p className="text-sm text-gray-500">Pending Issues</p>
          </div>
        </div>

        {/* Empty State for No Data */}
        {!logsLoading && stats.totalLogs === 0 && (
          <EmptyState
            title="No inspections yet"
            description="Get started by creating your first inspection log to track your propane compliance."
            actionLabel="Create First Inspection"
            actionHref="/logs/new"
            icon={
              <svg
                className="w-12 h-12 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            }
          />
        )}
      </div>
    </AppShell>
  );
}
