'use client';

import { useState, useEffect } from 'react';
import {
  CorrectiveActionWithDetails,
  getOpenActions,
} from '@/lib/corrective-actions-client';
import { useAuth } from '@/lib/auth';
import { useSyncStatus } from '@/lib/sync';

interface CorrectiveActionsListProps {
  onActionClick?: (action: CorrectiveActionWithDetails) => void;
  onMarkCompleted?: (actionId: string) => void;
  filter?: 'all' | 'overdue' | 'due_soon' | 'on_track';
  showFilters?: boolean;
  compact?: boolean;
}

export default function CorrectiveActionsList({
  onActionClick,
  onMarkCompleted,
  filter = 'all',
  showFilters = true,
  compact = false,
}: CorrectiveActionsListProps) {
  const { user } = useAuth();
  const { isOnline } = useSyncStatus();
  const [actions, setActions] = useState<CorrectiveActionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState(filter);

  useEffect(() => {
    loadActions();
  }, [selectedFilter]);

  const loadActions = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getOpenActions();
      setActions(data.actions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load actions');
      console.error('Error loading corrective actions:', err);
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
        return 'bg-red-100 text-red-800 border-red-200';
      case 'due_soon':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on_track':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'immediate':
        return '🔴';
      case '24hr':
        return '🟡';
      case '7day':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'overdue':
        return 'text-red-600 bg-red-50';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-50';
      case 'open':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredActions = actions.filter((action) => {
    const priority = getPriorityLevel(action);
    switch (selectedFilter) {
      case 'overdue':
        return priority === 'overdue';
      case 'due_soon':
        return priority === 'due_soon';
      case 'on_track':
        return priority === 'on_track';
      default:
        return true;
    }
  });

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
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadActions}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (filteredActions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Corrective Actions
        </h3>
        <p className="text-gray-600">
          {selectedFilter === 'all'
            ? 'No corrective actions found'
            : `No ${selectedFilter.replace('_', ' ')} actions found`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'all', label: 'All', count: actions.length },
            {
              key: 'overdue',
              label: 'Overdue',
              count: actions.filter((a) => getPriorityLevel(a) === 'overdue')
                .length,
            },
            {
              key: 'due_soon',
              label: 'Due Soon',
              count: actions.filter((a) => getPriorityLevel(a) === 'due_soon')
                .length,
            },
            {
              key: 'on_track',
              label: 'On Track',
              count: actions.filter((a) => getPriorityLevel(a) === 'on_track')
                .length,
            },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setSelectedFilter(key as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedFilter === key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <span className="text-orange-500 mr-2">📡</span>
            <span className="text-sm text-orange-800">
              Offline mode - Actions will sync when online
            </span>
          </div>
        </div>
      )}

      {/* Actions List */}
      <div className="space-y-3">
        {filteredActions.map((action) => {
          const priority = getPriorityLevel(action);
          const priorityColor = getPriorityColor(priority);
          const priorityIcon = getPriorityIcon(priority);

          return (
            <div
              key={action.id}
              className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                priority === 'overdue' ? 'border-red-200' : 'border-gray-200'
              }`}
              onClick={() => onActionClick?.(action)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {getSeverityIcon(action.severity_level)}
                  </span>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {action.inspection_item_id
                        .replace('_', ' ')
                        .toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {action.inspection?.site} - {action.inspection?.tank_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${priorityColor}`}
                  >
                    {priorityIcon} {priority.replace('_', ' ').toUpperCase()}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getStatusColor(action.status)}`}
                  >
                    {action.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-700 line-clamp-2">
                  {action.description}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Due: {new Date(action.due_date).toLocaleDateString()}
                  </span>
                  <span className="font-medium">
                    {formatTimeRemaining(action.due_date)}
                  </span>
                </div>

                {action.technician && (
                  <p className="text-xs text-gray-500">
                    Assigned to: {action.technician.name}
                  </p>
                )}

                {!compact && (
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkCompleted?.(action.id);
                      }}
                      className="text-xs text-green-600 hover:text-green-800 underline"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onActionClick?.(action);
                      }}
                      className="text-xs text-primary hover:text-primary-dark underline"
                    >
                      View Details
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
