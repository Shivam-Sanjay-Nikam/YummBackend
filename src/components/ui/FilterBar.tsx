import React from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from './Button';

interface FilterBarProps {
  children: React.ReactNode;
  onClear?: () => void;
  showClearButton?: boolean;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  onClear,
  showClearButton = true,
  className = ''
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          {showClearButton && onClear && (
            <button
              onClick={onClear}
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-300 hover:border-gray-400"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </button>
          )}
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};
