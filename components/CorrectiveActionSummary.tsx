'use client';

import { useState, useEffect } from 'react';
import {
  correctiveActionService,
  type CorrectiveActionWithDetails,
} from '@/lib/corrective-actions';

interface CorrectiveActionSummaryProps {
  inspectionId: string;
  onViewActions?: () => void;
}

export default function CorrectiveActionSummary({
  inspectionId,
  onViewActions,
}: CorrectiveActionSummaryProps) {
  const [actions, setActions] = useState<CorrectiveActionWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadActions();
  }, [inspectionId]);

  const loadActions = async () => {
    setLoading(true);
    try {
      const openActions = await correctiveActionService.getOpenActions();
      const inspectionActions = openActions.filter(
        (action) => action.inspection_id === inspectionId
      );
      setActions(inspectionActions);
    } catch (error) {
      console.error('Failed to load corrective actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityCounts = () => {
    return {
      immediate: actions.filter((a) => a.severity_level === 'immediate').length,
      '24hr': actions.filter((a) => a.severity_level === '24hr').length,
      '7day': actions.filter((a) => a.severity_level === '7day').length,
      overdue: actions.filter((a) => a.status === 'overdue').length,
    };
  };

  const counts = getSeverityCounts();
  const totalActions = actions.length;

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
          <span className="text-sm text-yellow-800">
            Loading corrective actions...
          </span>
        </div>
      </div>
    );
  }

  if (totalActions === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-red-800">
              {totalActions} Open Corrective Action
              {totalActions !== 1 ? 's' : ''}
            </h3>
            <div className="flex items-center space-x-4 text-xs text-red-700 mt-1">
              {counts.immediate > 0 && (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                  {counts.immediate} Immediate
                </span>
              )}
              {counts['24hr'] > 0 && (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                  {counts['24hr']} 24hr
                </span>
              )}
              {counts['7day'] > 0 && (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  {counts['7day']} 7day
                </span>
              )}
              {counts.overdue > 0 && (
                <span className="flex items-center font-semibold">
                  <span className="w-2 h-2 bg-red-600 rounded-full mr-1"></span>
                  {counts.overdue} Overdue
                </span>
              )}
            </div>
          </div>
        </div>
        {onViewActions && (
          <button
            onClick={onViewActions}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            View All
          </button>
        )}
      </div>
    </div>
  );
}
