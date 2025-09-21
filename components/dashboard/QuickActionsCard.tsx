import React from 'react';
import Link from 'next/link';
import BaseCard from './BaseCard';

interface ActivityItem {
  id: string;
  action: string;
  timestamp: string;
  type: 'inspection' | 'action' | 'completion';
}

interface QuickActionsCardProps {
  overdueCount?: number;
  recentActivity?: ActivityItem[];
  loading?: boolean;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  overdueCount = 0,
  recentActivity = [],
  loading = false,
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'inspection':
        return (
          <svg
            className="w-4 h-4 text-primary-blue"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-1 7l2 2 4-4"
            />
          </svg>
        );
      case 'action':
        return (
          <svg
            className="w-4 h-4 text-warning-amber"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case 'completion':
        return (
          <svg
            className="w-4 h-4 text-success-green"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <BaseCard loading={loading}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Quick Actions
          </h3>
        </div>

        {/* New Log Button */}
        <Link
          href="/logs/new"
          className="btn btn-primary btn-lg w-full text-center block"
        >
          New Log
        </Link>

        {/* Overdue Items Link */}
        {overdueCount > 0 && (
          <Link
            href="/corrective-actions?filter=overdue"
            className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 hover:bg-red-100 transition-colors duration-200"
          >
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="font-medium">View Overdue Items</span>
            </div>
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {overdueCount}
            </span>
          </Link>
        )}

        {/* Recent Activity */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">
            Recent Activity
          </h4>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">
                      {item.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(item.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <svg
                className="w-8 h-8 text-gray-300 mx-auto mb-2"
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
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </BaseCard>
  );
};

export default QuickActionsCard;
