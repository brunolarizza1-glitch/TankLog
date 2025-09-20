import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'gray';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  className = '',
}) => {
  const variantClasses = `badge-${variant}`;

  return (
    <span className={`badge ${variantClasses} ${className}`}>{children}</span>
  );
};

export default Badge;
