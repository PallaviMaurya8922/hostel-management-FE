import React, { useState, useMemo, useEffect, useCallback, Fragment } from 'react';
import AppShell from '../components/AppShell';
import { useLeaveRequests, useMaintenanceRequests, useGuestRequests } from '../hooks';
import { toLocalDateInputKey } from '../utils/dateUtils';
import {
  combinedQueueStatusFilterOptions,
  leaveGuestBackendStatusFilterOptions,
  maintenanceStatusFilterOptions,
} from '../utils/requestStatusFilterOptions';
import type { GuestRequest, LeaveRequest, MaintenanceRequest } from '../types';
import Skeleton from '../components/Skeleton';
import RequestHistorySidePanel, {
  type HistoryRow,
} from '../components/dashboard/RequestHistorySidePanel';
import QueuePaginationBar from '../components/QueuePaginationBar';
import {
  getStudentHistoryColumns,
  type StudentHistoryHeaderProps,
  type StudentHistoryTypeFilter,
  type SubmittedDateSortMode,
} from '../config/requestQueueTableColumns';

type HistoryTypeFilter = StudentHistoryTypeFilter;

const StudentRequestHistoryPage: React.FC = () => {
  const [historyTypeFilter, setHistoryTypeFilter] = useState<HistoryTypeFilter>('all');
  const [historySubmittedDateSort, setHistorySubmittedDateSort] =
    useState<SubmittedDateSortMode>('none');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(20);
  const [selectedHistoryRow, setSelectedHistoryRow] = useState<HistoryRow | null>(null);
  const [historyAllType, setHistoryAllType] = useState('');
  const [historyAllSummary, setHistoryAllSummary] = useState('');
  const [historyAllSubmitted, setHistoryAllSubmitted] = useState('');
  const [historyAllStatus, setHistoryAllStatus] = useState('');
  const [historyLeaveReason, setHistoryLeaveReason] = useState('');
  const [historyLeaveSubmitted, setHistoryLeaveSubmitted] = useState('');
  const [historyLeaveStatus, setHistoryLeaveStatus] = useState('');
  const [historyGuestSearch, setHistoryGuestSearch] = useState('');
  const [historyGuestSubmitted, setHistoryGuestSubmitted] = useState('');
  const [historyGuestStatus, setHistoryGuestStatus] = useState('');
  const [historyMaintIssue, setHistoryMaintIssue] = useState('');
  const [historyMaintRoom, setHistoryMaintRoom] = useState('');
  const [historyMaintSubmitted, setHistoryMaintSubmitted] = useState('');
  const [historyMaintStatus, setHistoryMaintStatus] = useState('');

  const { data: leaves, isLoading: leavesLoading } = useLeaveRequests();
  const { data: guests, isLoading: guestsLoading } = useGuestRequests();
  const { data: maintenance, isLoading: maintenanceLoading } = useMaintenanceRequests();

  const historyRows = useMemo((): HistoryRow[] => {
    const arr: HistoryRow[] = [];
    if (leaves) {
      leaves.forEach(l => {
        arr.push({
          kind: 'leave',
          id: l.absence_id,
          typeLabel: 'Leave',
          title: (l.reason.split('\n')[0] || '').trim() || '(No description)',
          date: l.created_at,
          status: l.status,
          raw: l,
        });
      });
    }
    if (guests) {
      guests.forEach(g => {
        arr.push({
          kind: 'guest',
          id: g.request_id,
          typeLabel: 'Guest',
          title: `Guest: ${g.guest_name}`,
          date: g.created_at,
          status: g.status,
          raw: g,
        });
      });
    }
    if (maintenance) {
      maintenance.forEach(m => {
        arr.push({
          kind: 'maintenance',
          id: m.request_id,
          typeLabel: 'Maintenance',
          title: m.issue_type,
          date: m.created_at,
          status: m.status,
          raw: m,
        });
      });
    }
    return arr;
  }, [leaves, guests, maintenance]);

  const historyTabRows = useMemo(() => {
    if (historyTypeFilter === 'all') return historyRows;
    return historyRows.filter(r => r.typeLabel === historyTypeFilter);
  }, [historyRows, historyTypeFilter]);

  const historyAllTypeOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of historyRows) s.add(r.typeLabel);
    return Array.from(s).sort();
  }, [historyRows]);

  const historyRowsAfterNonStatusFilters = useMemo(() => {
    return historyTabRows.filter(r => {
      if (historyTypeFilter === 'all') {
        if (historyAllType && r.typeLabel !== historyAllType) return false;
        const q = historyAllSummary.trim().toLowerCase();
        if (q && !r.title.toLowerCase().includes(q)) return false;
        if (historyAllSubmitted && toLocalDateInputKey(r.date) !== historyAllSubmitted) return false;
        return true;
      }
      if (historyTypeFilter === 'Leave') {
        const q = historyLeaveReason.trim().toLowerCase();
        if (q && !((r.raw as LeaveRequest).reason || '').toLowerCase().includes(q)) return false;
        if (historyLeaveSubmitted && toLocalDateInputKey(r.date) !== historyLeaveSubmitted) return false;
        return true;
      }
      if (historyTypeFilter === 'Guest') {
        const q = historyGuestSearch.trim().toLowerCase();
        if (q) {
          const g = r.raw as GuestRequest;
          const blob = `${g.guest_name} ${g.purpose}`.toLowerCase();
          if (!blob.includes(q)) return false;
        }
        if (historyGuestSubmitted && toLocalDateInputKey(r.date) !== historyGuestSubmitted) return false;
        return true;
      }
      const qIssue = historyMaintIssue.trim().toLowerCase();
      if (qIssue) {
        const m = r.raw as MaintenanceRequest;
        if (!`${m.issue_type} ${m.description}`.toLowerCase().includes(qIssue)) return false;
      }
      const qRoom = historyMaintRoom.trim().toLowerCase();
      if (qRoom && !(r.raw as MaintenanceRequest).room_number.toLowerCase().includes(qRoom)) return false;
      if (historyMaintSubmitted && toLocalDateInputKey(r.date) !== historyMaintSubmitted) return false;
      return true;
    });
  }, [
    historyTabRows,
    historyTypeFilter,
    historyAllType,
    historyAllSummary,
    historyAllSubmitted,
    historyLeaveReason,
    historyLeaveSubmitted,
    historyGuestSearch,
    historyGuestSubmitted,
    historyMaintIssue,
    historyMaintRoom,
    historyMaintSubmitted,
  ]);

  const historyStatusDropdownOptions = useMemo(() => {
    if (historyTypeFilter === 'Leave' || historyTypeFilter === 'Guest') {
      return leaveGuestBackendStatusFilterOptions();
    }
    if (historyTypeFilter === 'Maintenance') {
      return maintenanceStatusFilterOptions();
    }
    return combinedQueueStatusFilterOptions();
  }, [historyTypeFilter]);

  const historyRowsAfterHeaderFilters = useMemo(() => {
    if (historyTypeFilter === 'all') {
      if (!historyAllStatus) return historyRowsAfterNonStatusFilters;
      return historyRowsAfterNonStatusFilters.filter(r => r.status === historyAllStatus);
    }
    if (historyTypeFilter === 'Leave') {
      if (!historyLeaveStatus) return historyRowsAfterNonStatusFilters;
      return historyRowsAfterNonStatusFilters.filter(r => r.status === historyLeaveStatus);
    }
    if (historyTypeFilter === 'Guest') {
      if (!historyGuestStatus) return historyRowsAfterNonStatusFilters;
      return historyRowsAfterNonStatusFilters.filter(r => r.status === historyGuestStatus);
    }
    if (!historyMaintStatus) return historyRowsAfterNonStatusFilters;
    return historyRowsAfterNonStatusFilters.filter(r => r.status === historyMaintStatus);
  }, [
    historyRowsAfterNonStatusFilters,
    historyTypeFilter,
    historyAllStatus,
    historyLeaveStatus,
    historyGuestStatus,
    historyMaintStatus,
  ]);

  const cycleHistorySubmittedDateSort = useCallback(() => {
    setHistorySubmittedDateSort(prev => (prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none'));
  }, []);

  const historyHeaderProps = useMemo((): StudentHistoryHeaderProps => {
    const base = {
      submittedDateSort: historySubmittedDateSort,
      onCycleSubmittedDateSort: cycleHistorySubmittedDateSort,
      tabFilter: historyTypeFilter,
    };
    if (historyTypeFilter === 'all') {
      return {
        ...base,
        all: {
          typeValue: historyAllType,
          onTypeChange: setHistoryAllType,
          typeOptions: historyAllTypeOptions,
          summaryValue: historyAllSummary,
          onSummaryChange: setHistoryAllSummary,
          submittedDateValue: historyAllSubmitted,
          onSubmittedDateChange: setHistoryAllSubmitted,
          statusValue: historyAllStatus,
          onStatusChange: setHistoryAllStatus,
          statusOptions: historyStatusDropdownOptions,
        },
      };
    }
    if (historyTypeFilter === 'Leave') {
      return {
        ...base,
        leave: {
          reasonValue: historyLeaveReason,
          onReasonChange: setHistoryLeaveReason,
          submittedDateValue: historyLeaveSubmitted,
          onSubmittedDateChange: setHistoryLeaveSubmitted,
          statusValue: historyLeaveStatus,
          onStatusChange: setHistoryLeaveStatus,
          statusOptions: historyStatusDropdownOptions,
        },
      };
    }
    if (historyTypeFilter === 'Guest') {
      return {
        ...base,
        guest: {
          searchValue: historyGuestSearch,
          onSearchChange: setHistoryGuestSearch,
          submittedDateValue: historyGuestSubmitted,
          onSubmittedDateChange: setHistoryGuestSubmitted,
          statusValue: historyGuestStatus,
          onStatusChange: setHistoryGuestStatus,
          statusOptions: historyStatusDropdownOptions,
        },
      };
    }
    return {
      ...base,
      maintenance: {
        issueValue: historyMaintIssue,
        onIssueChange: setHistoryMaintIssue,
        roomValue: historyMaintRoom,
        onRoomChange: setHistoryMaintRoom,
        submittedDateValue: historyMaintSubmitted,
        onSubmittedDateChange: setHistoryMaintSubmitted,
        statusValue: historyMaintStatus,
        onStatusChange: setHistoryMaintStatus,
        statusOptions: historyStatusDropdownOptions,
      },
    };
  }, [
    historySubmittedDateSort,
    cycleHistorySubmittedDateSort,
    historyTypeFilter,
    historyAllType,
    historyAllTypeOptions,
    historyAllSummary,
    historyAllSubmitted,
    historyAllStatus,
    historyLeaveReason,
    historyLeaveSubmitted,
    historyLeaveStatus,
    historyGuestSearch,
    historyGuestSubmitted,
    historyGuestStatus,
    historyMaintIssue,
    historyMaintRoom,
    historyMaintSubmitted,
    historyMaintStatus,
    historyStatusDropdownOptions,
  ]);

  const historyColumns = useMemo(() => getStudentHistoryColumns(historyHeaderProps), [historyHeaderProps]);

  useEffect(() => {
    setHistorySubmittedDateSort('none');
    setHistoryAllType('');
    setHistoryAllSummary('');
    setHistoryAllSubmitted('');
    setHistoryAllStatus('');
    setHistoryLeaveReason('');
    setHistoryLeaveSubmitted('');
    setHistoryLeaveStatus('');
    setHistoryGuestSearch('');
    setHistoryGuestSubmitted('');
    setHistoryGuestStatus('');
    setHistoryMaintIssue('');
    setHistoryMaintRoom('');
    setHistoryMaintSubmitted('');
    setHistoryMaintStatus('');
  }, [historyTypeFilter]);

  useEffect(() => {
    const valid = new Set(historyStatusDropdownOptions.map(o => o.value));
    if (historyTypeFilter === 'all' && historyAllStatus && !valid.has(historyAllStatus)) {
      setHistoryAllStatus('');
    }
    if (historyTypeFilter === 'Leave' && historyLeaveStatus && !valid.has(historyLeaveStatus)) {
      setHistoryLeaveStatus('');
    }
    if (historyTypeFilter === 'Guest' && historyGuestStatus && !valid.has(historyGuestStatus)) {
      setHistoryGuestStatus('');
    }
    if (historyTypeFilter === 'Maintenance' && historyMaintStatus && !valid.has(historyMaintStatus)) {
      setHistoryMaintStatus('');
    }
  }, [
    historyStatusDropdownOptions,
    historyTypeFilter,
    historyAllStatus,
    historyLeaveStatus,
    historyGuestStatus,
    historyMaintStatus,
  ]);

  const sortedHistoryRows = useMemo(() => {
    const copy = [...historyRowsAfterHeaderFilters];
    if (historySubmittedDateSort === 'none') {
      return copy;
    }
    const mult = historySubmittedDateSort === 'asc' ? 1 : -1;
    copy.sort((a, b) => (new Date(a.date).getTime() - new Date(b.date).getTime()) * mult);
    return copy;
  }, [historyRowsAfterHeaderFilters, historySubmittedDateSort]);

  const historyTotalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedHistoryRows.length / historyPageSize)),
    [sortedHistoryRows.length, historyPageSize]
  );

  const clampedHistoryPage = Math.min(Math.max(1, historyPage), historyTotalPages);
  const historyOffset = (clampedHistoryPage - 1) * historyPageSize;

  const visibleHistoryRows = useMemo(() => {
    return sortedHistoryRows.slice(historyOffset, historyOffset + historyPageSize);
  }, [sortedHistoryRows, historyOffset, historyPageSize]);

  useEffect(() => {
    setHistoryPage(1);
  }, [
    historyTypeFilter,
    historySubmittedDateSort,
    historyPageSize,
    historyAllType,
    historyAllSummary,
    historyAllSubmitted,
    historyAllStatus,
    historyLeaveReason,
    historyLeaveSubmitted,
    historyLeaveStatus,
    historyGuestSearch,
    historyGuestSubmitted,
    historyGuestStatus,
    historyMaintIssue,
    historyMaintRoom,
    historyMaintSubmitted,
    historyMaintStatus,
  ]);

  useEffect(() => {
    setHistoryPage(p => Math.min(p, historyTotalPages));
  }, [historyTotalPages]);

  useEffect(() => {
    if (!selectedHistoryRow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedHistoryRow(null);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedHistoryRow]);

  const isLoading = leavesLoading || guestsLoading || maintenanceLoading;

  if (isLoading) {
    return (
      <AppShell showSearch>
        <div className="mx-auto flex h-[calc(100dvh-5.5rem)] min-h-[280px] w-full max-w-screen-xl flex-col px-3 py-2 sm:px-5 lg:px-6">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-surface-200/90 bg-white shadow-md ring-1 ring-slate-900/[0.04] dark:border-slate-700 dark:bg-slate-900/50 dark:ring-white/[0.06]">
            <Skeleton height="48px" className="rounded-none border-b border-surface-200" />
            <div className="min-h-0 flex-1 p-4">
              <Skeleton height="100%" className="min-h-[200px]" />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showSearch>
      <div className="mx-auto flex h-[calc(100dvh-5.5rem)] min-h-[320px] w-full max-w-screen-xl flex-col px-3 py-2 sm:px-5 lg:px-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-surface-200/90 bg-white shadow-md ring-1 ring-slate-900/[0.04] dark:border-slate-700 dark:bg-slate-900/50 dark:ring-white/[0.06]">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-surface-200/90 bg-gradient-to-r from-slate-50/95 to-white px-4 py-2 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/80">
            <h1 className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">
              All requests
            </h1>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by request type">
              {(
                [
                  { key: 'all' as const, label: 'All types' },
                  { key: 'Leave' as const, label: 'Leave' },
                  { key: 'Guest' as const, label: 'Guest' },
                  { key: 'Maintenance' as const, label: 'Maintenance' },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHistoryTypeFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    historyTypeFilter === key
                      ? 'bg-[#0f1729] text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-white text-slate-600 border border-surface-200 hover:bg-surface-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto bg-white dark:bg-slate-900/30">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-surface-200 bg-slate-50/95 text-slate-500 backdrop-blur-sm dark:border-slate-600 dark:bg-slate-900/95 dark:text-slate-400">
                <tr>
                  {historyColumns.map(col => (
                    <Fragment key={col.id}>{col.renderHeader(historyHeaderProps)}</Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-slate-700/60 [&>tr:nth-child(even)]:bg-slate-50/40 dark:[&>tr:nth-child(even)]:bg-slate-800/20">
                {visibleHistoryRows.length > 0 ? (
                  visibleHistoryRows.map(req => (
                    <tr
                      key={`${req.kind}-${req.id}`}
                      className="transition-colors hover:bg-cyan-50/35 dark:hover:bg-slate-800/55"
                    >
                      {historyColumns.map(col => (
                        <Fragment key={col.id}>
                          {col.renderCell(req, { onViewRow: setSelectedHistoryRow })}
                        </Fragment>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={historyColumns.length}
                      className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      {historyRows.length === 0
                        ? 'No requests yet'
                        : 'No requests match this filter'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="shrink-0">
            <QueuePaginationBar
              totalItems={sortedHistoryRows.length}
              page={clampedHistoryPage}
              pageSize={historyPageSize}
              onPageChange={setHistoryPage}
              onPageSizeChange={setHistoryPageSize}
              idPrefix="student-history-page"
              accent="cyan"
              pageSizeOptions={[10, 20, 50]}
            />
          </div>
        </div>
      </div>

      <RequestHistorySidePanel row={selectedHistoryRow} onClose={() => setSelectedHistoryRow(null)} />
    </AppShell>
  );
};

export default StudentRequestHistoryPage;
