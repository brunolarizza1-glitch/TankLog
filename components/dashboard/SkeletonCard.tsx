import React from 'react';
import BaseCard from './BaseCard';

interface SkeletonCardProps {
  variant?: 'default' | 'compliance' | 'actions' | 'alerts';
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ variant = 'default' }) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'compliance':
        return (
          <div className="text-center space-y-4">
            {/* Circular progress skeleton */}
            <div className="w-32 h-32 mx-auto bg-gray-200 rounded-full animate-pulse"></div>
            {/* Percentage skeleton */}
            <div className="h-8 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
            {/* Status text skeleton */}
            <div className="h-4 bg-gray-200 rounded w-24 mx-auto animate-pulse"></div>
            {/* Trend skeleton */}
            <div className="h-3 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
          </div>
        );
      
      case 'actions':
        return (
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
            {/* Button skeleton */}
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            {/* Activity list skeleton */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'alerts':
        return (
          <div className="space-y-4">
            {/* Header skeleton */}
            <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
            {/* Alert items skeleton */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
          </div>
        );
    }
  };

  return <BaseCard loading={true}>{renderSkeleton()}</BaseCard>;
};

export default SkeletonCard;
