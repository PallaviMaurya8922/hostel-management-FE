import React from 'react';
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { buildQueuePageList } from '../utils/queuePagination';

export type QueuePaginationAccent = 'emerald' | 'cyan';

const ACTIVE_RING: Record<QueuePaginationAccent, string> = {
  emerald:
    'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-900/40 dark:text-emerald-100 dark:ring-emerald-700/50',
  cyan: 'bg-cyan-100 text-cyan-900 ring-1 ring-cyan-200/80 dark:bg-cyan-900/40 dark:text-cyan-100 dark:ring-cyan-700/50',
};

export interface QueuePaginationBarProps {
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** For `htmlFor` / `id` on the per-page select */
  idPrefix: string;
  accent?: QueuePaginationAccent;
}

const DEFAULT_PAGE_SIZES = [5, 10, 20];

const QueuePaginationBar: React.FC<QueuePaginationBarProps> = ({
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  idPrefix,
  accent = 'emerald',
}) => {
  if (totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const offset = (clampedPage - 1) * pageSize;
  const from = offset + 1;
  const to = offset + Math.min(pageSize, Math.max(0, totalItems - offset));
  const pageList = buildQueuePageList(clampedPage, totalPages);
  const activeClass = ACTIVE_RING[accent];

  const iconBtn =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-35 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-100';

  return (
    <div className="border-t border-surface-200 bg-slate-50/90 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="shrink-0 text-[11px] leading-snug text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            Showing {from}–{to}
          </span>
          <span className="text-slate-500"> of {totalItems}</span>
          <span className="text-slate-400"> · Page {clampedPage}/{totalPages}</span>
        </p>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1 sm:justify-end sm:gap-1.5">
          <button
            type="button"
            className={iconBtn}
            disabled={clampedPage <= 1}
            aria-label="First page"
            onClick={() => onPageChange(1)}
          >
            <ChevronDoubleLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={iconBtn}
            disabled={clampedPage <= 1}
            aria-label="Previous page"
            onClick={() => onPageChange(Math.max(1, clampedPage - 1))}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          <div className="mx-0.5 flex min-w-0 flex-wrap items-center justify-center gap-0.5 sm:mx-1">
            {pageList.map((entry, idx) =>
              entry === null ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-[11px] font-medium text-slate-400 dark:text-slate-500"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <button
                  key={`page-${entry}`}
                  type="button"
                  onClick={() => onPageChange(entry)}
                  className={`min-w-[2rem] rounded-full px-2 py-1 text-center text-xs font-semibold transition-colors ${
                    entry === clampedPage
                      ? activeClass
                      : 'text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100'
                  }`}
                >
                  {entry}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            className={iconBtn}
            disabled={clampedPage >= totalPages}
            aria-label="Next page"
            onClick={() => onPageChange(Math.min(totalPages, clampedPage + 1))}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={iconBtn}
            disabled={clampedPage >= totalPages}
            aria-label="Last page"
            onClick={() => onPageChange(totalPages)}
          >
            <ChevronDoubleRightIcon className="h-4 w-4" />
          </button>

          {onPageSizeChange ? (
            <div className="ml-0 flex shrink-0 items-center gap-1.5 border-slate-200 pl-0 pt-2 sm:ml-2 sm:border-l sm:pl-3 sm:pt-0 dark:border-slate-600">
              <label htmlFor={`${idPrefix}-page-size`} className="sr-only">
                Rows per page
              </label>
              <span className="hidden text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:inline dark:text-slate-500">
                Per page
              </span>
              <select
                id={`${idPrefix}-page-size`}
                value={String(pageSize)}
                onChange={e => onPageSizeChange(Number(e.target.value))}
                className="max-w-[5.5rem] cursor-pointer rounded-lg border border-slate-200 bg-white py-1 pl-2 pr-7 text-xs font-medium text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-brand-500 dark:focus:ring-brand-900/40"
              >
                {pageSizeOptions.map(n => (
                  <option key={n} value={String(n)}>
                    {n} rows
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default QueuePaginationBar;
