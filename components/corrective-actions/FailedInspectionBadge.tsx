'use client';

import { useState, useEffect } from 'react';
import {
  CorrectiveActionWithDetails,
  getOpenActions,
} from '@/lib/corrective-actions-client';

interface FailedInspectionBadgeProps {
  inspectionId: string;
  itemId: string;
  itemName: string;
  hasFailure: boolean;
  onViewAction?: (action: CorrectiveActionWithDetails) => void;
  compact?: boolean;
  showStatus?: boolean;
}

export default function FailedInspectionBadge({
  inspectionId,
  itemId,
  itemName,
  hasFailure,
  onViewAction,
  compact = false,
  showStatus = true,
}: FailedInspectionBadgeProps) {
  const [actions, setActions] = useState<CorrectiveActionWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasFailure) {
      loadActions();
    }
  }, [hasFailure, inspectionId, itemId]);

  const loadActions = async () => {
    setLoading(true);
    try {
      const data = await getOpenActions();
      const itemActions = (data.actions || []).filter(
        (action: CorrectiveActionWithDetails) =>
          action.inspection_id === inspectionId &&
          action.inspection_item_id === itemId
      );
      setActions(itemActions);
    } catch (error) {
      console.error('Failed to load corrective actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'overdue':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'open':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
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
        return 'border-red-500 bg-red-50';
      case 'due_soon':
        return 'border-yellow-500 bg-yellow-50';
      case 'on_track':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  if (!hasFailure) return null;

  const primaryAction =
    actions.find((a) => a.status !== 'completed') || actions[0];

  if (loading) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-lg">
        <span className="text-red-500">⚠️</span>
        <span className="text-sm font-medium text-red-800">
          {itemName} - Failed
        </span>
        <span className="text-xs text-red-600">
          (No corrective action found)
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-red-500">⚠️</span>
        <span className="text-sm font-medium text-red-800">
          {itemName} - Failed
        </span>
        {primaryAction && (
          <button
            onClick={() => onViewAction?.(primaryAction)}
            className="text-xs text-primary hover:text-primary-dark underline"
          >
            View Action
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Main Failure Indicator */}
      <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <span className="text-red-500">⚠️</span>
        <div className="flex-1">
          <span className="text-sm font-medium text-red-800">
            {itemName} - Failed
          </span>
          {primaryAction && (
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs">
                {getSeverityIcon(primaryAction.severity_level)}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${getStatusColor(primaryAction.status)}`}
              >
                {primaryAction.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          )}
        </div>
        {primaryAction && (
          <button
            onClick={() => onViewAction?.(primaryAction)}
            className="text-xs text-primary hover:text-primary-dark underline"
          >
            View Action
          </button>
        )}
      </div>

      {/* Action Details */}
      {primaryAction && (
        <div
          className={`p-3 border rounded-lg ${getPriorityColor(getPriorityLevel(primaryAction))}`}
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-700 mb-1">
                  {primaryAction.description}
                </p>
                <p className="text-xs text-gray-600">
                  Action: {primaryAction.required_action}
                </p>
              </div>
            </div>

            {showStatus && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  Due: {new Date(primaryAction.due_date).toLocaleDateString()}
                </span>
                {primaryAction.technician && (
                  <span>Assigned to: {primaryAction.technician.name}</span>
                )}
              </div>
            )}

            {/* Multiple Actions Indicator */}
            {actions.length > 1 && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  +{actions.length - 1} more action
                  {actions.length - 1 !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
