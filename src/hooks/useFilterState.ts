import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Custom hook to manage filter state with URL query parameters
 * Enables sharing filtered views and persisting filters across page refreshes
 *
 * Features:
 * - Syncs filter state with URL query parameters (type, date range, search; queue status uses dashboard tabs)
 * - Persists filter selections across page refreshes
 * - Enables sharing filtered views via URL
 *
 * Requirements: 12.1
 */

export interface FilterState {
  requestType: string;
  dateRange: string;
  searchQuery: string;
}

const DEFAULT_FILTERS: FilterState = {
  requestType: 'all',
  dateRange: 'all',
  searchQuery: '',
};

export const useFilterState = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL query parameters
  const getFiltersFromURL = useCallback((): FilterState => {
    return {
      requestType: searchParams.get('type') || DEFAULT_FILTERS.requestType,
      dateRange: searchParams.get('dateRange') || DEFAULT_FILTERS.dateRange,
      searchQuery: searchParams.get('search') || DEFAULT_FILTERS.searchQuery,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<FilterState>(getFiltersFromURL);

  // Update URL when filters change
  const updateFilters = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);

      // Build new search params
      const params = new URLSearchParams();

      if (newFilters.requestType !== DEFAULT_FILTERS.requestType) {
        params.set('type', newFilters.requestType);
      }

      if (newFilters.dateRange !== DEFAULT_FILTERS.dateRange) {
        params.set('dateRange', newFilters.dateRange);
      }

      if (newFilters.searchQuery !== DEFAULT_FILTERS.searchQuery) {
        params.set('search', newFilters.searchQuery);
      }

      // Update URL without triggering navigation
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  // Sync filters with URL on mount and when URL changes
  useEffect(() => {
    const urlFilters = getFiltersFromURL();
    setFilters(urlFilters);
  }, [getFiltersFromURL]);

  return {
    filters,
    updateFilters,
  };
};
