import type { MaintenanceRequest } from '../types';
import { getMaintenanceStatusLabel } from './maintenanceStatusDisplay';

export function formatStatusFilterLabel(status: string): string {
  return status
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Leave (`AbsenceRecord`) and guest (`GuestRequest`) — same `STATUS_CHOICES` in
 * `backend/core/models.py`: pending, approved, rejected, expired.
 */
const LEAVE_GUEST_BACKEND_STATUS_ORDER = ['pending', 'approved', 'rejected', 'expired'] as const;

export function leaveGuestBackendStatusFilterOptions(): { value: string; label: string }[] {
  return LEAVE_GUEST_BACKEND_STATUS_ORDER.map(value => ({
    value,
    label: formatStatusFilterLabel(value),
  }));
}

/**
 * Maintenance (`MaintenanceRequest.STATUS_CHOICES` in `backend/core/models.py`).
 */
const MAINTENANCE_STATUS_ORDER: MaintenanceRequest['status'][] = [
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
];

export function maintenanceStatusFilterOptions(): { value: string; label: string }[] {
  return MAINTENANCE_STATUS_ORDER.map(status => ({
    value: status,
    label: getMaintenanceStatusLabel({
      status,
      is_overdue: false,
    }),
  }));
}

/** Mixed leave + guest + maintenance queues: every backend status once, stable order. */
export function combinedQueueStatusFilterOptions(): { value: string; label: string }[] {
  const seen = new Set<string>();
  const out: { value: string; label: string }[] = [];
  for (const o of leaveGuestBackendStatusFilterOptions()) {
    if (seen.has(o.value)) continue;
    seen.add(o.value);
    out.push(o);
  }
  for (const o of maintenanceStatusFilterOptions()) {
    if (seen.has(o.value)) continue;
    seen.add(o.value);
    out.push(o);
  }
  return out;
}
