'use client';

import { useState, useEffect } from 'react';
import {
  type CorrectiveActionWithDetails,
  getOpenActions,
} from '@/lib/corrective-actions-client';

interface CorrectiveActionIndicatorProps {
  inspectionId: string;
  itemId: string;
  itemName: string;
  hasFailure: boolean;
  onActionCreated?: (actionId: string) => void;
}

export default function CorrectiveActionIndicator({
  inspectionId,
  itemId,
  itemName,
  hasFailure,
  onActionCreated,
}: CorrectiveActionIndicatorProps) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'open':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
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

  if (!hasFailure) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Failure Warning */}
      <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-lg">
        <svg
          className="w-4 h-4 text-red-500 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-medium text-red-800">
          {itemName} - Failed
        </span>
      </div>

      {/* Corrective Actions */}
      {loading ? (
        <div className="text-sm text-gray-500">
          Loading corrective actions...
        </div>
      ) : actions.length > 0 ? (
        <div className="space-y-2">
          {actions.map((action) => (
            <div
              key={action.id}
              className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm">
                      {getSeverityIcon(action.severity_level)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(action.status)}`}
                    >
                      {action.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      Due: {new Date(action.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">
                    {action.description}
                  </p>
                  <p className="text-xs text-gray-600">
                    Action: {action.required_action}
                  </p>
                  {action.assigned_to && (
                    <p className="text-xs text-gray-500">
                      Assigned to:{' '}
                      {action.technician?.name || action.assigned_to}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    // Navigate to corrective actions page
                    window.location.href = '/corrective-actions';
                  }}
                  className="ml-2 text-xs text-primary hover:text-primary-dark underline"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          No corrective actions found for this item.
        </div>
      )}
    </div>
  );
}
