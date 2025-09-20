'use client';

import { useState, useEffect } from 'react';
import {
  CorrectiveActionWithDetails,
  getOpenActions,
} from '@/lib/corrective-actions-client';
import { useRouter } from 'next/navigation';

interface CorrectiveActionsWidgetProps {
  className?: string;
  showQuickActions?: boolean;
  maxItems?: number;
}

export default function CorrectiveActionsWidget({
  className = '',
  showQuickActions = true,
  maxItems = 5,
}: CorrectiveActionsWidgetProps) {
  const router = useRouter();
  const [actions, setActions] = useState<CorrectiveActionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    overdue: 0,
    dueSoon: 0,
    onTrack: 0,
  });

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    setLoading(true);
    try {
      const data = await getOpenActions();
      const allActions = data.actions || [];
      setActions(allActions.slice(0, maxItems));

      // Calculate stats
      const now = new Date();
      const overdue = allActions.filter(
        (action: CorrectiveActionWithDetails) => {
          const dueDate = new Date(action.due_date);
          return action.status === 'overdue' || dueDate < now;
        }
      ).length;

      const dueSoon = allActions.filter(
        (action: CorrectiveActionWithDetails) => {
          const dueDate = new Date(action.due_date);
          const hoursUntilDue =
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          return (
            action.status !== 'overdue' &&
            hoursUntilDue <= 24 &&
            hoursUntilDue > 0
          );
        }
      ).length;

      const onTrack = allActions.filter(
        (action: CorrectiveActionWithDetails) => {
          const dueDate = new Date(action.due_date);
          const hoursUntilDue =
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          return action.status !== 'overdue' && hoursUntilDue > 24;
        }
      ).length;

      setStats({
        total: allActions.length,
        overdue,
        dueSoon,
        onTrack,
      });
    } catch (error) {
      console.error('Failed to load corrective actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLevel = (
    action: CorrectiveActionWithDetails
  ): 'overdue' | 'due_soon' | 'on_track' => {
    const now = new Date();
    const dueDate = new Date(action.due_date);
    const hoursUntilDue =
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (action.status === 'overdue' || hoursUntilDue < 0) {
      return 'overdue';
    } else if (hoursUntilDue <= 24) {
      return 'due_soon';
    } else {
      return 'on_track';
    }
  };

  const getPriorityColor = (
    priority: 'overdue' | 'due_soon' | 'on_track'
  ): string => {
    switch (priority) {
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'due_soon':
        return 'text-yellow-600 bg-yellow-100';
      case 'on_track':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (
    priority: 'overdue' | 'due_soon' | 'on_track'
  ): string => {
    switch (priority) {
      case 'overdue':
        return '🚨';
      case 'due_soon':
        return '⚠️';
      case 'on_track':
        return '✅';
      default:
        return '📋';
    }
  };

  const formatTimeRemaining = (dueDate: string): string => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    if (diffHours < 0) {
      return `Overdue by ${Math.abs(diffHours)}h`;
    } else if (diffHours < 24) {
      return `${diffHours}h remaining`;
    } else {
      const diffDays = Math.ceil(diffHours / 24);
      return `${diffDays}d remaining`;
    }
  };

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Corrective Actions
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {stats.total} total actions
            </p>
          </div>
          <button
            onClick={() => router.push('/corrective-actions')}
            className="text-sm text-primary hover:text-primary-dark font-medium"
          >
            View All
          </button>
        </div>

        {/* Stats */}
        <div className="flex space-x-4 mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">🚨</span>
            <span className="text-sm text-gray-600">
              {stats.overdue} overdue
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500">⚠️</span>
            <span className="text-sm text-gray-600">
              {stats.dueSoon} due soon
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-sm text-gray-600">
              {stats.onTrack} on track
            </span>
          </div>
        </div>
      </div>

      {/* Actions List */}
      <div className="p-6">
        {actions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No Corrective Actions
            </h4>
            <p className="text-gray-600">
              All inspections are passing. Great job!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => {
              const priority = getPriorityLevel(action);
              const priorityColor = getPriorityColor(priority);
              const priorityIcon = getPriorityIcon(priority);

              return (
                <div
                  key={action.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push('/corrective-actions')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm">{priorityIcon}</span>
                        <h4 className="font-medium text-gray-900 text-sm">
                          {action.inspection_item_id
                            .replace('_', ' ')
                            .toUpperCase()}
                        </h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${priorityColor}`}
                        >
                          {priority.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        {action.inspection?.site} - {action.inspection?.tank_id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimeRemaining(action.due_date)}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {showQuickActions && actions.length > 0 && (
        <div className="px-6 pb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => router.push('/corrective-actions?filter=overdue')}
              className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              View Overdue
            </button>
            <button
              onClick={() => router.push('/corrective-actions?filter=due_soon')}
              className="flex-1 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors"
            >
              View Due Soon
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
