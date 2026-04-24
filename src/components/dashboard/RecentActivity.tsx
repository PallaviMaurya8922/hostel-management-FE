import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  ChevronRightIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useAllRequests } from '../../hooks/useRequests';
import { formatRelativeTime, formatDateRange, formatDate } from '../../utils/dateUtils';
import type {
  DigitalPass,
  LeaveRequest,
  GuestRequest,
  MaintenanceRequest,
} from '../../types';

function statusMatches(value: string | undefined, expected: string): boolean {
  return (value ?? '').trim().toLowerCase() === expected.toLowerCase();
}

export interface RecentActivityItem {
  id: string;
  type: 'leave' | 'guest' | 'maintenance' | 'pass';
  action: 'submitted' | 'approved' | 'rejected' | 'generated';
  description: string;
  timestamp: string;
  icon: typeof CheckCircleIcon;
  iconColor: string;
  bgColor: string;
}

interface BuildActivityOptions {
  leaves?: LeaveRequest[];
  guests?: GuestRequest[];
  maintenance?: MaintenanceRequest[];
  passes?: DigitalPass[];
}

interface RecentActivityPanelProps {
  items: RecentActivityItem[];
  title?: string;
  emptyText?: string;
}

export function buildRecentActivityItems({
  leaves = [],
  guests = [],
  maintenance = [],
  passes = [],
}: BuildActivityOptions): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];

  leaves.forEach((leave: LeaveRequest) => {
    items.push({
      id: `leave-submit-${leave.absence_id}`,
      type: 'leave',
      action: 'submitted',
      description: `Leave request submitted for ${formatDateRange(leave.start_date, leave.end_date)}`,
      timestamp: leave.created_at,
      icon: DocumentTextIcon,
      iconColor: 'text-brand-600',
      bgColor: 'bg-brand-50',
    });

    if (leave.status === 'approved') {
      items.push({
        id: `leave-approve-${leave.absence_id}`,
        type: 'leave',
        action: 'approved',
        description: `Leave approved${leave.auto_approved ? ' (auto)' : leave.approved_by_name ? ` by ${leave.approved_by_name}` : ''}`,
        timestamp: leave.updated_at,
        icon: CheckCircleIcon,
        iconColor: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
      });
    } else if (leave.status === 'rejected') {
      items.push({
        id: `leave-reject-${leave.absence_id}`,
        type: 'leave',
        action: 'rejected',
        description: `Leave rejected${leave.approved_by_name ? ` by ${leave.approved_by_name}` : ''}`,
        timestamp: leave.updated_at,
        icon: XCircleIcon,
        iconColor: 'text-red-600',
        bgColor: 'bg-red-50',
      });
    }
  });

  guests.forEach((guest: GuestRequest) => {
    items.push({
      id: `guest-submit-${guest.request_id}`,
      type: 'guest',
      action: 'submitted',
      description: `Guest request submitted for ${guest.guest_name}`,
      timestamp: guest.created_at,
      icon: UserGroupIcon,
      iconColor: 'text-brand-600',
      bgColor: 'bg-brand-50',
    });

    if (guest.status === 'approved') {
      items.push({
        id: `guest-approve-${guest.request_id}`,
        type: 'guest',
        action: 'approved',
        description: `Guest request approved${guest.auto_approved ? ' (auto)' : guest.approved_by_name ? ` by ${guest.approved_by_name}` : ''}`,
        timestamp: guest.updated_at,
        icon: CheckCircleIcon,
        iconColor: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
      });
    } else if (guest.status === 'rejected') {
      items.push({
        id: `guest-reject-${guest.request_id}`,
        type: 'guest',
        action: 'rejected',
        description: `Guest request rejected${guest.approved_by_name ? ` by ${guest.approved_by_name}` : ''}`,
        timestamp: guest.updated_at,
        icon: XCircleIcon,
        iconColor: 'text-red-600',
        bgColor: 'bg-red-50',
      });
    }
  });

  maintenance.forEach((request: MaintenanceRequest) => {
    items.push({
      id: `maintenance-submit-${request.request_id}`,
      type: 'maintenance',
      action: 'submitted',
      description: `Complaint filed: ${request.issue_type}`,
      timestamp: request.created_at,
      icon: WrenchScrewdriverIcon,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
    });

    if (request.status === 'completed') {
      items.push({
        id: `maintenance-complete-${request.request_id}`,
        type: 'maintenance',
        action: 'approved',
        description: `Complaint resolved: ${request.issue_type}`,
        timestamp: request.actual_completion || request.updated_at,
        icon: CheckCircleIcon,
        iconColor: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
      });
    }
  });

  passes.forEach((pass: DigitalPass) => {
    items.push({
      id: `pass-generate-${pass.pass_number}`,
      type: 'pass',
      action: 'generated',
      description: `Digital pass generated: ${pass.pass_number}`,
      timestamp: pass.created_at,
      icon: CheckCircleIcon,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    });
  });

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
}

export const RecentActivityPanel = ({
  items,
  title = 'Recent Activity',
  emptyText = 'No recent activity',
}: RecentActivityPanelProps) => {
  return (
    <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-6">
      <h2 className="text-base font-semibold text-slate-800 mb-4">{title}</h2>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
            <ClockIcon className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((activity, idx) => (
            <div
              key={activity.id}
              className={`flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-surface-50 ${
                idx === 0 ? 'animate-slideUp' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-lg ${activity.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <activity.icon className={`h-4 w-4 ${activity.iconColor}`} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 leading-snug">{activity.description}</p>
                <time dateTime={activity.timestamp} className="text-xs text-slate-400 mt-0.5 block">
                  {formatRelativeTime(activity.timestamp)}
                </time>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const RecentActivity = () => {
  const { leaves, guests, maintenance } = useAllRequests();

  const summary = useMemo(() => {
    const latestByCategory = <T extends { created_at: string; updated_at: string }>(items: T[]) =>
      [...items].sort(
        (a, b) => new Date((b.updated_at || b.created_at)).getTime() - new Date((a.updated_at || a.created_at)).getTime()
      )[0];

    const recentActions = [] as Array<{
      id: string;
      title: string;
      detail: string;
      timestamp: string;
      icon: typeof CheckCircleIcon;
      iconClass: string;
      chipClass: string;
    }>;

    const latestLeave = latestByCategory(leaves.data || []);
    if (latestLeave) {
      recentActions.push({
        id: `leave-${latestLeave.absence_id}`,
        title: latestLeave.status === 'approved' ? 'Leave request approved' : latestLeave.status === 'rejected' ? 'Leave request rejected' : 'Leave request submitted',
        detail: latestLeave.status === 'approved'
          ? latestLeave.approved_by_name
            ? `Approved by ${latestLeave.approved_by_name}`
            : 'Approved successfully'
          : latestLeave.status === 'rejected'
            ? 'Review the reason in your request history'
            : `For ${formatDateRange(latestLeave.start_date, latestLeave.end_date)}`,
        timestamp: latestLeave.status === 'approved' || latestLeave.status === 'rejected' ? latestLeave.updated_at : latestLeave.created_at,
        icon: latestLeave.status === 'approved' ? CheckCircleIcon : latestLeave.status === 'rejected' ? XCircleIcon : DocumentTextIcon,
        iconClass: latestLeave.status === 'approved' ? 'text-emerald-600' : latestLeave.status === 'rejected' ? 'text-red-600' : 'text-brand-600',
        chipClass: latestLeave.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : latestLeave.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-700',
      });
    }

    const latestGuest = latestByCategory(guests.data || []);
    if (latestGuest) {
      recentActions.push({
        id: `guest-${latestGuest.request_id}`,
        title: latestGuest.status === 'approved' ? 'Guest request approved' : latestGuest.status === 'rejected' ? 'Guest request rejected' : 'Guest request submitted',
        detail: latestGuest.status === 'approved'
          ? latestGuest.approved_by_name
            ? `Guest ${latestGuest.guest_name} approved by ${latestGuest.approved_by_name}`
            : `Guest ${latestGuest.guest_name} approved`
          : latestGuest.status === 'rejected'
            ? `Guest ${latestGuest.guest_name} was not approved`
            : `Guest ${latestGuest.guest_name} added for ${latestGuest.visit_type === 'overnight' ? 'overnight stay' : 'normal visit'}`,
        timestamp: latestGuest.status === 'approved' || latestGuest.status === 'rejected' ? latestGuest.updated_at : latestGuest.created_at,
        icon: latestGuest.status === 'approved' ? CheckCircleIcon : latestGuest.status === 'rejected' ? XCircleIcon : UserGroupIcon,
        iconClass: latestGuest.status === 'approved' ? 'text-emerald-600' : latestGuest.status === 'rejected' ? 'text-red-600' : 'text-brand-600',
        chipClass: latestGuest.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : latestGuest.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-700',
      });
    }

    const latestMaintenance = latestByCategory(maintenance.data || []);
    if (latestMaintenance) {
      recentActions.push({
        id: `maintenance-${latestMaintenance.request_id}`,
        title:
          latestMaintenance.status === 'completed'
            ? 'Complaint resolved'
            : latestMaintenance.status === 'assigned' || latestMaintenance.status === 'in_progress'
              ? 'Complaint in progress'
              : 'Complaint filed',
        detail:
          latestMaintenance.status === 'completed'
            ? `Resolved: ${latestMaintenance.issue_type}`
            : latestMaintenance.status === 'assigned' || latestMaintenance.status === 'in_progress'
              ? `Work started on ${latestMaintenance.issue_type}`
              : `Reported issue: ${latestMaintenance.issue_type}`,
        timestamp:
          latestMaintenance.status === 'completed'
            ? latestMaintenance.actual_completion || latestMaintenance.updated_at
            : latestMaintenance.updated_at || latestMaintenance.created_at,
        icon:
          latestMaintenance.status === 'completed'
            ? CheckCircleIcon
            : latestMaintenance.status === 'assigned' || latestMaintenance.status === 'in_progress'
              ? ClockIcon
              : WrenchScrewdriverIcon,
        iconClass:
          latestMaintenance.status === 'completed'
            ? 'text-emerald-600'
            : latestMaintenance.status === 'assigned' || latestMaintenance.status === 'in_progress'
              ? 'text-brand-600'
              : 'text-amber-600',
        chipClass:
          latestMaintenance.status === 'completed'
            ? 'bg-emerald-50 text-emerald-700'
            : latestMaintenance.status === 'assigned' || latestMaintenance.status === 'in_progress'
              ? 'bg-brand-50 text-brand-700'
              : 'bg-amber-50 text-amber-700',
      });
    }

    const actions = recentActions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 4);

    // Match OverviewStats "Pending Requests": leave + guest + maintenance (queued pending only).
    const pendingRequestsCount =
      (leaves.data || []).filter(item => statusMatches(item.status, 'pending')).length +
      (guests.data || []).filter(item => statusMatches(item.status, 'pending')).length +
      (maintenance.data || []).filter(item => statusMatches(item.status, 'pending')).length;

    const maintenanceInProgressCount = (maintenance.data || []).filter(
      item => statusMatches(item.status, 'assigned') || statusMatches(item.status, 'in_progress')
    ).length;

    const smartLine =
      pendingRequestsCount > 0
        ? pendingRequestsCount === 1
          ? 'You have 1 pending request'
          : `You have ${pendingRequestsCount} pending requests`
        : maintenanceInProgressCount > 0
          ? maintenanceInProgressCount === 1
            ? 'You have 1 complaint in progress'
            : `You have ${maintenanceInProgressCount} complaints in progress`
          : 'All requests are cleared';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingItems = [
      ...(leaves.data || [])
        .filter(item => item.end_date && new Date(item.end_date) >= today && item.status !== 'rejected')
        .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
        .slice(0, 1)
        .map(item => ({
          id: `upcoming-leave-${item.absence_id}`,
          title: 'Leave ends soon',
          detail: `${formatDate(item.end_date)}${item.reason ? ` - ${item.reason.split('\n')[0].trim()}` : ''}`,
          timestamp: item.end_date,
          icon: CalendarDaysIcon,
          iconClass: 'text-blue-600',
          chipClass: 'bg-blue-50 text-blue-700',
        })),
      ...(guests.data || [])
        .filter(item => item.start_date && new Date(item.start_date) >= today && item.status !== 'rejected')
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
        .slice(0, 1)
        .map(item => ({
          id: `upcoming-guest-${item.request_id}`,
          title: 'Guest visit scheduled',
          detail: `${item.guest_name} on ${formatDate(item.start_date)}`,
          timestamp: item.start_date,
          icon: UserGroupIcon,
          iconClass: 'text-emerald-600',
          chipClass: 'bg-emerald-50 text-emerald-700',
        })),
      ...(maintenance.data || [])
        .filter(item => item.estimated_completion)
        .sort(
          (a, b) =>
            new Date(a.estimated_completion || a.updated_at).getTime() -
            new Date(b.estimated_completion || b.updated_at).getTime()
        )
        .slice(0, 1)
        .map(item => ({
          id: `upcoming-maintenance-${item.request_id}`,
          title: 'Maintenance follow-up',
          detail: `${item.issue_type} by ${formatDate(item.estimated_completion as string)}`,
          timestamp: item.estimated_completion as string,
          icon: WrenchScrewdriverIcon,
          iconClass: 'text-amber-600',
          chipClass: 'bg-amber-50 text-amber-700',
        })),
    ].slice(0, 3);

    return { actions, upcomingItems, smartLine };
  }, [guests.data, leaves.data, maintenance.data]);

  return (
    <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Your Recent Actions</h2>
          <p className="text-sm text-slate-500 mt-1">Latest updates and what is coming next</p>
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:gap-3 lg:w-auto lg:shrink-0">
          <div className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-surface-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200">
            <BellAlertIcon className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
            <span className="truncate">{summary.smartLine}</span>
          </div>
          <Link
            to="/student/request-history"
            className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-cyan-300/80 hover:bg-cyan-50/70 hover:text-cyan-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500/40 dark:hover:bg-cyan-950/35 dark:hover:text-cyan-100"
          >
            <ClipboardDocumentListIcon className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" aria-hidden />
            Request history
            <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-surface-200 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800">Recent Actions</h3>
            {summary.actions.length > 0 ? (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {summary.actions.length} {summary.actions.length === 1 ? 'item' : 'items'}
              </span>
            ) : null}
          </div>

          {summary.actions.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No recent actions yet.</p>
          ) : (
            <div className="space-y-2">
              {summary.actions.map(item => (
                <div key={item.id} className="flex items-start gap-3 rounded-xl bg-white p-3 border border-surface-100">
                  <div className={`w-10 h-10 rounded-xl ${item.chipClass} flex items-center justify-center shrink-0`}>
                    <item.icon className={`h-5 w-5 ${item.iconClass}`} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                      <ChevronRightIcon className="h-4 w-4 text-slate-300 shrink-0" />
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5 line-clamp-1">{item.detail}</p>
                    <time dateTime={item.timestamp} className="text-xs text-slate-400 mt-1 block">
                      {formatRelativeTime(item.timestamp)}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-surface-200 bg-white p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-800">Upcoming</h3>
          </div>

          {summary.upcomingItems.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No upcoming events</p>
          ) : (
            <div className="space-y-2">
              {summary.upcomingItems.map(item => (
                <div key={item.id} className="rounded-xl border border-surface-100 bg-slate-50/70 p-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${item.chipClass} flex items-center justify-center shrink-0`}>
                      <item.icon className={`h-4 w-4 ${item.iconClass}`} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
