import { useState, useMemo } from 'react';

export interface SearchAndFilterState {
  searchTerm: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  dateFrom: string;
  dateTo: string;
  statusFilter: string;
  [key: string]: any; // Allow additional custom filters
}

export interface UseSearchAndFilterOptions {
  initialSearchTerm?: string;
  initialSortBy?: string;
  initialSortDirection?: 'asc' | 'desc';
  initialDateFrom?: string;
  initialDateTo?: string;
  initialStatusFilter?: string;
  customFilters?: Record<string, any>;
}

export const useSearchAndFilter = (options: UseSearchAndFilterOptions = {}) => {
  const {
    initialSearchTerm = '',
    initialSortBy = '',
    initialSortDirection = 'asc',
    initialDateFrom = '',
    initialDateTo = '',
    initialStatusFilter = '',
    customFilters = {}
  } = options;

  const [state, setState] = useState<SearchAndFilterState>({
    searchTerm: initialSearchTerm,
    sortBy: initialSortBy,
    sortDirection: initialSortDirection,
    dateFrom: initialDateFrom,
    dateTo: initialDateTo,
    statusFilter: initialStatusFilter,
    ...customFilters
  });

  const updateFilter = (key: string, value: any) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setState({
      searchTerm: '',
      sortBy: '',
      sortDirection: 'asc',
      dateFrom: '',
      dateTo: '',
      statusFilter: '',
      ...Object.keys(customFilters).reduce((acc, key) => ({ ...acc, [key]: '' }), {})
    });
  };

  const hasActiveFilters = useMemo(() => {
    return Object.values(state).some(value => 
      value !== '' && value !== null && value !== undefined
    );
  }, [state]);

  return {
    state,
    updateFilter,
    clearAllFilters,
    hasActiveFilters
  };
};
