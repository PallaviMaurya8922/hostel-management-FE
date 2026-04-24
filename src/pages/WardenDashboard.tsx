import React, { useEffect, useMemo, useCallback, useState, Fragment } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppShell from '../components/AppShell';
import FilterControls from '../components/warden/FilterControls';
import Skeleton from '../components/Skeleton';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import {
  RecentActivityPanel,
  type RecentActivityItem,
} from '../components/dashboard/RecentActivity';
import { useToast } from '../contexts';
import { useAllRequests } from '../hooks';
import { useFilterState } from '../hooks/useFilterState';
import { unifyRequests, applyFilters, type UnifiedRequest } from '../utils/filterRequests';
import {
  createStudentAccount,
  getWardenDashboardStats,
  type CreateStudentData,
} from '../api/warden';
import {
  ShieldCheckIcon,
  UserPlusIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import QueuePaginationBar from '../components/QueuePaginationBar';
import { formatDateRange, formatRelativeTime, toLocalDateInputKey } from '../utils/dateUtils';
import {
  approveLeaveRequest,
  rejectLeaveRequest,
  approveGuestRequest,
  rejectGuestRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
} from '../api/requests';
import type { LeaveRequest, GuestRequest, MaintenanceRequest } from '../types';
import { getUnifiedRequestStatusDisplay } from '../utils/maintenanceStatusDisplay';
import {
  combinedQueueStatusFilterOptions,
  leaveGuestBackendStatusFilterOptions,
  maintenanceStatusFilterOptions,
} from '../utils/requestStatusFilterOptions';
import {
  getWardenQueueColumns,
  type WardenQueueHeaderProps,
  type WardenRequestTypeTab,
  type SubmittedDateSortMode,
} from '../config/requestQueueTableColumns';

/**
 * Warden Dashboard Page
 * Main entry point for wardens to review and approve student requests
 *
 * Layout Structure:
 * - AppShell (sidebar, top bar, page title)
 * - Filters & Search section (Task 17 - IMPLEMENTED)
 * - Pending Requests list (to be implemented in Task 18-20)
 *
 * Features:
 * - Filter by request type (All, Leave, Guest, Maintenance)
 * - Filter by date range (Today, This Week, This Month, All Time)
 * - Search by student name or room number (debounced 300ms)
 * - URL query parameters for filter persistence
 * - Clear Filters button to reset all filters
 *
 * Requirements: 12.1, 12.2, 12.4
 * Design: Warden Dashboard Layout Structure (design.md)
 */

const WardenDashboard: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { filters, updateFilters } = useFilterState();
  const { leaves, guests, maintenance, isLoading } = useAllRequests();
  const [isRefetching, setIsRefetching] = useState(false);
  const [queuePage, setQueuePage] = useState(1);
  const [queuePageSize, setQueuePageSize] = useState(10);
  /** Submitted column: default queue order → oldest first → newest first → default. */
  const [submittedDateSort, setSubmittedDateSort] = useState<SubmittedDateSortMode>('none');
  const [selectedRequest, setSelectedRequest] = useState<UnifiedRequest | null>(null);
  /** Table header filters (separate from toolbar FilterControls); reset when toolbar filters change. */
  const [wardenAllStudent, setWardenAllStudent] = useState('');
  const [wardenAllType, setWardenAllType] = useState('');
  const [wardenAllDetails, setWardenAllDetails] = useState('');
  const [wardenAllSubmitted, setWardenAllSubmitted] = useState('');
  const [wardenAllStatus, setWardenAllStatus] = useState('');
  const [wardenLeaveStudent, setWardenLeaveStudent] = useState('');
  const [wardenLeaveReason, setWardenLeaveReason] = useState('');
  const [wardenLeaveSubmitted, setWardenLeaveSubmitted] = useState('');
  const [wardenLeaveStatus, setWardenLeaveStatus] = useState('');
  const [wardenGuestStudent, setWardenGuestStudent] = useState('');
  const [wardenGuestSearch, setWardenGuestSearch] = useState('');
  const [wardenGuestSubmitted, setWardenGuestSubmitted] = useState('');
  const [wardenGuestStatus, setWardenGuestStatus] = useState('');
  const [wardenMaintStudent, setWardenMaintStudent] = useState('');
  const [wardenMaintIssue, setWardenMaintIssue] = useState('');
  const [wardenMaintSubmitted, setWardenMaintSubmitted] = useState('');
  const [wardenMaintStatus, setWardenMaintStatus] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [decisionError, setDecisionError] = useState('');
  const [isActingOnRequest, setIsActingOnRequest] = useState(false);
  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [latestCredentials, setLatestCredentials] = useState<{
    studentId: string;
    defaultPassword: string;
  } | null>(null);
  const [studentFormData, setStudentFormData] = useState<CreateStudentData>({
    student_id: '',
    name: '',
    email: '',
    room_number: '',
    block: '',
    phone: '',
    parent_phone: '',
  });
  const [studentFormErrors, setStudentFormErrors] = useState<
    Partial<Record<keyof CreateStudentData, string>>
  >({});

  const { data: dashboardStats } = useQuery({
    queryKey: ['warden-dashboard-stats'],
    queryFn: getWardenDashboardStats,
    staleTime: 1000 * 30,
  });

  const validateStudentForm = useCallback((data: CreateStudentData) => {
    const errors: Partial<Record<keyof CreateStudentData, string>> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = data.phone.replace(/\D/g, '');
    const parentPhoneRaw = data.parent_phone.trim();
    const parentPhoneDigits = parentPhoneRaw.replace(/\D/g, '');

    if (!data.student_id.trim()) {
      errors.student_id = 'Student ID is required';
    }

    if (!data.name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (!data.room_number.trim()) {
      errors.room_number = 'Room number is required';
    }

    if (!data.block.trim()) {
      errors.block = 'Block is required';
    }

    if (!data.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (phoneDigits.length !== 10) {
      errors.phone = 'Enter a valid 10-digit phone number';
    }

    if (!data.parent_phone.trim()) {
      errors.parent_phone = 'Parent contact number is required';
    } else if (parentPhoneRaw.startsWith('+')) {
      errors.parent_phone = 'Enter country code without + (example: 919876543210)';
    } else if (!/^\d{12}$/.test(parentPhoneDigits)) {
      errors.parent_phone = 'Enter a valid 12-digit parent number with country code';
    }

    return errors;
  }, []);

  const filteredRequests = useMemo(() => {
    if (!leaves.data || !guests.data || !maintenance.data) {
      return [];
    }

    const unified = unifyRequests(leaves.data, guests.data, maintenance.data);

    return applyFilters(unified, filters);
  }, [leaves.data, guests.data, maintenance.data, filters]);

  const wardenRequestTypeTab: WardenRequestTypeTab =
    filters.requestType === 'leave' ||
    filters.requestType === 'guest' ||
    filters.requestType === 'maintenance'
      ? filters.requestType
      : 'all';

  const matchesWardenStudentHeader = (r: UnifiedRequest, q: string) => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) return true;
    const name = (r.student_name || '').toLowerCase();
    const room =
      r.requestType === 'maintenance'
        ? (r as MaintenanceRequest).room_number.toLowerCase()
        : ((r as LeaveRequest | GuestRequest).student_room || '').toLowerCase();
    return name.includes(trimmed) || room.includes(trimmed);
  };

  const queueRowsAfterNonStatusFilters = useMemo(() => {
    return filteredRequests.filter(r => {
      if (wardenRequestTypeTab === 'all') {
        if (wardenAllType && r.requestType !== wardenAllType) return false;
        if (!matchesWardenStudentHeader(r, wardenAllStudent)) return false;
        const dq = wardenAllDetails.trim().toLowerCase();
        if (dq) {
          let blob = '';
          if (r.requestType === 'leave') {
            blob = ((r as LeaveRequest).reason || '').toLowerCase();
          } else if (r.requestType === 'guest') {
            const g = r as GuestRequest;
            blob = `${g.guest_name} ${g.purpose}`.toLowerCase();
          } else {
            const m = r as MaintenanceRequest;
            blob = `${m.issue_type} ${m.description} ${m.room_number}`.toLowerCase();
          }
          if (!blob.includes(dq)) return false;
        }
        if (wardenAllSubmitted && toLocalDateInputKey(r.created_at) !== wardenAllSubmitted) return false;
        return true;
      }
      if (wardenRequestTypeTab === 'leave') {
        if (!matchesWardenStudentHeader(r, wardenLeaveStudent)) return false;
        const rq = wardenLeaveReason.trim().toLowerCase();
        if (rq && !(r as LeaveRequest).reason.toLowerCase().includes(rq)) return false;
        if (wardenLeaveSubmitted && toLocalDateInputKey(r.created_at) !== wardenLeaveSubmitted) return false;
        return true;
      }
      if (wardenRequestTypeTab === 'guest') {
        if (!matchesWardenStudentHeader(r, wardenGuestStudent)) return false;
        const sq = wardenGuestSearch.trim().toLowerCase();
        if (sq) {
          const g = r as GuestRequest;
          if (!`${g.guest_name} ${g.purpose}`.toLowerCase().includes(sq)) return false;
        }
        if (wardenGuestSubmitted && toLocalDateInputKey(r.created_at) !== wardenGuestSubmitted) return false;
        return true;
      }
      if (!matchesWardenStudentHeader(r, wardenMaintStudent)) return false;
      const iq = wardenMaintIssue.trim().toLowerCase();
      if (iq) {
        const m = r as MaintenanceRequest;
        if (!`${m.issue_type} ${m.description} ${m.room_number}`.toLowerCase().includes(iq)) return false;
      }
      if (wardenMaintSubmitted && toLocalDateInputKey(r.created_at) !== wardenMaintSubmitted) return false;
      return true;
    });
  }, [
    filteredRequests,
    wardenRequestTypeTab,
    wardenAllType,
    wardenAllStudent,
    wardenAllDetails,
    wardenAllSubmitted,
    wardenLeaveStudent,
    wardenLeaveReason,
    wardenLeaveSubmitted,
    wardenGuestStudent,
    wardenGuestSearch,
    wardenGuestSubmitted,
    wardenMaintStudent,
    wardenMaintIssue,
    wardenMaintSubmitted,
  ]);

  const queueStatusDropdownOptions = useMemo(() => {
    if (wardenRequestTypeTab === 'leave' || wardenRequestTypeTab === 'guest') {
      return leaveGuestBackendStatusFilterOptions();
    }
    if (wardenRequestTypeTab === 'maintenance') {
      return maintenanceStatusFilterOptions();
    }
    return combinedQueueStatusFilterOptions();
  }, [wardenRequestTypeTab]);

  const queueRowsAfterHeaderFilters = useMemo(() => {
    if (wardenRequestTypeTab === 'all') {
      if (!wardenAllStatus) return queueRowsAfterNonStatusFilters;
      return queueRowsAfterNonStatusFilters.filter(r => r.status === wardenAllStatus);
    }
    if (wardenRequestTypeTab === 'leave') {
      if (!wardenLeaveStatus) return queueRowsAfterNonStatusFilters;
      return queueRowsAfterNonStatusFilters.filter(r => r.status === wardenLeaveStatus);
    }
    if (wardenRequestTypeTab === 'guest') {
      if (!wardenGuestStatus) return queueRowsAfterNonStatusFilters;
      return queueRowsAfterNonStatusFilters.filter(r => r.status === wardenGuestStatus);
    }
    if (!wardenMaintStatus) return queueRowsAfterNonStatusFilters;
    return queueRowsAfterNonStatusFilters.filter(r => r.status === wardenMaintStatus);
  }, [
    queueRowsAfterNonStatusFilters,
    wardenRequestTypeTab,
    wardenAllStatus,
    wardenLeaveStatus,
    wardenGuestStatus,
    wardenMaintStatus,
  ]);

  const orderedFilteredRequests = useMemo(() => {
    if (submittedDateSort === 'none') {
      return queueRowsAfterHeaderFilters;
    }
    const copy = [...queueRowsAfterHeaderFilters];
    const mult = submittedDateSort === 'asc' ? 1 : -1;
    copy.sort(
      (a, b) =>
        (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * mult
    );
    return copy;
  }, [queueRowsAfterHeaderFilters, submittedDateSort]);

  const wardenAllTypeOptions = useMemo(() => {
    if (wardenRequestTypeTab !== 'all') return [];
    const s = new Set<string>();
    for (const r of filteredRequests) s.add(r.requestType);
    return Array.from(s)
      .sort()
      .map(value => ({
        value,
        label: value === 'leave' ? 'Leave' : value === 'guest' ? 'Guest' : 'Maintenance',
      }));
  }, [filteredRequests, wardenRequestTypeTab]);

  const cycleQueueSubmittedSort = useCallback(() => {
    setSubmittedDateSort(prev => (prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none'));
  }, []);

  const wardenHeaderProps = useMemo((): WardenQueueHeaderProps => {
    const base = {
      submittedDateSort,
      onCycleSubmittedDateSort: cycleQueueSubmittedSort,
      requestTypeTab: wardenRequestTypeTab,
    };
    if (wardenRequestTypeTab === 'all') {
      return {
        ...base,
        all: {
          studentValue: wardenAllStudent,
          onStudentChange: setWardenAllStudent,
          typeValue: wardenAllType,
          onTypeChange: setWardenAllType,
          typeOptions: wardenAllTypeOptions,
          detailsValue: wardenAllDetails,
          onDetailsChange: setWardenAllDetails,
          submittedDateValue: wardenAllSubmitted,
          onSubmittedDateChange: setWardenAllSubmitted,
          statusValue: wardenAllStatus,
          onStatusChange: setWardenAllStatus,
          statusOptions: queueStatusDropdownOptions,
        },
      };
    }
    if (wardenRequestTypeTab === 'leave') {
      return {
        ...base,
        leave: {
          studentValue: wardenLeaveStudent,
          onStudentChange: setWardenLeaveStudent,
          reasonValue: wardenLeaveReason,
          onReasonChange: setWardenLeaveReason,
          submittedDateValue: wardenLeaveSubmitted,
          onSubmittedDateChange: setWardenLeaveSubmitted,
          statusValue: wardenLeaveStatus,
          onStatusChange: setWardenLeaveStatus,
          statusOptions: queueStatusDropdownOptions,
        },
      };
    }
    if (wardenRequestTypeTab === 'guest') {
      return {
        ...base,
        guest: {
          studentValue: wardenGuestStudent,
          onStudentChange: setWardenGuestStudent,
          searchValue: wardenGuestSearch,
          onSearchChange: setWardenGuestSearch,
          submittedDateValue: wardenGuestSubmitted,
          onSubmittedDateChange: setWardenGuestSubmitted,
          statusValue: wardenGuestStatus,
          onStatusChange: setWardenGuestStatus,
          statusOptions: queueStatusDropdownOptions,
        },
      };
    }
    return {
      ...base,
      maintenance: {
        studentValue: wardenMaintStudent,
        onStudentChange: setWardenMaintStudent,
        issueValue: wardenMaintIssue,
        onIssueChange: setWardenMaintIssue,
        submittedDateValue: wardenMaintSubmitted,
        onSubmittedDateChange: setWardenMaintSubmitted,
        statusValue: wardenMaintStatus,
        onStatusChange: setWardenMaintStatus,
        statusOptions: queueStatusDropdownOptions,
      },
    };
  }, [
    submittedDateSort,
    cycleQueueSubmittedSort,
    wardenRequestTypeTab,
    wardenAllStudent,
    wardenAllType,
    wardenAllTypeOptions,
    wardenAllDetails,
    wardenAllSubmitted,
    wardenAllStatus,
    wardenLeaveStudent,
    wardenLeaveReason,
    wardenLeaveSubmitted,
    wardenLeaveStatus,
    wardenGuestStudent,
    wardenGuestSearch,
    wardenGuestSubmitted,
    wardenGuestStatus,
    wardenMaintStudent,
    wardenMaintIssue,
    wardenMaintSubmitted,
    wardenMaintStatus,
    queueStatusDropdownOptions,
  ]);

  const queueColumns = useMemo(
    () => getWardenQueueColumns(wardenHeaderProps, setSelectedRequest),
    [wardenHeaderProps]
  );

  const queueTotalPages = useMemo(
    () => Math.max(1, Math.ceil(orderedFilteredRequests.length / queuePageSize)),
    [orderedFilteredRequests.length, queuePageSize]
  );

  const clampedQueuePage = Math.min(Math.max(1, queuePage), queueTotalPages);
  const queueOffset = (clampedQueuePage - 1) * queuePageSize;

  const visibleRequests = useMemo(
    () => orderedFilteredRequests.slice(queueOffset, queueOffset + queuePageSize),
    [orderedFilteredRequests, queueOffset, queuePageSize]
  );

  useEffect(() => {
    setQueuePage(1);
  }, [filters, queuePageSize]);

  useEffect(() => {
    setSubmittedDateSort('none');
    setWardenAllStudent('');
    setWardenAllType('');
    setWardenAllDetails('');
    setWardenAllSubmitted('');
    setWardenAllStatus('');
    setWardenLeaveStudent('');
    setWardenLeaveReason('');
    setWardenLeaveSubmitted('');
    setWardenLeaveStatus('');
    setWardenGuestStudent('');
    setWardenGuestSearch('');
    setWardenGuestSubmitted('');
    setWardenGuestStatus('');
    setWardenMaintStudent('');
    setWardenMaintIssue('');
    setWardenMaintSubmitted('');
    setWardenMaintStatus('');
  }, [filters]);

  useEffect(() => {
    const valid = new Set(queueStatusDropdownOptions.map(o => o.value));
    if (wardenRequestTypeTab === 'all' && wardenAllStatus && !valid.has(wardenAllStatus)) {
      setWardenAllStatus('');
    }
    if (wardenRequestTypeTab === 'leave' && wardenLeaveStatus && !valid.has(wardenLeaveStatus)) {
      setWardenLeaveStatus('');
    }
    if (wardenRequestTypeTab === 'guest' && wardenGuestStatus && !valid.has(wardenGuestStatus)) {
      setWardenGuestStatus('');
    }
    if (wardenRequestTypeTab === 'maintenance' && wardenMaintStatus && !valid.has(wardenMaintStatus)) {
      setWardenMaintStatus('');
    }
  }, [
    queueStatusDropdownOptions,
    wardenRequestTypeTab,
    wardenAllStatus,
    wardenLeaveStatus,
    wardenGuestStatus,
    wardenMaintStatus,
  ]);

  useEffect(() => {
    setQueuePage(1);
  }, [submittedDateSort]);

  useEffect(() => {
    setQueuePage(1);
  }, [
    wardenAllStudent,
    wardenAllType,
    wardenAllDetails,
    wardenAllSubmitted,
    wardenAllStatus,
    wardenLeaveStudent,
    wardenLeaveReason,
    wardenLeaveSubmitted,
    wardenLeaveStatus,
    wardenGuestStudent,
    wardenGuestSearch,
    wardenGuestSubmitted,
    wardenGuestStatus,
    wardenMaintStudent,
    wardenMaintIssue,
    wardenMaintSubmitted,
    wardenMaintStatus,
  ]);

  useEffect(() => {
    setQueuePage(p => Math.min(p, queueTotalPages));
  }, [queueTotalPages]);

  const pendingCount = useMemo(
    () =>
      filteredRequests.filter(
        r =>
          r.status === 'pending' ||
          r.status === 'assigned' ||
          r.status === 'in_progress'
      ).length,
    [filteredRequests]
  );

  const leavePending = useMemo(
    () => leaves.data?.filter(req => req.status === 'pending').length || 0,
    [leaves.data]
  );
  const guestPending = useMemo(
    () => guests.data?.filter(req => req.status === 'pending').length || 0,
    [guests.data]
  );
  const maintenanceOpen = useMemo(
    () =>
      maintenance.data?.filter(
        req => req.status === 'pending' || req.status === 'assigned' || req.status === 'in_progress'
      ).length || 0,
    [maintenance.data]
  );

  const todaysVisible = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return filteredRequests.filter(req => new Date(req.created_at) >= today).length;
  }, [filteredRequests]);

  const activeFilterCount = useMemo(() => {
    return (
      Number(filters.requestType !== 'all') +
      Number(filters.dateRange !== 'all') +
      Number(Boolean(filters.searchQuery.trim()))
    );
  }, [filters]);

  const recentActivityItems = useMemo<RecentActivityItem[]>(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const startOfTomorrow = new Date(endOfToday);
    const endOfTomorrow = new Date(startOfTomorrow);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
    const oneDayMs = 24 * 60 * 60 * 1000;

    const leaveRequests = leaves.data || [];
    const guestRequests = guests.data || [];
    const maintenanceRequests = maintenance.data || [];

    const delayedLeaveCount = leaveRequests.filter(item => {
      if (item.status !== 'pending') return false;
      return now.getTime() - new Date(item.created_at).getTime() > oneDayMs;
    }).length;

    const awaitingWardenAfterParent = leaveRequests.filter(
      item => item.status === 'pending' && item.parent_approval === true
    ).length;

    const blockedParentApprovalCount = leaveRequests.filter(
      item => item.status === 'pending' && item.parent_approval !== true
    ).length;

    const tomorrowPendingGuest = guestRequests
      .filter(item => {
        if (item.status !== 'pending') return false;
        const startDate = new Date(item.start_date);
        return startDate >= startOfTomorrow && startDate < endOfTomorrow;
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];

    const studentsReturningToday = leaveRequests.filter(item => {
      if (item.status !== 'approved' && item.status !== 'active') return false;
      const endDate = new Date(item.end_date);
      return endDate >= startOfToday && endDate < endOfToday;
    }).length;

    const leavesStartingTomorrow = leaveRequests.filter(item => {
      if (item.status === 'rejected' || item.status === 'cancelled') return false;
      const startDate = new Date(item.start_date);
      return startDate >= startOfTomorrow && startDate < endOfTomorrow;
    }).length;

    const highPriorityInBlockB = maintenanceRequests
      .filter(item => {
        if (item.priority !== 'high') return false;
        if (item.status === 'completed' || item.status === 'cancelled') return false;
        const room = (item.room_number || '').trim().toUpperCase();
        return room.startsWith('B') || room.includes(' B');
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    const items: RecentActivityItem[] = [];

    if (delayedLeaveCount > 0) {
      items.push({
        id: 'warden-delayed-leaves',
        type: 'leave',
        action: 'submitted',
        description: `${delayedLeaveCount} leave request${delayedLeaveCount > 1 ? 's' : ''} pending for more than 24 hours`,
        timestamp: now.toISOString(),
        icon: ExclamationTriangleIcon,
        iconColor: 'text-red-600',
        bgColor: 'bg-red-50',
      });
    }

    if (awaitingWardenAfterParent > 0) {
      items.push({
        id: 'warden-awaiting-after-parent',
        type: 'leave',
        action: 'submitted',
        description: `${awaitingWardenAfterParent} request${awaitingWardenAfterParent > 1 ? 's' : ''} awaiting your approval after parent approval`,
        timestamp: now.toISOString(),
        icon: ClockIcon,
        iconColor: 'text-amber-600',
        bgColor: 'bg-amber-50',
      });
    }

    if (blockedParentApprovalCount > 0) {
      items.push({
        id: 'warden-blocked-parent-approval',
        type: 'leave',
        action: 'submitted',
        description: `${blockedParentApprovalCount} request${blockedParentApprovalCount > 1 ? 's' : ''} stuck at parent approval stage`,
        timestamp: now.toISOString(),
        icon: ClockIcon,
        iconColor: 'text-amber-600',
        bgColor: 'bg-amber-50',
      });
    }

    if (tomorrowPendingGuest) {
      items.push({
        id: 'warden-guest-pending-tomorrow',
        type: 'guest',
        action: 'submitted',
        description: `Guest request pending for tomorrow (${tomorrowPendingGuest.guest_name})`,
        timestamp: tomorrowPendingGuest.created_at,
        icon: UserGroupIcon,
        iconColor: 'text-brand-600',
        bgColor: 'bg-brand-50',
      });
    }

    if (studentsReturningToday > 0) {
      items.push({
        id: 'warden-students-returning-today',
        type: 'leave',
        action: 'approved',
        description: `${studentsReturningToday} student${studentsReturningToday > 1 ? 's' : ''} returning today`,
        timestamp: startOfToday.toISOString(),
        icon: CalendarDaysIcon,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
      });
    }

    if (leavesStartingTomorrow > 0) {
      items.push({
        id: 'warden-leave-starting-tomorrow',
        type: 'leave',
        action: 'submitted',
        description: `${leavesStartingTomorrow} leave request${leavesStartingTomorrow > 1 ? 's' : ''} starting tomorrow`,
        timestamp: startOfTomorrow.toISOString(),
        icon: CalendarDaysIcon,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
      });
    }

    if (highPriorityInBlockB) {
      items.push({
        id: `warden-high-priority-${highPriorityInBlockB.request_id}`,
        type: 'maintenance',
        action: 'submitted',
        description: `High-priority complaint in Block B (${highPriorityInBlockB.room_number})`,
        timestamp: highPriorityInBlockB.created_at,
        icon: ExclamationTriangleIcon,
        iconColor: 'text-red-600',
        bgColor: 'bg-red-50',
      });
    }

    return items.slice(0, 6);
  }, [leaves.data, guests.data, maintenance.data]);

  const handleApprove = useCallback(async (requestId: string, requestType: string) => {
    try {
      if (requestType === 'leave') {
        await approveLeaveRequest(requestId);
      } else if (requestType === 'guest') {
        await approveGuestRequest(requestId);
      } else if (requestType === 'maintenance') {
        await approveMaintenanceRequest(requestId);
      }

      showToast('Request approved successfully', 'success');

      setIsRefetching(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['leaves'] }),
        queryClient.invalidateQueries({ queryKey: ['guests'] }),
        queryClient.invalidateQueries({ queryKey: ['maintenance'] }),
        queryClient.invalidateQueries({ queryKey: ['warden-dashboard-stats'] }),
      ]);
      setIsRefetching(false);
    } catch (error) {
      console.error('Approval failed:', error);
      setIsRefetching(false);
      throw error;
    }
  }, [queryClient, showToast]);

  // Handle reject action (useCallback for performance - Subtask 20.3)
  const handleReject = useCallback(async (requestId: string, requestType: string, reason: string) => {
    try {
      if (requestType === 'leave') {
        await rejectLeaveRequest(requestId, reason);
      } else if (requestType === 'guest') {
        await rejectGuestRequest(requestId, reason);
      } else if (requestType === 'maintenance') {
        await rejectMaintenanceRequest(requestId, reason);
      }

      showToast('Request rejected successfully', 'success');

      setIsRefetching(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['leaves'] }),
        queryClient.invalidateQueries({ queryKey: ['guests'] }),
        queryClient.invalidateQueries({ queryKey: ['maintenance'] }),
        queryClient.invalidateQueries({ queryKey: ['warden-dashboard-stats'] }),
      ]);
      setIsRefetching(false);
    } catch (error) {
      console.error('Rejection failed:', error);
      setIsRefetching(false);
      throw error;
    }
  }, [queryClient, showToast]);

  const handleStudentFormChange = (field: keyof CreateStudentData, value: string) => {
    setStudentFormData(prev => ({ ...prev, [field]: value }));
    setStudentFormErrors(prev => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedData: CreateStudentData = {
      student_id: studentFormData.student_id.trim().toUpperCase(),
      name: studentFormData.name.trim(),
      email: studentFormData.email.trim(),
      room_number: studentFormData.room_number.trim(),
      block: studentFormData.block.trim().toUpperCase(),
      phone: studentFormData.phone.replace(/\D/g, ''),
      parent_phone: studentFormData.parent_phone.replace(/\D/g, ''),
    };
    const errors = validateStudentForm(cleanedData);

    if (Object.keys(errors).length > 0) {
      setStudentFormErrors(errors);
      showToast('Please fix form errors before submitting', 'error');
      return;
    }

    setIsCreatingStudent(true);

    try {
      const response = await createStudentAccount(cleanedData);
      setLatestCredentials({
        studentId: response.student.student_id,
        defaultPassword: response.student.default_password,
      });
      showToast('Student account created successfully', 'success');
      setStudentFormData({
        student_id: '',
        name: '',
        email: '',
        room_number: '',
        block: '',
        phone: '',
        parent_phone: '',
      });
      setStudentFormErrors({});
      setIsCreateStudentOpen(false);
    } catch {
      showToast('Failed to create student account', 'error');
    } finally {
      setIsCreatingStudent(false);
    }
  };

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['warden-dashboard-stats'] });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [queryClient]);

  useEffect(() => {
    if (!selectedRequest) return;

    const selectedId = getRequestId(selectedRequest);
    const selectedType = selectedRequest.requestType;
    const stillVisible = visibleRequests.find(
      request => getRequestId(request) === selectedId && request.requestType === selectedType
    );

    if (!stillVisible) {
      setSelectedRequest(null);
    }
  }, [visibleRequests, selectedRequest]);

  useEffect(() => {
    setDecisionNote('');
    setDecisionError('');
  }, [selectedRequest]);

  useEffect(() => {
    if (!selectedRequest) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedRequest]);

  const handleApproveSelected = async () => {
    if (!selectedRequest) return;
    setIsActingOnRequest(true);
    try {
      await handleApprove(getRequestId(selectedRequest), selectedRequest.requestType);
      setDecisionNote('');
      setSelectedRequest(null);
    } finally {
      setIsActingOnRequest(false);
    }
  };

  const handleRejectSelected = async () => {
    if (!selectedRequest) return;

    if (decisionNote.trim().length < 10) {
      setDecisionError('Please provide at least 10 characters before rejecting.');
      return;
    }

    setDecisionError('');
    setIsActingOnRequest(true);
    try {
      await handleReject(getRequestId(selectedRequest), selectedRequest.requestType, decisionNote.trim());
      setDecisionNote('');
      setSelectedRequest(null);
    } finally {
      setIsActingOnRequest(false);
    }
  };

  return (
    <>
      <AppShell pageTitle="Warden Operations">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <section className="mb-5 sm:mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Approvals desk</p>
              <p className="text-sm text-slate-500 mt-1">
                Review leave, guest, and maintenance requests in one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-glass-sm">
                <ShieldCheckIcon className="w-4 h-4 text-brand-600" />
                <span>{pendingCount} pending review</span>
              </div>
              <Button onClick={() => setIsCreateStudentOpen(true)} icon={<UserPlusIcon className="w-4 h-4" />}>
                Create Student
              </Button>
            </div>
          </section>

          <section className="mb-5 sm:mb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              title="Leave Requests"
              value={dashboardStats?.pending_absence_requests ?? leavePending}
              badge={`${leavePending} pending`}
              hint={`${leaves.data?.length || 0} total requests`}
              accent="blue"
              icon={<CalendarDaysIcon className="w-5 h-5" />}
            />
            <MetricCard
              title="Active Complaints"
              value={dashboardStats?.pending_maintenance_requests ?? maintenanceOpen}
              badge={`${dashboardStats?.high_priority_maintenance ?? 0} urgent`}
              hint={`${maintenanceOpen} active in maintenance pipeline`}
              accent="amber"
              icon={<WrenchScrewdriverIcon className="w-5 h-5" />}
            />
            <MetricCard
              title="Guest Requests"
              value={dashboardStats?.pending_guest_requests ?? guestPending}
              badge={`${guestPending} pending`}
              hint={`${guests.data?.length || 0} guest approvals tracked`}
              accent="emerald"
              icon={<UserGroupIcon className="w-5 h-5" />}
            />
            <MetricCard
              title="Hostel Occupancy"
              value={`${Math.round(dashboardStats?.occupancy_rate ?? 0)}%`}
              badge={`${todaysVisible} today`}
              hint={`${dashboardStats?.present_students ?? 0} present · ${dashboardStats?.absent_students ?? 0} absent`}
              accent="violet"
              icon={<BuildingOffice2Icon className="w-5 h-5" />}
            />
          </section>

          {latestCredentials && (
            <section className="mb-5 sm:mb-6">
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
                <h3 className="font-semibold text-emerald-900">New Student Login Credentials</h3>
                <p className="text-sm text-emerald-800 mt-1">
                  Student ID: <span className="font-medium">{latestCredentials.studentId}</span>
                </p>
                <p className="text-sm text-emerald-800">
                  Default Password: <span className="font-medium">{latestCredentials.defaultPassword}</span>
                </p>
              </div>
            </section>
          )}

          <section>
            <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-surface-200 bg-surface-50/50">
                <FilterControls
                  filters={filters}
                  onFiltersChange={updateFilters}
                  lead={
                    <>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-base font-semibold text-slate-800">Request queue</h2>
                        <Badge variant="warning" size="medium">
                          {pendingCount} pending
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {filteredRequests.length} request{filteredRequests.length === 1 ? '' : 's'} match current filters
                        {activeFilterCount > 0
                          ? ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`
                          : ''}
                      </p>
                    </>
                  }
                />
              </div>

              {(isLoading || isRefetching) && (
                <div className="p-6 space-y-4">
                  <Skeleton height="64px" />
                  <Skeleton height="64px" />
                  <Skeleton height="64px" />
                  <Skeleton height="64px" />
                </div>
              )}

              {!isLoading && !isRefetching && visibleRequests.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <p className="text-slate-500">No requests found for this view.</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Adjust request type, date range, or search above.
                  </p>
                </div>
              )}

              {!isLoading && !isRefetching && visibleRequests.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-white border-b border-surface-200 text-slate-500">
                      <tr>
                        {queueColumns.map(col => (
                          <Fragment key={col.id}>{col.renderHeader(wardenHeaderProps)}</Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {visibleRequests.map(request => {
                        const isSelected =
                          selectedRequest &&
                          getRequestId(selectedRequest) === getRequestId(request) &&
                          selectedRequest.requestType === request.requestType;

                        return (
                          <tr
                            key={`${request.requestType}-${getRequestId(request)}`}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-brand-50/60' : 'hover:bg-surface-50/80'
                            }`}
                            onClick={() => setSelectedRequest(request)}
                          >
                            {queueColumns.map(col => (
                              <Fragment key={col.id}>{col.renderCell(request)}</Fragment>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <QueuePaginationBar
                    totalItems={orderedFilteredRequests.length}
                    page={clampedQueuePage}
                    pageSize={queuePageSize}
                    onPageChange={setQueuePage}
                    onPageSizeChange={setQueuePageSize}
                    idPrefix="warden-queue"
                    accent="emerald"
                  />
                </div>
              )}
            </div>
          </section>

          <section className="mt-6">
            <RecentActivityPanel
              items={recentActivityItems}
              title="Recent Activity"
              emptyText="No request activity yet"
            />
          </section>
        </div>
      </AppShell>

      <WardenDetailPanel
        request={selectedRequest}
        decisionNote={decisionNote}
        onDecisionNoteChange={value => {
          setDecisionNote(value);
          if (decisionError) setDecisionError('');
        }}
        decisionError={decisionError}
        isActing={isActingOnRequest}
        onApprove={handleApproveSelected}
        onReject={handleRejectSelected}
        onClose={() => setSelectedRequest(null)}
      />

      <Modal
        isOpen={isCreateStudentOpen}
        onClose={() => setIsCreateStudentOpen(false)}
        title="Create Student Account"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="secondary" onClick={() => setIsCreateStudentOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-student-form" loading={isCreatingStudent}>
              Create Account
            </Button>
          </div>
        }
      >
        <form id="create-student-form" onSubmit={handleCreateStudent} className="space-y-5">
          <div className="rounded-2xl border border-blue-200 dark:border-slate-700 bg-blue-50 dark:bg-transparent px-3 py-2">
            <p className="text-sm font-semibold text-blue-900 dark:text-slate-200">
              Add a new student to the hostel system.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Student ID"
              required
              value={studentFormData.student_id}
              error={studentFormErrors.student_id}
              onChange={e =>
                handleStudentFormChange('student_id', e.target.value.toUpperCase())
              }
              helperText="Unique student ID (e.g., STU001)"
              placeholder="STU001"
            />
            <Input
              label="Full Name"
              required
              value={studentFormData.name}
              error={studentFormErrors.name}
              onChange={e => handleStudentFormChange('name', e.target.value)}
              placeholder="Student name"
            />
            <Input
              label="Email"
              type="email"
              required
              value={studentFormData.email}
              error={studentFormErrors.email}
              onChange={e => handleStudentFormChange('email', e.target.value)}
              placeholder="student@example.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
            <Input
              label="Room Number"
              required
              value={studentFormData.room_number}
              error={studentFormErrors.room_number}
              onChange={e => handleStudentFormChange('room_number', e.target.value)}
              placeholder="101"
            />
            <Input
              label="Block"
              required
              value={studentFormData.block}
              error={studentFormErrors.block}
              onChange={e =>
                handleStudentFormChange('block', e.target.value.toUpperCase())
              }
              placeholder="A"
            />
          </div>

          <div className="space-y-4 mt-1">
            <Input
              label="Phone"
              type="tel"
              inputMode="tel"
              required
              value={studentFormData.phone || ''}
              error={studentFormErrors.phone}
              onChange={e => handleStudentFormChange('phone', e.target.value)}
              helperText="Enter 10-digit mobile number"
              placeholder="9876543210"
            />
            <Input
              label="Parent Contact"
              type="tel"
              inputMode="tel"
              required
              value={studentFormData.parent_phone || ''}
              error={studentFormErrors.parent_phone}
              onChange={e => handleStudentFormChange('parent_phone', e.target.value)}
              helperText="Enter number with country code (e.g., 919876543210)"
              placeholder="919876543210"
            />
          </div>
        </form>
      </Modal>
    </>
  );
};

export default WardenDashboard;

function getRequestId(request: UnifiedRequest): string {
  return 'absence_id' in request ? request.absence_id : request.request_id;
}

function getStudentName(request: UnifiedRequest): string {
  return 'student_name' in request ? request.student_name : 'Unknown Student';
}

function getStudentSubline(request: UnifiedRequest): string {
  const room = 'student_room' in request ? request.student_room : request.room_number;
  const extra =
    isGuestRequest(request)
      ? 'Guest access'
      : isMaintenanceRequest(request)
        ? 'Complaint filed'
        : 'Leave request';
  return `${room} · ${extra}`;
}


function getRequestTypeLabel(request: UnifiedRequest): string {
  if (request.requestType === 'leave') return 'Leave';
  if (request.requestType === 'guest') return 'Guest';
  return 'Maintenance';
}

function canModerateRequest(request: UnifiedRequest | null): boolean {
  if (!request || request.status !== 'pending') return false;
  const requiresParentApproval =
    isLeaveRequest(request) &&
    request.parent_approval !== true;
  const isNormalGuestVisit =
    isGuestRequest(request) &&
    request.visit_type === 'normal';
  return !requiresParentApproval && !isNormalGuestVisit;
}

function getModerationLockMessage(request: UnifiedRequest | null): string | null {
  if (!request) return null;
  if (
    isLeaveRequest(request) &&
    request.status === 'pending' &&
    request.parent_approval !== true
  ) {
    return 'Warden approval is locked until parent approval is received.';
  }
  if (
    isGuestRequest(request) &&
    request.visit_type === 'normal'
  ) {
    return 'Normal guest visits are auto-approved and shown here for record keeping.';
  }
  return null;
}

function isLeaveRequest(request: UnifiedRequest): request is LeaveRequest & { requestType: 'leave' } {
  return request.requestType === 'leave';
}

function isGuestRequest(request: UnifiedRequest): request is GuestRequest & { requestType: 'guest' } {
  return request.requestType === 'guest';
}

function isMaintenanceRequest(
  request: UnifiedRequest
): request is MaintenanceRequest & { requestType: 'maintenance' } {
  return request.requestType === 'maintenance';
}

interface MetricCardProps {
  title: string;
  value: string | number;
  badge: string;
  hint: string;
  accent: 'blue' | 'amber' | 'emerald' | 'violet';
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, badge, hint, accent, icon }) => {
  const accentStyles = {
    blue: {
      ring: 'bg-blue-50 text-blue-600',
      badge: 'bg-amber-50 text-amber-700',
    },
    amber: {
      ring: 'bg-red-50 text-red-600',
      badge: 'bg-red-50 text-red-700',
    },
    emerald: {
      ring: 'bg-emerald-50 text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700',
    },
    violet: {
      ring: 'bg-violet-50 text-violet-600',
      badge: 'bg-violet-50 text-violet-700',
    },
  } as const;

  return (
    <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${accentStyles[accent].ring}`}>
          {icon}
        </div>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${accentStyles[accent].badge}`}>
          {badge}
        </span>
      </div>
      <p className="mt-5 text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{hint}</p>
    </div>
  );
};

interface WardenDetailPanelProps {
  request: UnifiedRequest | null;
  decisionNote: string;
  onDecisionNoteChange: (value: string) => void;
  decisionError: string;
  isActing: boolean;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}

const WardenDetailPanel: React.FC<WardenDetailPanelProps> = ({
  request,
  decisionNote,
  onDecisionNoteChange,
  decisionError,
  isActing,
  onApprove,
  onReject,
  onClose,
}) => {
  if (!request) {
    return null;
  }

  const moderationMessage = getModerationLockMessage(request);
  const allowModeration = canModerateRequest(request);

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px]"
        aria-label="Close request panel"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-[430px] bg-white border-l border-surface-200 shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-surface-200 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {getRequestTypeLabel(request)} request details
            </p>
            <h2 className="text-lg font-semibold text-slate-900 mt-1">Review request</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-surface-100 transition-colors"
            aria-label="Close request panel"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            <div className="rounded-2xl border border-surface-200 bg-surface-50/50 p-4">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-full bg-slate-100 ring-1 ring-surface-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                  {getStudentName(request).charAt(0).toUpperCase()}
              </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-900">{getStudentName(request)}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{getStudentSubline(request)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {(() => {
                      const sd = getUnifiedRequestStatusDisplay(request);
                      return (
                        <Badge variant={sd.variant} size="small">
                          {sd.label}
                        </Badge>
                      );
                    })()}
                    <span className="text-xs text-slate-500">Submitted {formatRelativeTime(request.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            <section className="rounded-2xl border border-surface-200 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Request summary
              </h3>
              <DetailGrid request={request} />
            </section>

            {isLeaveRequest(request) && (
              <section className="rounded-2xl border border-surface-200 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  Parent verification
                </h3>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-800">
                  {request.parent_approval === true
                    ? `Verified via WhatsApp${request.parent_response_at ? ` · ${new Date(request.parent_response_at).toLocaleString()}` : ''}`
                    : 'Waiting for parent response via WhatsApp'}
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Contact: {request.emergency_contact || 'N/A'}
                </p>
                <div className="mt-3 h-28 rounded-xl border border-dashed border-surface-300 bg-surface-50 flex items-center justify-center text-xs text-slate-400">
                  Verification media not provided
                </div>
              </section>
            )}

            {isGuestRequest(request) && (
              <section className="rounded-2xl border border-surface-200 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  Guest verification
                </h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>Visitor: {request.guest_name}</p>
                  <p>Phone: {request.guest_phone}</p>
                  <p>Relationship: {request.relationship_display || request.relationship || 'N/A'}</p>
                  <p>Visit type: {request.visit_type === 'overnight' ? 'Overnight' : 'Normal (auto-approved)'}</p>
                </div>
              </section>
            )}

            {isMaintenanceRequest(request) && (
              <section className="rounded-2xl border border-surface-200 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  Complaint handling
                </h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>Priority: <span className="font-medium text-slate-900 capitalize">{request.priority}</span></p>
                  <p>Assigned to: <span className="font-medium text-slate-900">{request.assigned_to_name || 'Not assigned'}</span></p>
                  <p>Notes: <span className="font-medium text-slate-900">{request.notes || 'No staff notes yet'}</span></p>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-surface-200 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Warden decision
              </h3>
              <Textarea
                label="Add notes / denial reason"
                value={decisionNote}
                onChange={e => onDecisionNoteChange(e.target.value)}
                error={decisionError}
                placeholder="Enter remarks for the student or internal records..."
                rows={4}
              />
              {moderationMessage && (
                <p className="mt-3 text-xs rounded-xl bg-amber-50 px-3 py-2 text-amber-800 border border-amber-100">
                  {moderationMessage}
                </p>
              )}
            </section>
          </div>

          <div className="px-5 py-4 border-t border-surface-200 bg-surface-50/60">
            {allowModeration ? (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={onReject} loading={isActing} disabled={isActing}>
                  Deny Request
                </Button>
                <Button variant="primary" onClick={onApprove} loading={isActing} disabled={isActing}>
                  Approve Request
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm text-slate-600">
                This request is view-only at the moment.
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

const DetailGrid: React.FC<{ request: UnifiedRequest }> = ({ request }) => {
  if (isLeaveRequest(request)) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <DetailItem label="Type" value="Leave request" />
        <DetailItem label="Duration" value={`${formatDateRange(request.start_date, request.end_date)} · ${request.duration_days} day(s)`} />
        <DetailItem label="Reason" value={request.reason} className="col-span-2" />
        <DetailItem label="Emergency contact" value={request.emergency_contact} />
        <DetailItem label="Parent status" value={request.parent_approval === true ? 'Approved' : request.parent_approval === false ? 'Rejected' : 'Pending'} />
      </div>
    );
  }

  if (isGuestRequest(request)) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <DetailItem label="Type" value="Guest request" />
        <DetailItem label="Visit window" value={formatDateRange(request.start_date, request.end_date)} />
        <DetailItem label="Guest" value={request.guest_name} />
        <DetailItem label="Stay" value={`${request.duration_days} night(s)`} />
        <DetailItem label="Purpose" value={request.purpose} className="col-span-2" />
      </div>
    );
  }

  if (isMaintenanceRequest(request)) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <DetailItem label="Type" value="Maintenance complaint" />
        <DetailItem label="Priority" value={request.priority} />
        <DetailItem label="Issue" value={request.issue_type} />
        <DetailItem label="Room" value={request.room_number} />
        <DetailItem label="Description" value={request.description} className="col-span-2" />
      </div>
    );
  }

  return null;
};

const DetailItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({
  label,
  value,
  className = '',
}) => (
  <div className={className}>
    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</p>
    <p className="text-sm font-medium text-slate-900 break-words">{value}</p>
  </div>
);
