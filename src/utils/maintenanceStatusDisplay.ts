import type { BadgeVariant } from '../components/Badge';
import type { MaintenanceRequest } from '../types';
import type { UnifiedRequest } from './filterRequests';

/** Supports API payloads where `is_overdue` may be omitted. */
type M = {
  status: MaintenanceRequest['status'];
  is_overdue?: boolean;
};

function capitalizeStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Human-readable maintenance status: for `pending`, show only "Pending" (no age text);
 * otherwise show the workflow state (Assigned, In progress, etc.).
 */
export function getMaintenanceStatusLabel(m: M): string {
  if (m.status !== 'pending') {
    return capitalizeStatus(m.status);
  }
  return 'Pending';
}

/** Badge styling aligned with maintenance queue (overdue = danger). */
export function getMaintenanceStatusBadgeVariant(m: M): BadgeVariant {
  if (m.status === 'pending' && m.is_overdue === true) {
    return 'danger';
  }
  if (m.status === 'pending') {
    return 'warning';
  }
  if (m.status === 'completed') {
    return 'success';
  }
  if (m.status === 'cancelled') {
    return 'danger';
  }
  if (m.status === 'assigned' || m.status === 'in_progress') {
    return 'info';
  }
  return 'warning';
}

/** For warden unified rows / any `UnifiedRequest` with `requestType`. */
export function getUnifiedRequestStatusDisplay(request: UnifiedRequest): {
  label: string;
  variant: BadgeVariant;
} {
  if (request.requestType === 'maintenance') {
    const m = request as unknown as M;
    return {
      label: getMaintenanceStatusLabel(m),
      variant: getMaintenanceStatusBadgeVariant(m),
    };
  }
  const s = request.status;
  const label = capitalizeStatus(s);
  let variant: BadgeVariant = 'info';
  if (s === 'approved' || s === 'active' || s === 'completed') variant = 'success';
  else if (s === 'pending' || s === 'assigned' || s === 'in_progress') variant = 'warning';
  else if (s === 'rejected' || s === 'cancelled' || s === 'expired') variant = 'danger';
  return { label, variant };
}
