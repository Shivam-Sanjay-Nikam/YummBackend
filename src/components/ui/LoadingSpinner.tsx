import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <Loader2 className={`animate-spin text-blue-500 ${sizeClasses[size]}`} />
      {message && (
        <p className={`text-gray-600 font-medium ${textSizeClasses[size]}`}>
          {message}
        </p>
      )}
    </div>
  );
};

// Full page loading component
export const PageLoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-64">
    <LoadingSpinner size="lg" message={message} />
  </div>
);

// Inline loading component
export const InlineLoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner size="md" message={message} />
  </div>
);
