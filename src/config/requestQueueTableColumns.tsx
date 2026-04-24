import React from 'react';
import {
  ArrowsUpDownIcon,
  CalendarDaysIcon,
  EyeIcon,
  UserIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import Badge from '../components/Badge';
import type { HistoryRow } from '../components/dashboard/RequestHistorySidePanel';
import type { GuestRequest, LeaveRequest, MaintenanceRequest } from '../types';
import type { UnifiedRequest } from '../utils/filterRequests';
import { formatDateRange, formatRelativeTime } from '../utils/dateUtils';
import {
  getMaintenanceStatusBadgeVariant,
  getMaintenanceStatusLabel,
  getUnifiedRequestStatusDisplay,
} from '../utils/maintenanceStatusDisplay';

export type StudentHistoryTypeFilter = 'all' | 'Leave' | 'Guest' | 'Maintenance';

/** Submitted-date sort: default list order → oldest first → newest first → default. */
export type SubmittedDateSortMode = 'none' | 'asc' | 'desc';

export const STUDENT_HISTORY_SUBMITTED_COLUMN_ID = 'submitted';

/** Header controls for Request History on the student dashboard (per tab). */
export interface StudentHistoryAllTabHeaderFilters {
  typeValue: string;
  onTypeChange: (v: string) => void;
  typeOptions: string[];
  summaryValue: string;
  onSummaryChange: (v: string) => void;
  submittedDateValue: string;
  onSubmittedDateChange: (v: string) => void;
  statusValue: string;
  onStatusChange: (v: string) => void;
  statusOptions: { value: string; label: string }[];
}

export interface StudentHistoryLeaveTabHeaderFilters {
  reasonValue: string;
  onReasonChange: (v: string) => void;
  submittedDateValue: string;
  onSubmittedDateChange: (v: string) => void;
  statusValue: string;
  onStatusChange: (v: string) => void;
  statusOptions: { value: string; label: string }[];
}

export interface StudentHistoryGuestTabHeaderFilters {
  searchValue: string;
  onSearchChange: (v: string) => void;
  submittedDateValue: string;
  onSubmittedDateChange: (v: string) => void;
  statusValue: string;
  onStatusChange: (v: string) => void;
  statusOptions: { value: string; label: string }[];
}

export interface StudentHistoryMaintTabHeaderFilters {
  issueValue: string;
  onIssueChange: (v: string) => void;
  roomValue: string;
  onRoomChange: (v: string) => void;
  submittedDateValue: string;
  onSubmittedDateChange: (v: string) => void;
  statusValue: string;
  onStatusChange: (v: string) => void;
  statusOptions: { value: string; label: string }[];
}

export interface StudentHistoryHeaderProps {
  submittedDateSort: SubmittedDateSortMode;
  onCycleSubmittedDateSort: () => void;
  tabFilter: StudentHistoryTypeFilter;
  all?: StudentHistoryAllTabHeaderFilters;
  leave?: StudentHistoryLeaveTabHeaderFilters;
  guest?: StudentHistoryGuestTabHeaderFilters;
  maintenance?: StudentHistoryMaintTabHeaderFilters;
}

export interface StudentHistoryColumn {
  id: string;
  header: string;
  cellClass?: string;
  renderHeader: (props: StudentHistoryHeaderProps) => React.ReactNode;
  renderCell: (row: HistoryRow, ctx: { onViewRow: (row: HistoryRow) => void }) => React.ReactNode;
}

/** Column titles: same size/weight/color on student + warden queue filter headers. */
const QUEUE_HEADER_LABEL_CLASS =
  'text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400';

/** Single tone for select value, input value, placeholders, and date empty-state (keeps toolbar visually even). */
const QUEUE_FILTER_CONTROL_TEXT =
  'text-slate-600 dark:text-slate-300 placeholder:text-slate-600 dark:placeholder:text-slate-400';

const QUEUE_HEADER_FILTER_CONTROL =
  'mt-1.5 w-full min-w-0 box-border h-9 max-w-[9.25rem] rounded-xl border border-surface-200/90 bg-gradient-to-b from-white to-slate-50/90 px-3 text-xs font-normal tracking-tight shadow-sm shadow-slate-900/[0.06] ring-1 ring-slate-900/[0.04] transition-[border-color,box-shadow,background-color,color] placeholder:font-normal hover:border-slate-300/90 hover:shadow-md hover:to-white focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:border-slate-600 dark:from-slate-900 dark:to-slate-800 dark:ring-white/[0.06] dark:hover:border-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-500/25 ' +
  QUEUE_FILTER_CONTROL_TEXT;

const QUEUE_HEADER_FILTER_TYPE_MAX = 'max-w-[6.75rem]';
const QUEUE_HEADER_FILTER_SUMMARY_MAX = 'max-w-[7.5rem]';

/** Denser student Request History: more rows per viewport without changing warden queue. */
const SH_TH = 'px-3 py-1.5 align-top';
const SH_TD = 'px-3 py-2 align-top';
const SH_TD_MID = 'px-3 py-2 align-middle';
const SH_TH_SUBMITTED = 'px-3 py-1.5 align-top min-w-[9rem] whitespace-nowrap';
const SH_HEADER_FILTER =
  'mt-1 w-full min-w-0 box-border h-8 max-w-[9.25rem] rounded-lg border border-surface-200/90 bg-white px-2.5 text-xs font-normal tracking-tight shadow-sm ring-1 ring-slate-900/[0.04] transition-[border-color,box-shadow,background-color,color] placeholder:font-normal hover:border-slate-300 hover:bg-slate-50/80 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900 dark:ring-white/[0.06] dark:hover:border-slate-500 dark:focus:border-cyan-400 ' +
  QUEUE_FILTER_CONTROL_TEXT;
const SH_HEADER_DATE =
  'w-full min-w-0 box-border h-8 cursor-pointer rounded-lg border border-surface-200/90 bg-white px-2.5 text-xs font-normal tracking-tight tabular-nums shadow-sm ring-1 ring-slate-900/[0.04] transition-[border-color,box-shadow,color] hover:border-cyan-200/90 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900 dark:ring-white/[0.06] dark:hover:border-cyan-500/40 [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-55 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 ' +
  QUEUE_FILTER_CONTROL_TEXT;

const QUEUE_HEADER_DATE_INPUT_WARDEN =
  'w-full min-w-0 box-border h-9 cursor-pointer rounded-xl border border-surface-200/90 bg-gradient-to-b from-white to-emerald-50/40 px-3 text-xs font-normal tracking-tight tabular-nums shadow-sm shadow-slate-900/[0.06] ring-1 ring-slate-900/[0.04] transition-[border-color,box-shadow,background-color,color] hover:border-emerald-200/90 hover:shadow-md hover:to-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-slate-600 dark:from-slate-900 dark:to-emerald-950/25 dark:ring-white/[0.06] dark:hover:border-emerald-500/45 dark:focus:border-emerald-400 [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-55 [&::-webkit-calendar-picker-indicator]:transition-opacity hover:[&::-webkit-calendar-picker-indicator]:opacity-100 ' +
  QUEUE_FILTER_CONTROL_TEXT;

function plainHeaderTh(className: string, label: string) {
  return (
    <th className={className}>
      <span className={`${QUEUE_HEADER_LABEL_CLASS} block leading-tight`}>{label}</span>
    </th>
  );
}

/** Button only (wrap in `<th>` in the table). Cycles: none → asc → desc → none by submission date. */
export function submittedDateSortControl(
  mode: SubmittedDateSortMode,
  onCycle: () => void,
  activeArrowClassName = 'text-cyan-600'
) {
  const icon =
    mode === 'none' ? (
      <ArrowsUpDownIcon className="w-3.5 h-3.5 text-slate-400 opacity-70 shrink-0" aria-hidden />
    ) : mode === 'asc' ? (
      <span className={activeArrowClassName} aria-hidden>
        ↑
      </span>
    ) : (
      <span className={activeArrowClassName} aria-hidden>
        ↓
      </span>
    );
  return (
    <button
      type="button"
      onClick={onCycle}
      title="Submitted date: default table order → oldest first → newest first → default again"
      className={`inline-flex items-center gap-1.5 text-left ${QUEUE_HEADER_LABEL_CLASS} hover:text-slate-700 dark:hover:text-slate-300 transition-colors`}
    >
      Submitted
      {icon}
    </button>
  );
}

/** Sort icon beside label (no separate “box”); used in submitted column headers with date filter. */
export function submittedDateSortIconButton(
  mode: SubmittedDateSortMode,
  onCycle: () => void,
  activeArrowClassName = 'text-cyan-600'
) {
  const icon =
    mode === 'none' ? (
      <ArrowsUpDownIcon className="w-3.5 h-3.5 text-slate-400 opacity-80" aria-hidden />
    ) : mode === 'asc' ? (
      <span className={`text-xs font-semibold ${activeArrowClassName}`} aria-hidden>
        ↑
      </span>
    ) : (
      <span className={`text-xs font-semibold ${activeArrowClassName}`} aria-hidden>
        ↓
      </span>
    );
  return (
    <button
      type="button"
      onClick={onCycle}
      title="Submitted date: default order → oldest first → newest first → default"
      className="inline-flex shrink-0 items-center justify-center rounded-md p-0.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      aria-label="Sort by submitted date"
    >
      {icon}
    </button>
  );
}

function queueTableHeaderCaption(text: string) {
  return <span className={`${QUEUE_HEADER_LABEL_CLASS} block leading-tight`}>{text}</span>;
}

/** Shared by student history and warden queue submitted headers. */
export type SubmittedDateHeaderSortProps = Pick<
  StudentHistoryHeaderProps,
  'submittedDateSort' | 'onCycleSubmittedDateSort'
>;

function submittedHeaderWithDateFilter(
  p: SubmittedDateHeaderSortProps,
  date: { value: string; onChange: (v: string) => void },
  thClass = SH_TH_SUBMITTED,
  sortActiveArrowClass = 'text-cyan-600',
  dateInputClassName: string = SH_HEADER_DATE
) {
  const dateFieldGap = dateInputClassName === SH_HEADER_DATE ? 'mt-1' : 'mt-1.5';
  const placeholderInset = dateInputClassName === SH_HEADER_DATE ? 'left-2.5 right-8 text-[11px]' : 'left-3 right-9 text-xs';
  return (
    <th className={thClass}>
      <div className="flex items-center gap-1.5">
        <span className={`${QUEUE_HEADER_LABEL_CLASS} shrink-0`}>Submitted</span>
        {submittedDateSortIconButton(p.submittedDateSort, p.onCycleSubmittedDateSort, sortActiveArrowClass)}
      </div>
      <div className={`relative w-full max-w-[9.25rem] ${dateFieldGap}`}>
        <input
          type="date"
          value={date.value}
          onChange={e => date.onChange(e.target.value)}
          className={`${dateInputClassName} ${!date.value ? 'text-transparent caret-transparent dark:text-transparent' : ''}`}
          aria-label="Filter by submitted date"
        />
        {!date.value ? (
          <span
            className={`pointer-events-none absolute inset-y-0 z-[1] flex items-center font-normal text-slate-600 dark:text-slate-400 ${placeholderInset}`}
            aria-hidden
          >
            Select date
          </span>
        ) : null}
      </div>
    </th>
  );
}

function formatSubmitted(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function parentLabel(leave: LeaveRequest): string {
  if (leave.parent_approval === true) return 'Approved';
  if (leave.parent_approval === false) return 'Rejected';
  return 'Pending';
}

function studentHistoryStatusBadge(row: HistoryRow) {
  return (
    <Badge
      size="small"
      variant={
        row.kind === 'maintenance'
          ? getMaintenanceStatusBadgeVariant(row.raw as MaintenanceRequest)
          : row.status === 'approved' || row.status === 'completed' || row.status === 'active'
            ? 'success'
            : row.status === 'pending' || row.status === 'assigned' || row.status === 'in_progress'
              ? 'warning'
              : 'danger'
      }
      className="shrink-0"
    >
      {row.kind === 'maintenance'
        ? getMaintenanceStatusLabel(row.raw as MaintenanceRequest)
        : row.status.charAt(0).toUpperCase() + row.status.slice(1).replace(/_/g, ' ')}
    </Badge>
  );
}

function studentHistoryViewActionColumn(): StudentHistoryColumn {
  return {
    id: 'view',
    header: 'View',
    renderHeader: () => plainHeaderTh('px-3 pr-3 py-1.5 text-right align-top whitespace-nowrap', 'View'),
    renderCell: (row, ctx) => (
      <td className={`${SH_TD_MID} pr-3 text-right whitespace-nowrap w-[1%]`}>
        <button
          type="button"
          onClick={() => ctx.onViewRow(row)}
          className="inline-flex items-center gap-1 rounded-lg border border-surface-200/90 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition-colors hover:border-cyan-300 hover:bg-cyan-50/60 hover:text-cyan-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-cyan-500/50 dark:hover:bg-slate-700"
        >
          <EyeIcon className="h-3 w-3 text-cyan-600 shrink-0" aria-hidden />
          View
        </button>
      </td>
    ),
  };
}

/** Runtime column layouts for student Request History (per type tab). */
export function getStudentHistoryColumns(headerProps: StudentHistoryHeaderProps): StudentHistoryColumn[] {
  const filter = headerProps.tabFilter;

  if (filter === 'all') {
    const f = headerProps.all;
    return [
      {
        id: 'type',
        header: 'Type',
        renderHeader: () => (
          <th className={`${SH_TH} min-w-0 max-w-[7.5rem]`}>
            {queueTableHeaderCaption('Type')}
            <select
              className={`${SH_HEADER_FILTER} ${QUEUE_HEADER_FILTER_TYPE_MAX} cursor-pointer`}
              value={f?.typeValue ?? ''}
              onChange={e => f?.onTypeChange(e.target.value)}
              aria-label="Filter by request type"
            >
              <option value="">All types</option>
              {(f?.typeOptions ?? []).map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </th>
        ),
        renderCell: row => {
          const accent =
            row.kind === 'leave'
              ? 'border-l-[3px] border-l-blue-500'
              : row.kind === 'guest'
                ? 'border-l-[3px] border-l-emerald-500'
                : 'border-l-[3px] border-l-red-500';
          const typeChip =
            row.kind === 'leave'
              ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-100 dark:bg-blue-950/60 dark:text-blue-100 dark:ring-blue-500/40'
              : row.kind === 'guest'
                ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-100 dark:ring-emerald-500/40'
                : 'bg-red-50 text-red-800 ring-1 ring-red-100 dark:bg-red-950/60 dark:text-red-100 dark:ring-red-500/40';
          return (
            <td className={`${SH_TD} ${accent}`}>
              <div className={`inline-flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 ${typeChip}`}>
                {row.kind === 'leave' && <CalendarDaysIcon className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                {row.kind === 'guest' && <UserIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                {row.kind === 'maintenance' && (
                  <WrenchScrewdriverIcon className="h-3.5 w-3.5 text-red-600 dark:text-red-300 shrink-0" />
                )}
                <span className="text-xs font-semibold whitespace-nowrap">{row.typeLabel}</span>
              </div>
            </td>
          );
        },
      },
      {
        id: 'summary',
        header: 'Summary',
        renderHeader: () => (
          <th className={`${SH_TH} min-w-0 max-w-[8.5rem]`}>
            {queueTableHeaderCaption('Summary')}
            <input
              type="search"
              value={f?.summaryValue ?? ''}
              onChange={e => f?.onSummaryChange(e.target.value)}
              placeholder="Search…"
              className={`${SH_HEADER_FILTER} ${QUEUE_HEADER_FILTER_SUMMARY_MAX} cursor-text`}
              aria-label="Filter by summary text"
            />
          </th>
        ),
        renderCell: row => (
          <td className={`${SH_TD} max-w-[280px] text-slate-600 dark:text-slate-300`}>
            <span className="line-clamp-2 text-sm leading-snug whitespace-normal">{row.title}</span>
          </td>
        ),
      },
      {
        id: 'submitted',
        header: 'Submitted',
        renderHeader: p =>
          submittedHeaderWithDateFilter(p, {
            value: f?.submittedDateValue ?? '',
            onChange: v => f?.onSubmittedDateChange(v),
          }),
        renderCell: row => (
          <td className={`${SH_TD} whitespace-nowrap text-sm text-slate-500 dark:text-slate-400`}>
            {formatSubmitted(row.date)}
          </td>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        renderHeader: () => (
          <th className={`${SH_TH} min-w-0 max-w-[10rem] whitespace-nowrap`}>
            {queueTableHeaderCaption('Status')}
            <select
              className={`${SH_HEADER_FILTER} cursor-pointer`}
              value={f?.statusValue ?? ''}
              onChange={e => f?.onStatusChange(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {(f?.statusOptions ?? []).map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </th>
        ),
        renderCell: row => (
          <td className={`${SH_TD_MID} whitespace-nowrap`}>{studentHistoryStatusBadge(row)}</td>
        ),
      },
      studentHistoryViewActionColumn(),
    ];
  }

  if (filter === 'Leave') {
    const f = headerProps.leave;
    return [
      {
        id: 'leave_window',
        header: 'Leave period',
        renderHeader: () => plainHeaderTh(SH_TH, 'Leave period'),
        renderCell: row => {
          const l = row.raw as LeaveRequest;
          return (
            <td className={`${SH_TD} whitespace-nowrap`}>
              <div className="text-sm leading-tight text-slate-800 dark:text-slate-100">
                {formatDateRange(l.start_date, l.end_date)}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{l.duration_days} day(s)</div>
            </td>
          );
        },
      },
      {
        id: 'reason',
        header: 'Reason',
        renderHeader: () => (
          <th className={`${SH_TH} min-w-[8rem]`}>
            {queueTableHeaderCaption('Reason')}
            <input
              type="search"
              value={f?.reasonValue ?? ''}
              onChange={e => f?.onReasonChange(e.target.value)}
              placeholder="Search…"
              className={`${SH_HEADER_FILTER} cursor-text`}
              aria-label="Filter by reason text"
            />
          </th>
        ),
        renderCell: row => (
          <td className={`${SH_TD} max-w-[320px] text-slate-600 dark:text-slate-300`}>
            <span className="line-clamp-2 text-sm leading-snug whitespace-normal">
              {(row.raw as LeaveRequest).reason}
            </span>
          </td>
        ),
      },
      {
        id: 'parent',
        header: 'Parent',
        renderHeader: () => plainHeaderTh(SH_TH, 'Parent'),
        renderCell: row => (
          <td className={`${SH_TD} whitespace-nowrap text-sm text-slate-700 dark:text-slate-200`}>
            {parentLabel(row.raw as LeaveRequest)}
          </td>
        ),
      },
      {
        id: 'submitted',
        header: 'Submitted',
        renderHeader: p =>
          submittedHeaderWithDateFilter(p, {
            value: f?.submittedDateValue ?? '',
            onChange: v => f?.onSubmittedDateChange(v),
          }),
        renderCell: row => (
          <td className={`${SH_TD} whitespace-nowrap text-sm text-slate-500 dark:text-slate-400`}>
            {formatSubmitted(row.date)}
          </td>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        renderHeader: () => (
          <th className={`${SH_TH} min-w-0 max-w-[10rem] whitespace-nowrap`}>
            {queueTableHeaderCaption('Status')}
            <select
              className={`${SH_HEADER_FILTER} cursor-pointer`}
              value={f?.statusValue ?? ''}
              onChange={e => f?.onStatusChange(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {(f?.statusOptions ?? []).map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </th>
        ),
        renderCell: row => (
          <td className={`${SH_TD_MID} whitespace-nowrap`}>{studentHistoryStatusBadge(row)}</td>
        ),
      },
      studentHistoryViewActionColumn(),
    ];
  }

  if (filter === 'Guest') {
    const f = headerProps.guest;
    return [
      {
        id: 'visit',
        header: 'Visit',
        renderHeader: () => plainHeaderTh(SH_TH, 'Visit'),
        renderCell: row => {
          const g = row.raw as GuestRequest;
          const windowText =
            g.visit_type === 'overnight'
              ? `${formatDateRange(g.start_date, g.end_date)} · ${g.duration_days} night(s)`
              : `Day visit · ${new Date(g.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
          return (
            <td className={SH_TD}>
              <div className="text-sm leading-tight text-slate-800 dark:text-slate-100">{windowText}</div>
              <div className="mt-0.5 text-[11px] capitalize text-slate-500 dark:text-slate-400">
                {g.visit_type.replace('_', ' ')}
              </div>
            </td>
          );
        },
      },
      {
        id: 'guest',
        header: 'Guest',
        renderHeader: () => plainHeaderTh(SH_TH, 'Guest'),
        renderCell: row => {
          const g = row.raw as GuestRequest;
          return (
            <td className={SH_TD}>
              <div className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
                {g.guest_name}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{g.guest_phone}</div>
            </td>
          );
        },
      },
      {
        id: 'purpose',
        header: 'Purpose',
        renderHeader: () => (
          <th className={`${SH_TH} min-w-[8rem]`}>
            {queueTableHeaderCaption('Purpose / guest')}
            <input
              type="search"
              value={f?.searchValue ?? ''}
              onChange={e => f?.onSearchChange(e.target.value)}
              placeholder="Search…"
              className={`${SH_HEADER_FILTER} cursor-text`}
              aria-label="Filter by guest name or purpose"
            />
          </th>
        ),
        renderCell: row => (
          <td className={`${SH_TD} max-w-[280px] text-slate-600 dark:text-slate-300`}>
            <span className="line-clamp-2 text-sm leading-snug whitespace-normal">
              {(row.raw as GuestRequest).purpose}
            </span>
          </td>
        ),
      },
      {
        id: 'submitted',
        header: 'Submitted',
        renderHeader: p =>
          submittedHeaderWithDateFilter(p, {
            value: f?.submittedDateValue ?? '',
            onChange: v => f?.onSubmittedDateChange(v),
          }),
        renderCell: row => (
          <td className={`${SH_TD} whitespace-nowrap text-sm text-slate-500 dark:text-slate-400`}>
            {formatSubmitted(row.date)}
          </td>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        renderHeader: () => (
          <th className={`${SH_TH} min-w-0 max-w-[10rem] whitespace-nowrap`}>
            {queueTableHeaderCaption('Status')}
            <select
              className={`${SH_HEADER_FILTER} cursor-pointer`}
              value={f?.statusValue ?? ''}
              onChange={e => f?.onStatusChange(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {(f?.statusOptions ?? []).map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </th>
        ),
        renderCell: row => (
          <td className={`${SH_TD_MID} whitespace-nowrap`}>{studentHistoryStatusBadge(row)}</td>
        ),
      },
      studentHistoryViewActionColumn(),
    ];
  }

  /* Maintenance */
  const f = headerProps.maintenance;
  return [
    {
      id: 'issue',
      header: 'Issue',
      renderHeader: () => (
        <th className={`${SH_TH} min-w-[8rem]`}>
          {queueTableHeaderCaption('Issue')}
          <input
            type="search"
            value={f?.issueValue ?? ''}
            onChange={e => f?.onIssueChange(e.target.value)}
            placeholder="Search…"
            className={`${SH_HEADER_FILTER} cursor-text`}
            aria-label="Filter by issue or description"
          />
        </th>
      ),
      renderCell: row => {
        const m = row.raw as MaintenanceRequest;
        return (
          <td className={`${SH_TD} max-w-[280px]`}>
            <div className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">{m.issue_type}</div>
            <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
              {m.description}
            </div>
          </td>
        );
      },
    },
    {
      id: 'location',
      header: 'Room',
      renderHeader: () => (
        <th className={`${SH_TH} min-w-[6rem]`}>
          {queueTableHeaderCaption('Room')}
          <input
            type="search"
            value={f?.roomValue ?? ''}
            onChange={e => f?.onRoomChange(e.target.value)}
            placeholder="Room…"
            className={`${SH_HEADER_FILTER} max-w-[6.5rem] cursor-text`}
            aria-label="Filter by room number"
          />
        </th>
      ),
      renderCell: row => (
        <td className={`${SH_TD} whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100`}>
          {(row.raw as MaintenanceRequest).room_number}
        </td>
      ),
    },
    {
      id: 'priority',
      header: 'Priority',
      renderHeader: () => plainHeaderTh(SH_TH, 'Priority'),
      renderCell: row => (
        <td className={`${SH_TD} whitespace-nowrap text-sm capitalize text-slate-700 dark:text-slate-200`}>
          {(row.raw as MaintenanceRequest).priority}
        </td>
      ),
    },
    {
      id: 'submitted',
      header: 'Submitted',
      renderHeader: p =>
        submittedHeaderWithDateFilter(p, {
          value: f?.submittedDateValue ?? '',
          onChange: v => f?.onSubmittedDateChange(v),
        }),
      renderCell: row => (
        <td className={`${SH_TD} whitespace-nowrap text-sm text-slate-500 dark:text-slate-400`}>
          {formatSubmitted(row.date)}
        </td>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      renderHeader: () => (
        <th className={`${SH_TH} min-w-0 max-w-[10rem] whitespace-nowrap`}>
          {queueTableHeaderCaption('Status')}
          <select
            className={`${SH_HEADER_FILTER} cursor-pointer`}
            value={f?.statusValue ?? ''}
            onChange={e => f?.onStatusChange(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {(f?.statusOptions ?? []).map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </th>
      ),
      renderCell: row => (
        <td className={`${SH_TD_MID} whitespace-nowrap`}>{studentHistoryStatusBadge(row)}</td>
      ),
    },
    studentHistoryViewActionColumn(),
  ];
}

// --- Warden queue ---

export type WardenRequestTypeTab = 'all' | 'leave' | 'guest' | 'maintenance';

export interface WardenQueueAllTabHeaderFilters {
  studentValue: string;
  onStudentChange: (v: string) => void;
  typeValue: string;
  onTypeChange: (v: string) => void;
  typeOptions: { value: string; label: string }[];
  detailsValue: string;
  onDetailsChange: (v: string) => void;
  submittedDateValue: string;
  onSubmittedDateChange: (v: string) => void;
  statusValue: string;
  onStatusChange: (v: string) => void;
  statusOptions: { value: string; label: string }[];
}

export interface WardenQueueLeaveTabHeaderFilters {
  studentValue: string;
  onStudentChange: (v: string) => void;
  reasonValue: string;
  onReasonChange: (v: string) => void;
  submittedDateValue: string;
  onSubmittedDateChange: (v: string) => void;
  statusValue: string;
  onStatusChange: (v: string) => void;
  statusOptions: { value: string; label: string }[];
}

export interface WardenQueueGuestTabHeaderFilters {
  studentValue: string;
  onStudentChange: (v: string) => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  submittedDateValue: string;
  onSubmittedDateChange: (v: string) => void;
  statusValue: string;
  onStatusChange: (v: string) => void;
  statusOptions: { value: string; label: string }[];
}

export interface WardenQueueMaintTabHeaderFilters {
  studentValue: string;
  onStudentChange: (v: string) => void;
  issueValue: string;
  onIssueChange: (v: string) => void;
  submittedDateValue: string;
  onSubmittedDateChange: (v: string) => void;
  statusValue: string;
  onStatusChange: (v: string) => void;
  statusOptions: { value: string; label: string }[];
}

export interface WardenQueueHeaderProps {
  submittedDateSort: SubmittedDateSortMode;
  onCycleSubmittedDateSort: () => void;
  requestTypeTab: WardenRequestTypeTab;
  all?: WardenQueueAllTabHeaderFilters;
  leave?: WardenQueueLeaveTabHeaderFilters;
  guest?: WardenQueueGuestTabHeaderFilters;
  maintenance?: WardenQueueMaintTabHeaderFilters;
}

export interface WardenQueueColumn {
  id: string;
  header: string;
  thClass?: string;
  tdClass?: string;
  renderHeader: (props: WardenQueueHeaderProps) => React.ReactNode;
  renderCell: (request: UnifiedRequest) => React.ReactNode;
}

/** Column id for warden queue: sortable by `created_at` in `WardenDashboard`. */
export const WARDEN_QUEUE_SUBMITTED_COLUMN_ID = 'submitted';

function wardenQueuePlainTh(className: string, label: string) {
  return (
    <th className={className}>
      {queueTableHeaderCaption(label)}
    </th>
  );
}

function wardenSubmittedDateBindings(p: WardenQueueHeaderProps): { value: string; onChange: (v: string) => void } {
  if (p.requestTypeTab === 'all' && p.all) {
    return { value: p.all.submittedDateValue, onChange: p.all.onSubmittedDateChange };
  }
  if (p.requestTypeTab === 'leave' && p.leave) {
    return { value: p.leave.submittedDateValue, onChange: p.leave.onSubmittedDateChange };
  }
  if (p.requestTypeTab === 'guest' && p.guest) {
    return { value: p.guest.submittedDateValue, onChange: p.guest.onSubmittedDateChange };
  }
  if (p.requestTypeTab === 'maintenance' && p.maintenance) {
    return { value: p.maintenance.submittedDateValue, onChange: p.maintenance.onSubmittedDateChange };
  }
  return { value: '', onChange: () => {} };
}

export function wardenSubmittedQueueColumn(): WardenQueueColumn {
  return {
    id: WARDEN_QUEUE_SUBMITTED_COLUMN_ID,
    header: 'Submitted',
    thClass: 'whitespace-nowrap',
    renderHeader: p =>
      submittedHeaderWithDateFilter(
        p,
        wardenSubmittedDateBindings(p),
        'px-4 py-2 align-top min-w-[10rem] whitespace-nowrap',
        'text-emerald-700',
        QUEUE_HEADER_DATE_INPUT_WARDEN
      ),
    renderCell: r => (
      <td className="px-4 py-4 align-top whitespace-nowrap">
        <div className="text-sm text-slate-800">{formatSubmitted(r.created_at)}</div>
        <div className="text-xs text-slate-500 mt-0.5">{formatRelativeTime(r.created_at)}</div>
      </td>
    ),
  };
}

function wardenStudentCell(request: UnifiedRequest) {
  const name = request.student_name || 'Unknown Student';
  const room =
    request.requestType === 'maintenance'
      ? (request as MaintenanceRequest).room_number
      : (request as LeaveRequest | GuestRequest).student_room;
  const tag =
    request.requestType === 'guest'
      ? 'Guest visit'
      : request.requestType === 'maintenance'
        ? 'Maintenance'
        : 'Leave';
  return (
    <td className="px-6 py-4 align-top">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-surface-100 ring-1 ring-surface-200 flex items-center justify-center text-sm font-semibold text-slate-600">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
          <p className="text-xs text-slate-500 truncate">
            {room} · {tag}
          </p>
        </div>
      </div>
    </td>
  );
}

function wardenStatusCell(request: UnifiedRequest) {
  const { label, variant } = getUnifiedRequestStatusDisplay(request);
  return (
    <td className="px-4 py-4 align-top">
      <Badge variant={variant} size="small">
        {label}
      </Badge>
    </td>
  );
}

function wardenReviewCell(request: UnifiedRequest, onSelect: (r: UnifiedRequest) => void) {
  return (
    <td className="px-6 py-4 align-top text-right">
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          onSelect(request);
        }}
        className="inline-flex items-center gap-1 rounded-lg border border-surface-200/90 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-emerald-500/50 dark:hover:bg-slate-700"
      >
        <EyeIcon className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        View
      </button>
    </td>
  );
}

/** Runtime column layouts for warden request queue (per request-type filter). */
export function getWardenQueueColumns(
  headerProps: WardenQueueHeaderProps,
  onReview: (request: UnifiedRequest) => void
): WardenQueueColumn[] {
  const requestType = headerProps.requestTypeTab;

  const statusCol: WardenQueueColumn = {
    id: 'status',
    header: 'Status',
    renderHeader: p => {
      const opts =
        p.requestTypeTab === 'all'
          ? p.all?.statusOptions
          : p.requestTypeTab === 'leave'
            ? p.leave?.statusOptions
            : p.requestTypeTab === 'guest'
              ? p.guest?.statusOptions
              : p.maintenance?.statusOptions;
      const val =
        p.requestTypeTab === 'all'
          ? p.all?.statusValue
          : p.requestTypeTab === 'leave'
            ? p.leave?.statusValue
            : p.requestTypeTab === 'guest'
              ? p.guest?.statusValue
              : p.maintenance?.statusValue;
      const onCh =
        p.requestTypeTab === 'all'
          ? p.all?.onStatusChange
          : p.requestTypeTab === 'leave'
            ? p.leave?.onStatusChange
            : p.requestTypeTab === 'guest'
              ? p.guest?.onStatusChange
              : p.maintenance?.onStatusChange;
      return (
        <th className="px-4 py-2 align-top min-w-0 max-w-[10rem] whitespace-nowrap">
          {queueTableHeaderCaption('Status')}
          <select
            className={`${QUEUE_HEADER_FILTER_CONTROL} cursor-pointer`}
            value={val ?? ''}
            onChange={e => onCh?.(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {(opts ?? []).map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </th>
      );
    },
    renderCell: r => wardenStatusCell(r),
  };
  const actionCol: WardenQueueColumn = {
    id: 'view',
    header: 'View',
    thClass: 'text-right',
    renderHeader: () => wardenQueuePlainTh('px-4 pr-6 py-2 text-right align-top', 'View'),
    renderCell: r => wardenReviewCell(r, onReview),
  };

  if (requestType === 'leave') {
    const f = headerProps.leave;
    return [
      {
        id: 'student',
        header: 'Student',
        renderHeader: () => (
          <th className="pl-6 pr-4 py-2 align-top min-w-[8rem]">
            {queueTableHeaderCaption('Student')}
            <input
              type="search"
              value={f?.studentValue ?? ''}
              onChange={e => f?.onStudentChange(e.target.value)}
              placeholder="Name or room…"
              className={`${QUEUE_HEADER_FILTER_CONTROL} cursor-text`}
              aria-label="Filter by student name or room"
            />
          </th>
        ),
        renderCell: r => wardenStudentCell(r),
      },
      wardenSubmittedQueueColumn(),
      {
        id: 'leave_period',
        header: 'Leave period',
        renderHeader: () => wardenQueuePlainTh('px-4 py-2 align-top whitespace-nowrap', 'Leave period'),
        renderCell: r => {
          if (r.requestType !== 'leave') return <td className="px-4 py-4" />;
          const lr = r as LeaveRequest & { requestType: 'leave' };
          return (
            <td className="px-4 py-4 align-top">
              <div className="text-sm text-slate-800">{formatDateRange(lr.start_date, lr.end_date)}</div>
              <div className="text-xs text-slate-500 mt-1">{lr.duration_days} day(s)</div>
            </td>
          );
        },
      },
      {
        id: 'reason',
        header: 'Reason',
        renderHeader: () => (
          <th className="px-4 py-2 align-top min-w-[8rem]">
            {queueTableHeaderCaption('Reason')}
            <input
              type="search"
              value={f?.reasonValue ?? ''}
              onChange={e => f?.onReasonChange(e.target.value)}
              placeholder="Search…"
              className={`${QUEUE_HEADER_FILTER_CONTROL} cursor-text`}
              aria-label="Filter by reason text"
            />
          </th>
        ),
        renderCell: r =>
          r.requestType === 'leave' ? (
            <td className="px-4 py-4 align-top">
              {(() => {
                const lr = r as LeaveRequest & { requestType: 'leave' };
                return (
                  <>
                    <div className="text-sm text-slate-800 line-clamp-3">{lr.reason}</div>
                    {lr.is_short_leave && (
                      <span className="mt-1 inline-block text-[11px] text-slate-500">Short leave</span>
                    )}
                  </>
                );
              })()}
            </td>
          ) : (
            <td className="px-4 py-4" />
          ),
      },
      {
        id: 'parent',
        header: 'Parent',
        renderHeader: () => wardenQueuePlainTh('px-4 py-2 align-top whitespace-nowrap', 'Parent'),
        renderCell: r =>
          r.requestType === 'leave' ? (
            <td className="px-4 py-4 align-top text-sm text-slate-700 whitespace-nowrap">
              {(() => {
                const lr = r as LeaveRequest & { requestType: 'leave' };
                return lr.parent_approval === true
                  ? 'Approved'
                  : lr.parent_approval === false
                    ? 'Rejected'
                    : 'Pending';
              })()}
            </td>
          ) : (
            <td className="px-4 py-4" />
          ),
      },
      statusCol,
      actionCol,
    ];
  }

  if (requestType === 'guest') {
    const f = headerProps.guest;
    return [
      {
        id: 'student',
        header: 'Student',
        renderHeader: () => (
          <th className="pl-6 pr-4 py-2 align-top min-w-[8rem]">
            {queueTableHeaderCaption('Student')}
            <input
              type="search"
              value={f?.studentValue ?? ''}
              onChange={e => f?.onStudentChange(e.target.value)}
              placeholder="Name or room…"
              className={`${QUEUE_HEADER_FILTER_CONTROL} cursor-text`}
              aria-label="Filter by student name or room"
            />
          </th>
        ),
        renderCell: r => wardenStudentCell(r),
      },
      wardenSubmittedQueueColumn(),
      {
        id: 'visit',
        header: 'Visit',
        renderHeader: () => wardenQueuePlainTh('px-4 py-2 align-top', 'Visit'),
        renderCell: r => {
          if (r.requestType !== 'guest') return <td className="px-4 py-4" />;
          const g = r as GuestRequest & { requestType: 'guest' };
          const windowText =
            g.visit_type === 'overnight'
              ? `${formatDateRange(g.start_date, g.end_date)} · ${g.duration_days} night(s)`
              : `Day visit · ${new Date(g.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          return (
            <td className="px-4 py-4 align-top">
              <div className="text-sm text-slate-800">{windowText}</div>
              <div className="text-xs text-slate-500 mt-1 capitalize">{g.visit_type}</div>
            </td>
          );
        },
      },
      {
        id: 'guest_detail',
        header: 'Guest & purpose',
        renderHeader: () => (
          <th className="px-4 py-2 align-top min-w-[8rem]">
            {queueTableHeaderCaption('Guest & purpose')}
            <input
              type="search"
              value={f?.searchValue ?? ''}
              onChange={e => f?.onSearchChange(e.target.value)}
              placeholder="Search…"
              className={`${QUEUE_HEADER_FILTER_CONTROL} cursor-text`}
              aria-label="Filter by guest name or purpose"
            />
          </th>
        ),
        renderCell: r =>
          r.requestType === 'guest' ? (
            <td className="px-4 py-4 align-top">
              {(() => {
                const g = r as GuestRequest & { requestType: 'guest' };
                return (
                  <>
                    <div className="text-sm font-semibold text-slate-900">{g.guest_name}</div>
                    <div className="text-xs text-slate-500">{g.guest_phone}</div>
                    <div className="text-sm text-slate-600 mt-1 line-clamp-2">{g.purpose}</div>
                  </>
                );
              })()}
            </td>
          ) : (
            <td className="px-4 py-4" />
          ),
      },
      statusCol,
      actionCol,
    ];
  }

  if (requestType === 'maintenance') {
    const f = headerProps.maintenance;
    return [
      {
        id: 'student',
        header: 'Student',
        renderHeader: () => (
          <th className="pl-6 pr-4 py-2 align-top min-w-[8rem]">
            {queueTableHeaderCaption('Student')}
            <input
              type="search"
              value={f?.studentValue ?? ''}
              onChange={e => f?.onStudentChange(e.target.value)}
              placeholder="Name or room…"
              className={`${QUEUE_HEADER_FILTER_CONTROL} cursor-text`}
              aria-label="Filter by student name or room"
            />
          </th>
        ),
        renderCell: r => wardenStudentCell(r),
      },
      wardenSubmittedQueueColumn(),
      {
        id: 'issue',
        header: 'Issue & location',
        renderHeader: () => (
          <th className="px-4 py-2 align-top min-w-[8rem]">
            {queueTableHeaderCaption('Issue & location')}
            <input
              type="search"
              value={f?.issueValue ?? ''}
              onChange={e => f?.onIssueChange(e.target.value)}
              placeholder="Issue, room, notes…"
              className={`${QUEUE_HEADER_FILTER_CONTROL} cursor-text`}
              aria-label="Filter by issue, description, or room"
            />
          </th>
        ),
        renderCell: r =>
          r.requestType === 'maintenance' ? (
            <td className="px-4 py-4 align-top">
              {(() => {
                const m = r as MaintenanceRequest & { requestType: 'maintenance' };
                return (
                  <>
                    <div className="text-sm font-semibold text-slate-900">{m.issue_type}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Room {m.room_number}</div>
                    <div className="text-sm text-slate-600 mt-1 line-clamp-2">{m.description}</div>
                  </>
                );
              })()}
            </td>
          ) : (
            <td className="px-4 py-4" />
          ),
      },
      {
        id: 'priority',
        header: 'Priority',
        renderHeader: () => wardenQueuePlainTh('px-4 py-2 align-top whitespace-nowrap', 'Priority'),
        renderCell: r =>
          r.requestType === 'maintenance' ? (
            <td className="px-4 py-4 align-top text-sm capitalize text-slate-800 whitespace-nowrap">
              {(r as MaintenanceRequest & { requestType: 'maintenance' }).priority}
            </td>
          ) : (
            <td className="px-4 py-4" />
          ),
      },
      {
        id: 'timeline',
        header: 'Queue',
        renderHeader: () => wardenQueuePlainTh('px-4 py-2 align-top', 'Queue'),
        renderCell: r =>
          r.requestType === 'maintenance' ? (
            <td className="px-4 py-4 align-top">
              {(() => {
                const m = r as MaintenanceRequest & { requestType: 'maintenance' };
                return (
                  <>
                    {m.assigned_to_name ? (
                      <div className="text-xs text-slate-600">Assignee: {m.assigned_to_name}</div>
                    ) : null}
                    {m.estimated_completion ? (
                      <div className={`text-xs text-slate-500 ${m.assigned_to_name ? 'mt-1' : ''}`}>
                        ETA {formatSubmitted(m.estimated_completion)}
                      </div>
                    ) : null}
                    {!m.assigned_to_name && !m.estimated_completion ? (
                      <div className="text-xs text-slate-400">—</div>
                    ) : null}
                  </>
                );
              })()}
            </td>
          ) : (
            <td className="px-4 py-4" />
          ),
      },
      statusCol,
      actionCol,
    ];
  }

  /* all — mixed types: one schema that reads well for every request */
  const fall = headerProps.all;
  return [
    {
      id: 'student',
      header: 'Student',
      renderHeader: () => (
        <th className="pl-6 pr-4 py-2 align-top min-w-[8rem]">
          {queueTableHeaderCaption('Student')}
          <input
            type="search"
            value={fall?.studentValue ?? ''}
            onChange={e => fall?.onStudentChange(e.target.value)}
            placeholder="Name or room…"
            className={`${QUEUE_HEADER_FILTER_CONTROL} cursor-text`}
            aria-label="Filter by student name or room"
          />
        </th>
      ),
      renderCell: r => wardenStudentCell(r),
    },
    {
      id: 'type',
      header: 'Type',
      renderHeader: () => (
        <th className="px-4 py-2 align-top min-w-0 max-w-[7.5rem]">
          {queueTableHeaderCaption('Type')}
          <select
            className={`${QUEUE_HEADER_FILTER_CONTROL} ${QUEUE_HEADER_FILTER_TYPE_MAX} cursor-pointer`}
            value={fall?.typeValue ?? ''}
            onChange={e => fall?.onTypeChange(e.target.value)}
            aria-label="Filter by request type"
          >
            <option value="">All types</option>
            {(fall?.typeOptions ?? []).map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </th>
      ),
      renderCell: r => {
        const label = r.requestType === 'leave' ? 'Leave' : r.requestType === 'guest' ? 'Guest' : 'Maintenance';
        const chip =
          r.requestType === 'leave'
            ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-100'
            : r.requestType === 'guest'
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'
              : 'bg-red-50 text-red-800 ring-1 ring-red-100';
        return (
          <td className="px-4 py-4 align-top">
            <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${chip}`}>{label}</span>
          </td>
        );
      },
    },
    wardenSubmittedQueueColumn(),
    {
      id: 'when',
      header: 'When / timeline',
      renderHeader: () => wardenQueuePlainTh('px-4 py-2 align-top min-w-[7rem]', 'When / timeline'),
      renderCell: r => {
        if (r.requestType === 'leave') {
          const lr = r as LeaveRequest & { requestType: 'leave' };
          return (
            <td className="px-4 py-4 align-top">
              <div className="text-sm text-slate-800">{formatDateRange(lr.start_date, lr.end_date)}</div>
              <div className="text-xs text-slate-500 mt-1">{lr.duration_days} day(s) leave</div>
            </td>
          );
        }
        if (r.requestType === 'guest') {
          const g = r as GuestRequest & { requestType: 'guest' };
          const windowText =
            g.visit_type === 'overnight'
              ? `${formatDateRange(g.start_date, g.end_date)} · ${g.duration_days} night(s)`
              : `Day visit · ${new Date(g.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          return (
            <td className="px-4 py-4 align-top">
              <div className="text-sm text-slate-800">{windowText}</div>
            </td>
          );
        }
        const m = r as MaintenanceRequest & { requestType: 'maintenance' };
        return (
          <td className="px-4 py-4 align-top">
            <div className="text-sm text-slate-800 capitalize">{m.priority} priority</div>
          </td>
        );
      },
    },
    {
      id: 'details',
      header: 'Details',
      renderHeader: () => (
        <th className="px-4 py-2 align-top min-w-0 max-w-[8.5rem]">
          {queueTableHeaderCaption('Details')}
          <input
            type="search"
            value={fall?.detailsValue ?? ''}
            onChange={e => fall?.onDetailsChange(e.target.value)}
            placeholder="Search…"
            className={`${QUEUE_HEADER_FILTER_CONTROL} ${QUEUE_HEADER_FILTER_SUMMARY_MAX} cursor-text`}
            aria-label="Filter by request details"
          />
        </th>
      ),
      renderCell: r => {
        let headline = '';
        let sub = '';
        if (r.requestType === 'leave') {
          const lr = r as LeaveRequest & { requestType: 'leave' };
          headline = lr.reason;
          sub = 'Leave';
        } else if (r.requestType === 'guest') {
          const g = r as GuestRequest & { requestType: 'guest' };
          headline = `${g.guest_name} — ${g.purpose}`;
          sub = `${g.visit_type === 'overnight' ? 'Overnight' : 'Day'} guest`;
        } else {
          const m = r as MaintenanceRequest & { requestType: 'maintenance' };
          headline = `${m.issue_type} · ${m.description}`;
          sub = `Room ${m.room_number}`;
        }
        return (
          <td className="px-4 py-4 align-top">
            <div className="text-sm text-slate-800 line-clamp-2">{headline}</div>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-0.5 text-[11px] text-slate-600">
              {sub}
            </div>
          </td>
        );
      },
    },
    statusCol,
    actionCol,
  ];
}
