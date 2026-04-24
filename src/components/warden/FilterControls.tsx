import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { debounce } from '../../utils/debounce';
import type { FilterState } from '../../hooks/useFilterState';

export type { FilterState };

export interface FilterControlsProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  /** Renders left of the request-type pills (e.g. section title), matching student Request History layout */
  lead?: React.ReactNode;
}

const REQUEST_TYPE_PILLS = [
  { value: 'all' as const, label: 'All types' },
  { value: 'leave' as const, label: 'Leave' },
  { value: 'guest' as const, label: 'Guest' },
  { value: 'maintenance' as const, label: 'Maintenance' },
];

const DATE_RANGE_PILLS = [
  { value: 'all' as const, label: 'All time' },
  { value: 'today' as const, label: 'Today' },
  { value: 'week' as const, label: 'This week' },
  { value: 'month' as const, label: 'This month' },
];

const pillClass = (selected: boolean) =>
  `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
    selected
      ? 'bg-[#0f1729] text-white shadow-sm'
      : 'bg-white text-slate-600 border border-surface-200 hover:bg-surface-100'
  }`;

const FilterControls: React.FC<FilterControlsProps> = ({ filters, onFiltersChange, lead }) => {
  const [searchInput, setSearchInput] = useState(filters.searchQuery);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onFiltersChange({ ...filters, searchQuery: query });
    }, 300),
    [filters, onFiltersChange]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    onFiltersChange({ requestType: 'all', dateRange: 'all', searchQuery: '' });
  };

  const hasActiveFilters =
    filters.requestType !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.searchQuery !== '';

  useEffect(() => {
    setSearchInput(filters.searchQuery);
  }, [filters.searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {lead ? <div className="min-w-0">{lead}</div> : null}
        <div className="flex flex-wrap gap-2 shrink-0" role="group" aria-label="Filter by request type">
          {REQUEST_TYPE_PILLS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onFiltersChange({ ...filters, requestType: value })}
              className={pillClass(filters.requestType === value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
          {DATE_RANGE_PILLS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onFiltersChange({ ...filters, dateRange: value })}
              className={pillClass(filters.dateRange === value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-2">
          <div className="relative w-full min-w-0 sm:max-w-xs">
            <label htmlFor="warden-filter-search" className="sr-only">
              Search by student or room
            </label>
            <input
              id="warden-filter-search"
              type="search"
              placeholder="Student name or room…"
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-surface-200 bg-white py-2 pl-3 pr-10 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200/60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-900/40"
            />
            <MagnifyingGlassIcon
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-full border border-surface-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-surface-50 hover:text-slate-900 sm:self-center"
            >
              <XMarkIcon className="h-4 w-4" aria-hidden />
              Clear filters
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
