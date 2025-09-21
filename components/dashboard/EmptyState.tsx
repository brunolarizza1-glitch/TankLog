import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
}) => {
  const defaultIcon = (
    <svg
      className="w-12 h-12 text-gray-300"
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
  );

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon || defaultIcon}
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-primary btn-md">
          {actionLabel}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
