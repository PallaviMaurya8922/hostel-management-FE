import React, { useState } from 'react';
import Card from '../Card';
import Badge from '../Badge';
import Button from '../Button';
import Modal from '../Modal';
import Textarea from '../Textarea';
import {
  CalendarIcon,
  UserIcon,
  HomeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { formatRelativeTime, formatDateRange } from '../../utils/dateUtils';
import type { UnifiedRequest } from '../../utils/filterRequests';
import { getUnifiedRequestStatusDisplay } from '../../utils/maintenanceStatusDisplay';

/**
 * Warden Request Card Component
 * Displays individual request information with expandable details
 *
 * Features:
 * - Student name and room number
 * - Request type icon and brief description
 * - Submission date and time
 * - Status badge (Green=approved, Yellow=pending, Red=rejected)
 * - Expandable section for full details
 * - Action buttons: Approve, Reject, View Details
 * - Approval confirmation modal
 * - Rejection modal with reason textarea
 *
 * Performance: Memoized to prevent unnecessary re-renders (Task 20.3)
 *
 * Requirements: 12.1
 * Design: Warden Dashboard - Request Card (design.md)
 */

export interface WardenRequestCardProps {
  request: UnifiedRequest;
  onApprove?: (requestId: string, requestType: string) => Promise<void>;
  onReject?: (requestId: string, requestType: string, reason: string) => Promise<void>;
}

const WardenRequestCard: React.FC<WardenRequestCardProps> = React.memo(({
  request,
  onApprove,
  onReject,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get request type icon and label
  const getRequestTypeInfo = () => {
    switch (request.requestType) {
      case 'leave':
        return {
          icon: <CalendarIcon className="w-5 h-5 text-blue-600" />,
          label: 'Leave Request',
          labelClass: 'text-blue-700',
        };
      case 'guest':
        return {
          icon: <UserIcon className="w-5 h-5 text-purple-600" />,
          label: 'Guest Request',
          labelClass: 'text-indigo-700',
        };
      case 'maintenance':
        return {
          icon: <HomeIcon className="w-5 h-5 text-orange-600" />,
          label: 'Maintenance Request',
          labelClass: 'text-amber-700',
        };
    }
  };

  // Get brief description based on request type
  const getBriefDescription = () => {
    if (request.requestType === 'leave') {
      const leaveReq = request as UnifiedRequest & {
        start_date: string;
        end_date: string;
      };
      return `Leave: ${formatDateRange(leaveReq.start_date, leaveReq.end_date)}`;
    }

    if (request.requestType === 'guest') {
      const guestReq = request as UnifiedRequest & { duration_days: number };
      return `Guest: ${guestReq.duration_days} ${guestReq.duration_days === 1 ? 'night' : 'nights'}`;
    }

    if (request.requestType === 'maintenance') {
      const maintReq = request as UnifiedRequest & { issue_type: string };
      return `Maintenance: ${maintReq.issue_type}`;
    }

    return 'Request';
  };

  // Get student name and room
  const getStudentInfo = () => {
    const name = 'student_name' in request ? request.student_name : 'Unknown';
    const room =
      'student_room' in request
        ? request.student_room
        : 'room_number' in request
          ? request.room_number
          : 'N/A';
    return { name, room };
  };

  // Get request ID
  const getRequestId = () => {
    if ('absence_id' in request) return request.absence_id;
    if ('request_id' in request) return request.request_id;
    return '';
  };

  const typeInfo = getRequestTypeInfo();
  const studentInfo = getStudentInfo();
  const requestId = getRequestId();
  const statusDisplay = getUnifiedRequestStatusDisplay(request);
  const requiresParentApproval =
    request.requestType === 'leave' &&
    'parent_approval' in request &&
    request.parent_approval !== true;
  const isNormalGuestVisit =
    request.requestType === 'guest' &&
    'visit_type' in request &&
    request.visit_type === 'normal';
  const canModerateRequest =
    request.status === 'pending' &&
    !requiresParentApproval &&
    !isNormalGuestVisit;
  const isPending = request.status === 'pending';

  const getParentApprovalLabel = () => {
    if (request.requestType !== 'leave' || !('parent_approval' in request)) {
      return null;
    }

    if (request.parent_approval === null) {
      return '⏳ Waiting for Parent';
    }

    return request.parent_approval ? '✅ Parent Approved' : '❌ Parent Rejected';
  };

  // Handle approve action
  const handleApprove = async () => {
    if (!onApprove) return;
    
    setIsLoading(true);
    try {
      await onApprove(requestId, request.requestType);
      setShowApproveModal(false);
    } catch (error) {
      // Error is handled by API client with toast
      console.error('Approval failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reject action
  const handleReject = async () => {
    // Validate rejection reason
    if (rejectionReason.trim().length < 10) {
      setRejectionError('Rejection reason must be at least 10 characters');
      return;
    }

    if (!onReject) return;

    setIsLoading(true);
    try {
      await onReject(requestId, request.requestType, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
      setRejectionError('');
    } catch (error) {
      // Error is handled by API client with toast
      console.error('Rejection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle rejection modal close
  const handleRejectModalClose = () => {
    setShowRejectModal(false);
    setRejectionReason('');
    setRejectionError('');
  };

  return (
    <Card
      variant="interactive"
      className={`hover:shadow-glass transition-all ${
        isPending
          ? 'border-l-[3px] border-l-amber-400 bg-amber-50/20'
          : ''
      }`}
    >
      {/* Card Header - Always Visible */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Icon + Info */}
        <div className="flex items-start gap-3 flex-1">
          {/* Request Type Icon */}
          <div className="flex-shrink-0 mt-1">{typeInfo.icon}</div>

          {/* Request Info */}
          <div className="flex-1 min-w-0">
            {/* Student Name and Room */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-gray-900 truncate">
                {studentInfo.name}
              </h3>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-xs text-gray-500">
                Room {studentInfo.room}
              </span>
            </div>

            {/* Request Type and Description */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-sm font-medium ${typeInfo.labelClass}`}
              >
                {typeInfo.label}
              </span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-700">
                {getBriefDescription()}
              </span>
            </div>

            {/* Submission Date */}
            <div className="text-xs text-gray-500">
              Submitted {formatRelativeTime(request.created_at)}
            </div>
          </div>
        </div>

        {/* Right: Status Badge */}
        <div className="flex-shrink-0">
          <Badge variant={statusDisplay.variant} size="small">
            {statusDisplay.label}
          </Badge>
        </div>
      </div>

      {/* Expandable Details Section */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {/* Leave Request Details */}
          {request.requestType === 'leave' && (
            <div className="space-y-3 text-sm">
              {'student_number' in request && request.student_number && (
                <div>
                  <span className="text-gray-500">Student Number:</span>{' '}
                  <span className="font-medium text-gray-900">{request.student_number}</span>
                </div>
              )}
              {'student_contact' in request && request.student_contact && (
                <div>
                  <span className="text-gray-500">Student Contact:</span>{' '}
                  <span className="font-medium text-gray-900">{request.student_contact}</span>
                </div>
              )}
              {'reason' in request && (
                <div>
                  <span className="text-gray-500">Reason:</span>{' '}
                  <span className="font-medium text-gray-900">{request.reason}</span>
                </div>
              )}
              {'emergency_contact' in request && (
                <div>
                  <span className="text-gray-500">
                    Emergency Contact:
                  </span>{' '}
                  <span className="font-medium text-gray-900">
                    {request.emergency_contact}
                  </span>
                </div>
              )}
              {'duration_days' in request && (
                <div>
                  <span className="text-gray-500">Duration:</span>{' '}
                  <span className="font-medium text-gray-900">
                    {request.duration_days} days
                  </span>
                </div>
              )}
              {'parent_approval' in request && (
                <div>
                  <span className="text-gray-500">Parent Approval:</span>{' '}
                  <span
                    className={`font-medium ${
                      request.parent_approval === true
                        ? 'text-green-600'
                        : request.parent_approval === false
                          ? 'text-red-600'
                          : 'text-amber-600'
                    }`}
                  >
                    {getParentApprovalLabel()}
                  </span>
                </div>
              )}
              {'auto_approved' in request && request.auto_approved && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                  Auto-approved (≤2 days)
                </div>
              )}
            </div>
          )}

          {/* Guest Request Details */}
          {request.requestType === 'guest' && (
            <div className="space-y-3 text-sm">
              {'student_contact' in request && request.student_contact && (
                <div>
                  <span className="text-gray-500">Student Contact:</span>{' '}
                  <span className="font-medium text-gray-900">{request.student_contact}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Guest Name:</span>{' '}
                <span className="font-medium text-gray-900">
                  {'guest_name' in request ? request.guest_name : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Guest Phone:</span>{' '}
                <span className="font-medium text-gray-900">
                  {'guest_phone' in request ? request.guest_phone : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Relationship:</span>{' '}
                <span className="font-medium text-gray-900">
                  {'relationship_display' in request
                    ? request.relationship_display
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Visit Type:</span>{' '}
                <span className="font-medium text-gray-900">
                  {'visit_type' in request
                    ? request.visit_type === 'overnight'
                      ? 'Overnight'
                      : 'Normal (Auto-approved)'
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Purpose:</span>{' '}
                <span className="font-medium text-gray-900">
                  {'purpose' in request ? request.purpose : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Duration:</span>{' '}
                <span className="font-medium text-gray-900">
                  {'duration_days' in request ? request.duration_days : 0}{' '}
                  nights
                </span>
              </div>
            </div>
          )}

          {/* Maintenance Request Details */}
          {request.requestType === 'maintenance' && (
            <div className="space-y-3 text-sm">
              {'student_contact' in request && request.student_contact && (
                <div>
                  <span className="text-gray-500">Student Contact:</span>{' '}
                  <span className="font-medium text-gray-900">{request.student_contact}</span>
                </div>
              )}
              {'issue_type' in request && (
                <div>
                  <span className="text-gray-500">Issue Type:</span>{' '}
                  <span className="font-medium text-gray-900">{request.issue_type}</span>
                </div>
              )}
              {'description' in request && (
                <div>
                  <span className="text-gray-500">
                    Description:
                  </span>{' '}
                  <span className="font-medium text-gray-900">{request.description}</span>
                </div>
              )}
              {'priority' in request && (
                <div>
                  <span className="text-gray-500">Priority:</span>{' '}
                  <Badge
                    variant={
                      request.priority === 'high'
                        ? 'danger'
                        : request.priority === 'medium'
                          ? 'warning'
                          : 'info'
                    }
                    size="small"
                  >
                    {request.priority}
                  </Badge>
                </div>
              )}
              {'assigned_to_name' in request && request.assigned_to_name && (
                <div>
                  <span className="text-gray-500">
                    Assigned To:
                  </span>{' '}
                  <span className="font-medium text-gray-900">
                    {request.assigned_to_name}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-3 pt-4 border-t border-gray-200">
        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="small"
          className="px-3 py-2 rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-200"
          onClick={() => setIsExpanded(!isExpanded)}
          icon={
            isExpanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )
          }
        >
          {isExpanded ? 'Hide Details' : 'View Details'}
        </Button>

        {/* Approve/Reject Buttons (only for pending requests) */}
        {canModerateRequest && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowRejectModal(true)}
              disabled={isLoading}
            >
              Reject
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={() => setShowApproveModal(true)}
              disabled={isLoading || requiresParentApproval}
            >
              Approve
            </Button>
          </div>
        )}
      </div>

      {request.status === 'pending' && requiresParentApproval && (
        <p className="mt-2 text-xs text-amber-700">
          Warden approval is locked until parent approval is received.
        </p>
      )}

      {isNormalGuestVisit && (
        <p className="mt-2 text-xs text-emerald-700">
          Auto Approved (Normal Visit) - view only.
        </p>
      )}

      {/* Approval Confirmation Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Confirm Approval"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowApproveModal(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              loading={isLoading}
            >
              Approve
            </Button>
          </>
        }
      >
        <p className="text-gray-700">
          Are you sure you want to approve this {typeInfo.label.toLowerCase()}{' '}
          for <span className="font-semibold">{studentInfo.name}</span>?
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {request.requestType === 'guest'
            ? 'This action will approve the overnight guest request and generate a QR for security verification.'
            : 'This action will notify the student and generate a digital pass if applicable.'}
        </p>
      </Modal>

      {/* Rejection Modal with Reason */}
      <Modal
        isOpen={showRejectModal}
        onClose={handleRejectModalClose}
        title="Reject Request"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={handleRejectModalClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={isLoading}
            >
              Reject
            </Button>
          </>
        }
      >
        <p className="text-gray-700 mb-4">
          Please provide a reason for rejecting this {typeInfo.label.toLowerCase()}{' '}
          from <span className="font-semibold">{studentInfo.name}</span>:
        </p>
        <Textarea
          label="Reason for Rejection"
          value={rejectionReason}
          onChange={(e) => {
            setRejectionReason(e.target.value);
            if (rejectionError) setRejectionError('');
          }}
          error={rejectionError}
          required
          placeholder="Enter at least 10 characters explaining why this request is being rejected..."
          rows={4}
        />
      </Modal>
    </Card>
  );
});

// Display name for React DevTools
WardenRequestCard.displayName = 'WardenRequestCard';

export default WardenRequestCard;
