import React from 'react';

interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  loading?: boolean;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  children,
  className = '',
  onClick,
  loading = false,
}) => {
  const baseClasses = `
    bg-white rounded-lg shadow-sm border border-gray-200
    p-4 md:p-6
    transition-all duration-200 ease-in-out
    ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''}
    ${loading ? 'animate-pulse' : ''}
    ${className}
  `.trim();

  if (loading) {
    return (
      <div className={baseClasses}>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (onClick) {
    return (
      <div className={baseClasses} onClick={onClick}>
        {children}
      </div>
    );
  }

  return <div className={baseClasses}>{children}</div>;
};

export default BaseCard;
