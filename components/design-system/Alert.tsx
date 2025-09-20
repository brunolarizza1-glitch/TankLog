import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  type?: 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  type = 'info',
  className = '',
  onClose
}) => {
  const typeClasses = `alert-${type}`;
  
  return (
    <div className={`alert ${typeClasses} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {children}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-current opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Close alert"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
