import React from 'react';
import BaseCard from './BaseCard';

interface AlertSummaryCardProps {
  overdueCount: number;
  dueSoonCount: number;
  completedToday: number;
  loading?: boolean;
}

export const AlertSummaryCard: React.FC<AlertSummaryCardProps> = ({
  overdueCount,
  dueSoonCount,
  completedToday,
  loading = false,
}) => {
  const alertItems = [
    {
      id: 'overdue',
      label: 'Overdue',
      count: overdueCount,
      color: 'danger',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
    },
    {
      id: 'due-soon',
      label: 'Due Soon',
      count: dueSoonCount,
      color: 'warning',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'completed',
      label: 'Completed Today',
      count: completedToday,
      color: 'success',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'danger':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-500',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          badge: 'bg-yellow-500',
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          badge: 'bg-green-500',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          badge: 'bg-gray-500',
        };
    }
  };

  return (
    <BaseCard loading={loading}>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Alert Summary</h3>
        </div>

        {/* Alert Items */}
        <div className="space-y-3">
          {alertItems.map((item) => {
            const colors = getColorClasses(item.color);
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${colors.bg} ${colors.border}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${colors.bg} ${colors.border} border`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${colors.text}`}>
                      {item.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${colors.badge}`}
                  >
                    {item.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Message */}
        {overdueCount === 0 && dueSoonCount === 0 && (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">All caught up! Great work.</p>
          </div>
        )}

        {overdueCount > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-red-700 font-medium">
                {overdueCount} item{overdueCount !== 1 ? 's' : ''} require{overdueCount === 1 ? 's' : ''} immediate attention
              </p>
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
};

export default AlertSummaryCard;
