import React from 'react';
import BaseCard from './BaseCard';

interface ComplianceOverviewCardProps {
  compliancePercentage: number;
  status: 'compliant' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  trendValue?: number;
  loading?: boolean;
}

export const ComplianceOverviewCard: React.FC<ComplianceOverviewCardProps> = ({
  compliancePercentage,
  status,
  trend,
  trendValue,
  loading = false,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'compliant':
        return 'text-success-green';
      case 'warning':
        return 'text-warning-amber';
      case 'critical':
        return 'text-danger-red';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'compliant':
        return 'Fully Compliant';
      case 'warning':
        return 'Needs Attention';
      case 'critical':
        return 'Critical Issues';
      default:
        return 'Unknown Status';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return (
          <svg
            className="w-4 h-4 text-success-green"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'down':
        return (
          <svg
            className="w-4 h-4 text-danger-red"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'stable':
        return (
          <svg
            className="w-4 h-4 text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'compliant':
        return '#059669'; // success-green
      case 'warning':
        return '#d97706'; // warning-amber
      case 'critical':
        return '#dc2626'; // danger-red
      default:
        return '#64748b'; // gray-500
    }
  };

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (compliancePercentage / 100) * circumference;

  return (
    <BaseCard loading={loading} className="text-center">
      <div className="relative inline-flex items-center justify-center w-32 h-32 mx-auto mb-4">
        {/* Background circle */}
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#e2e8f0"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={getProgressColor()}
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>

        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary-blue">
              {compliancePercentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Status text */}
      <div className={`text-lg font-semibold mb-2 ${getStatusColor()}`}>
        {getStatusText()}
      </div>

      {/* Trend indicator */}
      {trendValue !== undefined && (
        <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
          {getTrendIcon()}
          <span>
            {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
            {trendValue}% from last month
          </span>
        </div>
      )}
    </BaseCard>
  );
};

export default ComplianceOverviewCard;
