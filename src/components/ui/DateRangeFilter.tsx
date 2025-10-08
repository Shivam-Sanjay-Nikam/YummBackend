import React from 'react';
import { Calendar, X } from 'lucide-react';

interface DateRangeFilterProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onClear?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClear,
  className = '',
  size = 'md',
  isLoading = false
}) => {
  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-4 text-base'
  };

  const handleClear = () => {
    onFromDateChange('');
    onToDateChange('');
    onClear?.();
  };

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">Start Date</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              ) : (
                <Calendar className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              disabled={isLoading}
              className={`block w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                isLoading 
                  ? 'border-blue-300 bg-blue-50 text-gray-600' 
                  : 'border-gray-300 hover:border-gray-400 bg-white'
              } transition-all duration-200`}
              placeholder="Select start date"
            />
          </div>
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">End Date</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              ) : (
                <Calendar className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              disabled={isLoading}
              className={`block w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                isLoading 
                  ? 'border-blue-300 bg-blue-50 text-gray-600' 
                  : 'border-gray-300 hover:border-gray-400 bg-white'
              } transition-all duration-200`}
              placeholder="Select end date"
            />
          </div>
        </div>
      </div>
      {(fromDate || toDate) && onClear && !isLoading && (
        <div className="flex justify-center">
          <button
            onClick={handleClear}
            className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-300 hover:border-gray-400"
          >
            <X className="h-4 w-4 mr-2" />
            Clear dates
          </button>
        </div>
      )}
    </div>
  );
};
