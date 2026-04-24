import React, { useState } from 'react';
import {
  CalendarIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import Badge, { type BadgeVariant } from '../Badge';
import {
  getMaintenanceStatusBadgeVariant,
  getMaintenanceStatusLabel,
} from '../../utils/maintenanceStatusDisplay';
import type {
  LeaveRequest,
  GuestRequest,
  MaintenanceRequest,
  Status,
  MaintenanceStatus,
} from '../../types';

/**
 * RequestCard component for displaying request information
 * Features:
 * - Request type icon (using Heroicons)
 * - Brief description
 * - Status badge (Yellow=Pending, Green=Approved, Red=Rejected)
 * - Submission date (relative time)
 * - Expandable to show full details
 * - Hover effect for interactive feedback
 *
 * Requirements: 6.2, 4.4, 4.8, 7.8
 */

type RequestType = 'leave' | 'guest' | 'maintenance';

export interface RequestCardProps {
  type: RequestType;
  request: LeaveRequest | GuestRequest | MaintenanceRequest;
  className?: string;
}

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60)
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24)
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

  // For older dates, show the actual date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper function to get status badge variant
const getStatusBadgeVariant = (
  status: Status | MaintenanceStatus
): BadgeVariant => {
  switch (status) {
    case 'approved':
    case 'active':
    case 'completed':
      return 'success';
    case 'pending':
    case 'assigned':
    case 'in_progress':
      return 'warning';
    case 'rejected':
    case 'cancelled':
    case 'expired':
      return 'danger';
    default:
      return 'info';
  }
};

// Helper function to format status text
const formatStatus = (status: Status | MaintenanceStatus): string => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to get brief description
const getBriefDescription = (
  type: RequestType,
  request: LeaveRequest | GuestRequest | MaintenanceRequest
): string => {
  switch (type) {
    case 'leave': {
      const leaveReq = request as LeaveRequest;
      const startDate = new Date(leaveReq.start_date).toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
        }
      );
      const endDate = new Date(leaveReq.end_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `Leave: ${startDate} - ${endDate}`;
    }
    case 'guest': {
      const guestReq = request as GuestRequest;
      return `Guest: ${guestReq.guest_name}`;
    }
    case 'maintenance': {
      const maintenanceReq = request as MaintenanceRequest;
      return `${maintenanceReq.issue_type}: ${maintenanceReq.description.substring(0, 50)}${maintenanceReq.description.length > 50 ? '...' : ''}`;
    }
  }
};

// Helper function to get request icon
const getRequestIcon = (type: RequestType): React.ReactNode => {
  const iconClass = 'h-4 w-4 text-slate-500';
  switch (type) {
    case 'leave':
      return <CalendarIcon className={iconClass} />;
    case 'guest':
      return <UserIcon className={iconClass} />;
    case 'maintenance':
      return <WrenchScrewdriverIcon className={iconClass} />;
  }
};

// Helper function to get full details
const getFullDetails = (
  type: RequestType,
  request: LeaveRequest | GuestRequest | MaintenanceRequest
): React.ReactNode => {
  switch (type) {
    case 'leave': {
      const leaveReq = request as LeaveRequest;
      return (
        <div className="space-y-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">Duration:</span>{' '}
            {leaveReq.duration_days} days
          </div>
          <div>
            <span className="font-medium">Reason:</span> {leaveReq.reason}
          </div>
          <div>
            <span className="font-medium">Emergency Contact:</span>{' '}
            {leaveReq.emergency_contact}
          </div>
          {leaveReq.auto_approved && (
            <div>
              <span className="font-medium">Auto-approved:</span> Yes (short
              leave)
            </div>
          )}
          {leaveReq.approval_reason && (
            <div>
              <span className="font-medium">Approval Reason:</span>{' '}
              {leaveReq.approval_reason}
            </div>
          )}
        </div>
      );
    }
    case 'guest': {
      const guestReq = request as GuestRequest;
      return (
        <div className="space-y-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">Guest Name:</span>{' '}
            {guestReq.guest_name}
          </div>
          <div>
            <span className="font-medium">Phone:</span> {guestReq.guest_phone}
          </div>
          {guestReq.relationship_display && (
            <div>
              <span className="font-medium">Relationship:</span>{' '}
              {guestReq.relationship_display}
            </div>
          )}
          <div>
            <span className="font-medium">Duration:</span>{' '}
            {guestReq.duration_days} days
          </div>
          <div>
            <span className="font-medium">Purpose:</span> {guestReq.purpose}
          </div>
          <div>
            <span className="font-medium">Dates:</span>{' '}
            {new Date(guestReq.start_date).toLocaleDateString()} -{' '}
            {new Date(guestReq.end_date).toLocaleDateString()}
          </div>
        </div>
      );
    }
    case 'maintenance': {
      const maintenanceReq = request as MaintenanceRequest;
      return (
        <div className="space-y-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">Issue Type:</span>{' '}
            {maintenanceReq.issue_type}
          </div>
          <div>
            <span className="font-medium">Description:</span>{' '}
            {maintenanceReq.description}
          </div>
          <div>
            <span className="font-medium">Priority:</span>{' '}
            <span
              className={`capitalize ${
                maintenanceReq.priority === 'high'
                  ? 'text-red-600 font-semibold'
                  : maintenanceReq.priority === 'medium'
                    ? 'text-yellow-600'
                    : 'text-gray-600'
              }`}
            >
              {maintenanceReq.priority}
            </span>
          </div>
          {maintenanceReq.assigned_to_name && (
            <div>
              <span className="font-medium">Assigned To:</span>{' '}
              {maintenanceReq.assigned_to_name}
            </div>
          )}
          {maintenanceReq.estimated_completion && (
            <div>
              <span className="font-medium">Estimated Completion:</span>{' '}
              {new Date(
                maintenanceReq.estimated_completion
              ).toLocaleDateString()}
            </div>
          )}
          {maintenanceReq.notes && (
            <div>
              <span className="font-medium">Notes:</span> {maintenanceReq.notes}
            </div>
          )}
        </div>
      );
    }
  }
};

const RequestCard: React.FC<RequestCardProps> = React.memo(
  ({ type, request, className = '' }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const briefDescription = getBriefDescription(type, request);
    const icon = getRequestIcon(type);
    const status = request.status;
    const badgeVariant =
      type === 'maintenance'
        ? getMaintenanceStatusBadgeVariant(request as MaintenanceRequest)
        : getStatusBadgeVariant(status);
    const statusLabel =
      type === 'maintenance'
        ? getMaintenanceStatusLabel(request as MaintenanceRequest)
        : formatStatus(status);
    const relativeTime = formatRelativeTime(request.created_at);
    const fullDetails = getFullDetails(type, request);

    return (
      <div
        className={`bg-white border border-surface-200/80 rounded-xl p-4 transition-all duration-200 hover:shadow-glass cursor-pointer ${className}`}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">{icon}</div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {briefDescription}
                </p>
              </div>
              <p className="text-xs text-slate-400">{relativeTime}</p>
            </div>
          </div>

          {/* Status Badge and Expand Icon */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={badgeVariant} size="small">
              {statusLabel}
            </Badge>
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-surface-200">
            {fullDetails}
          </div>
        )}
      </div>
    );
  }
);

RequestCard.displayName = 'RequestCard';

export default RequestCard;
