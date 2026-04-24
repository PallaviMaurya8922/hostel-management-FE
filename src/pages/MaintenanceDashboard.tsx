import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import AppShell from '../components/AppShell';
import Badge, { type BadgeVariant } from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Skeleton from '../components/Skeleton';
import IssuePhotoCollapsible from '../components/IssuePhotoCollapsible';
import Textarea from '../components/Textarea';
import {
  RecentActivityPanel,
  type RecentActivityItem,
} from '../components/dashboard/RecentActivity';
import { useToast } from '../contexts';
import axios from 'axios';
import apiClient from '../api/client';
import {
  getMaintenanceStatusBadgeVariant,
  getMaintenanceStatusLabel,
} from '../utils/maintenanceStatusDisplay';
import { formatPastDueAfterEta } from '../utils/maintenancePastDue';
import QueuePaginationBar from '../components/QueuePaginationBar';
import {
  AdjustmentsHorizontalIcon,
  BoltIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PlayIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UserPlusIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

type RequestStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
type ViewMode = 'kanban' | 'list';

interface MaintenanceStatsResponse {
  success: boolean;
  period_days: number;
  overview: {
    pending: number;
    assigned: number;
    in_progress: number;
    completed: number;
    total_active: number;
  };
  today: {
    new_requests: number;
    completed: number;
  };
  priority_breakdown: Record<string, number>;
  issue_type_breakdown: Record<string, number>;
  staff_performance: Array<{
    staff_id: string;
    name: string;
    completed: number;
    in_progress: number;
  }>;
  average_resolution_hours: number;
}

interface MaintenanceRequest {
  request_id: string;
  student_name?: string;
  student_id?: string;
  block?: string;
  student_contact?: string;
  room_number: string;
  issue_type: string;
  description: string;
  priority: string;
  status: RequestStatus;
  auto_approved?: boolean;
  assigned_to?: string;
  assigned_to_name?: string;
  estimated_completion?: string;
  actual_completion?: string;
  notes?: string;
  is_overdue?: boolean;
  days_pending?: number;
  created_at: string;
  updated_at?: string;
  comments_count?: number;
  attachment?: string | null;
  assigned_to_staff_id?: string | null;
}

interface StaffListRow {
  staff_id: string;
  name: string;
  role: string;
}

interface PanelFormState {
  status: RequestStatus;
  estimated_completion: string;
  notes: string;
  assigned_to_staff_id: string;
}

const PRIORITY_CONFIG: Record<
  string,
  {
    variant: BadgeVariant;
    label: string;
    chipClass: string;
  }
> = {
  emergency: {
    variant: 'danger',
    label: 'Emergency',
    chipClass: 'bg-red-50 text-red-700 ring-1 ring-red-200/70',
  },
  high: {
    variant: 'danger',
    label: 'High',
    chipClass: 'bg-red-50 text-red-700 ring-1 ring-red-200/70',
  },
  medium: {
    variant: 'warning',
    label: 'Medium',
    chipClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70',
  },
  low: {
    variant: 'info',
    label: 'Low',
    chipClass: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/70',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  hvac: 'HVAC / climate',
  furniture: 'Furniture',
  cleaning: 'Cleaning',
  other: 'General',
};

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_FILTER_OPTIONS = [
  { value: 'all', label: 'All priorities' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const ISSUE_TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All categories' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'priority', label: 'Priority (urgent first)' },
];

const QUEUE_PAGE_SIZE_OPTIONS = [6, 12, 24];

const PRIORITY_SORT_WEIGHT: Record<string, number> = {
  emergency: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function priorityWeight(p: string): number {
  return PRIORITY_SORT_WEIGHT[p] ?? 0;
}

function getStatusOptions(request: MaintenanceRequest) {
  const current = request.status;
  const optionsByStatus: Record<RequestStatus, Array<{ value: RequestStatus; label: string }>> = {
    pending: [
      { value: 'pending', label: 'Pending' },
      { value: 'assigned', label: 'Assigned' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
    assigned: [
      { value: 'assigned', label: 'Assigned' },
      { value: 'in_progress', label:'In Progress' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
    in_progress: [
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
    completed: [
      { value: 'completed', label: 'Completed' },
      { value: 'pending', label: 'Pending (reopen)' },
      { value: 'assigned', label: 'Assigned (reopen)' },
      { value: 'in_progress', label: 'In progress (reopen)' },
    ],
    cancelled: [
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'pending', label: 'Pending (reopen)' },
      { value: 'assigned', label: 'Assigned (reopen)' },
    ],
  };
  return optionsByStatus[current];
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

function roomLabel(request: MaintenanceRequest): string {
  return request.block ? `${request.room_number}, Block ${request.block}` : request.room_number;
}

function getRequestTitle(request: MaintenanceRequest): string {
  const issueLabel = CATEGORY_LABELS[request.issue_type] || request.issue_type;
  const firstSentence = request.description.split('.').map(part => part.trim()).find(Boolean);
  if (firstSentence && firstSentence.length <= 56) {
    return firstSentence;
  }
  return `${issueLabel} issue in room ${request.room_number}`;
}

function toDateTimeLocal(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

/** Earliest selectable moment for `datetime-local` (current time, local). */
function datetimeLocalMinNow(): string {
  return toDateTimeLocal(new Date().toISOString());
}

function normalizeList<T>(data: T[] | { results?: T[]; requests?: T[] } | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.requests)) return data.requests;
  return [];
}

const MaintenanceDashboard: React.FC = () => {
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<MaintenanceStatsResponse | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [blockFilter, setBlockFilter] = useState('all');
  const [sortMode, setSortMode] = useState<'newest' | 'oldest' | 'priority'>('newest');
  const [queuePage, setQueuePage] = useState(1);
  const [queuePageSize, setQueuePageSize] = useState(12);
  /** For completed/cancelled tickets: summary first; full form only after "Edit or reopen". */
  const [closedTicketEditorOpen, setClosedTicketEditorOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [isSavingPanel, setIsSavingPanel] = useState(false);
  const [panelForm, setPanelForm] = useState<PanelFormState>({
    assigned_to_staff_id: '',
    status: 'pending',
    estimated_completion: '',
    notes: '',
  });

  const [maintenanceStaff, setMaintenanceStaff] = useState<StaffListRow[]>([]);

  const detailPanelRef = useRef<HTMLElement | null>(null);

  /** Stacked layout: after Review / row pick, scroll the detail column into view so users are not hunting vertically. */
  useLayoutEffect(() => {
    if (!selectedRequestId) return;
    const el = detailPanelRef.current;
    if (!el) return;
    const frame = window.requestAnimationFrame(() => {
      if (window.matchMedia('(max-width: 1279px)').matches) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedRequestId]);

  const loadData = useCallback(async (): Promise<MaintenanceRequest[]> => {
    const [statsRes, requestsRes, staffRes] = await Promise.all([
      apiClient.get<MaintenanceStatsResponse>('/maintenance/stats/'),
      apiClient.get<MaintenanceRequest[] | { results: MaintenanceRequest[] }>('/maintenance-requests/'),
      apiClient.get<StaffListRow[] | { results: StaffListRow[] }>('/staff/'),
    ]);

    setStats(statsRes.data);
    const list = normalizeList(requestsRes.data);
    setRequests(list);

    const staffList = normalizeList(staffRes.data).filter(member => member.role === 'maintenance');
    setMaintenanceStaff(staffList);
    return list;
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        await loadData();
      } catch {
        showToast('Failed to load maintenance workspace', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [loadData, showToast]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadData().catch(() => {});
    }, 15000);
    return () => window.clearInterval(interval);
  }, [loadData]);

  const blockFilterOptions = useMemo(() => {
    const blocks = new Set<string>();
    requests.forEach(request => {
      const b = request.block?.trim();
      if (b) blocks.add(b);
    });
    return [
      { value: 'all', label: 'All blocks' },
      ...[...blocks].sort().map(block => ({ value: block, label: `Block ${block}` })),
    ];
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = requests.filter(request => {
      const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesCategory =
        categoryFilter === 'all' || request.issue_type === categoryFilter;
      const matchesBlock =
        blockFilter === 'all' || (request.block || '').trim() === blockFilter;

      const haystack = [
        getRequestTitle(request),
        request.description,
        request.student_name || '',
        request.student_id || '',
        request.room_number,
        request.block || '',
        CATEGORY_LABELS[request.issue_type] || request.issue_type,
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !query || haystack.includes(query);
      return (
        matchesPriority &&
        matchesStatus &&
        matchesCategory &&
        matchesBlock &&
        matchesSearch
      );
    });

    const sorted = [...filtered];
    if (sortMode === 'newest') {
      sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortMode === 'oldest') {
      sorted.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else {
      sorted.sort((a, b) => {
        const wp = priorityWeight(b.priority) - priorityWeight(a.priority);
        if (wp !== 0) return wp;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return sorted;
  }, [
    blockFilter,
    categoryFilter,
    priorityFilter,
    requests,
    searchQuery,
    sortMode,
    statusFilter,
  ]);

  useEffect(() => {
    setQueuePage(1);
  }, [searchQuery, priorityFilter, statusFilter, categoryFilter, blockFilter, sortMode, queuePageSize]);

  const queueTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredRequests.length / queuePageSize)),
    [filteredRequests.length, queuePageSize]
  );

  useEffect(() => {
    setQueuePage(p => Math.min(p, queueTotalPages));
  }, [queueTotalPages]);

  const clampedQueuePage = Math.min(Math.max(1, queuePage), queueTotalPages);
  const queueOffset = (clampedQueuePage - 1) * queuePageSize;

  const paginatedFilteredRequests = useMemo(
    () => filteredRequests.slice(queueOffset, queueOffset + queuePageSize),
    [filteredRequests, queueOffset, queuePageSize]
  );

  const selectedFilteredIndex = useMemo(() => {
    if (!selectedRequestId) return -1;
    return filteredRequests.findIndex(r => r.request_id === selectedRequestId);
  }, [filteredRequests, selectedRequestId]);

  const selectedTicketOnCurrentQueuePage =
    selectedFilteredIndex < 0 ||
    (selectedFilteredIndex >= queueOffset &&
      selectedFilteredIndex < queueOffset + queuePageSize);

  const filtersAreNonDefault = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      priorityFilter !== 'all' ||
      statusFilter !== 'all' ||
      categoryFilter !== 'all' ||
      blockFilter !== 'all' ||
      sortMode !== 'newest'
    );
  }, [
    blockFilter,
    categoryFilter,
    priorityFilter,
    searchQuery,
    sortMode,
    statusFilter,
  ]);

  const resetBoardFilters = useCallback(() => {
    setSearchQuery('');
    setPriorityFilter('all');
    setStatusFilter('all');
    setCategoryFilter('all');
    setBlockFilter('all');
    setSortMode('newest');
  }, []);

  useEffect(() => {
    if (filteredRequests.length === 0) {
      setSelectedRequestId(null);
      return;
    }

    const stillExists = filteredRequests.some(request => request.request_id === selectedRequestId);
    if (!selectedRequestId || !stillExists) {
      setSelectedRequestId(filteredRequests[0].request_id);
    }
  }, [filteredRequests, selectedRequestId]);

  const selectedRequest = useMemo(
    () => requests.find(request => request.request_id === selectedRequestId) || null,
    [requests, selectedRequestId]
  );

  useEffect(() => {
    if (!selectedRequest) return;
    setPanelForm({
      assigned_to_staff_id: selectedRequest.assigned_to_staff_id || '',
      status: selectedRequest.status,
      estimated_completion: toDateTimeLocal(selectedRequest.estimated_completion),
      notes: selectedRequest.notes || '',
    });
  }, [selectedRequest]);

  const assigneeOptions = useMemo(
    () => [
      { value: '', label: 'Unassigned' },
      ...maintenanceStaff.map(m => ({
        value: m.staff_id,
        label: `${m.name} (${m.staff_id})`,
      })),
    ],
    [maintenanceStaff]
  );

  useEffect(() => {
    setClosedTicketEditorOpen(false);
  }, [selectedRequestId]);

  useEffect(() => {
    if (
      selectedRequest &&
      selectedRequest.status !== 'completed' &&
      selectedRequest.status !== 'cancelled'
    ) {
      setClosedTicketEditorOpen(false);
    }
  }, [selectedRequest?.request_id, selectedRequest?.status]);

  const openRequests = useMemo(
    () => filteredRequests.filter(request => request.status === 'pending' || request.status === 'assigned'),
    [filteredRequests]
  );

  const inProgressRequests = useMemo(
    () => filteredRequests.filter(request => request.status === 'in_progress'),
    [filteredRequests]
  );

  const resolvedRequests = useMemo(
    () => filteredRequests.filter(request => request.status === 'completed' || request.status === 'cancelled'),
    [filteredRequests]
  );

  const statCards = useMemo(() => {
    const overview = stats?.overview;
    const priority = stats?.priority_breakdown || {};

    return [
      {
        title: 'Pending & assigned',
        value: overview ? overview.pending + overview.assigned : openRequests.length,
        hint: 'Needs attention',
        badge: `${(priority.high || 0) + (priority.emergency || 0)} High`,
        icon: ExclamationTriangleIcon,
        shell: 'bg-white dark:bg-slate-900/60 dark:border-slate-700',
        iconWrap: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300',
      },
      {
        title: 'In progress',
        value: overview?.in_progress ?? inProgressRequests.length,
        hint: 'Technicians assigned',
        badge: 'Active',
        icon: WrenchScrewdriverIcon,
        shell: 'bg-white dark:bg-slate-900/60 dark:border-slate-700',
        iconWrap: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
      },
      {
        title: 'Resolved today',
        value: stats?.today.completed ?? resolvedRequests.length,
        hint: 'Closed this shift',
        badge: `${stats?.average_resolution_hours ?? 0}h avg`,
        icon: CheckCircleIcon,
        shell: 'bg-white dark:bg-slate-900/60 dark:border-slate-700',
        iconWrap: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
      },
      {
        title: 'New today',
        value: stats?.today.new_requests ?? 0,
        hint: 'Fresh reports in queue',
        badge: `${stats?.overview.total_active ?? filteredRequests.length} active`,
        icon: BoltIcon,
        shell: 'bg-white dark:bg-slate-900/60 dark:border-slate-700',
        iconWrap: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
      },
    ];
  }, [filteredRequests.length, inProgressRequests.length, openRequests.length, resolvedRequests.length, stats]);

  const recentActivityItems = useMemo<RecentActivityItem[]>(() => {
    return requests
      .flatMap(request => {
        const items: RecentActivityItem[] = [
          {
            id: `maintenance-filed-${request.request_id}`,
            type: 'maintenance',
            action: 'submitted',
            description: `Complaint filed: ${CATEGORY_LABELS[request.issue_type] || request.issue_type} in Room ${roomLabel(request)}`,
            timestamp: request.created_at,
            icon: WrenchScrewdriverIcon,
            iconColor: 'text-amber-600',
            bgColor: 'bg-amber-50',
          },
        ];

        if (request.status === 'assigned' || request.status === 'in_progress') {
          items.push({
            id: `maintenance-progress-${request.request_id}`,
            type: 'maintenance',
            action: 'approved',
            description: `Work started on ${CATEGORY_LABELS[request.issue_type] || request.issue_type}`,
            timestamp: request.updated_at || request.created_at,
            icon: PlayIcon,
            iconColor: 'text-brand-600',
            bgColor: 'bg-brand-50',
          });
        }

        if (request.status === 'completed') {
          items.push({
            id: `maintenance-resolved-${request.request_id}`,
            type: 'maintenance',
            action: 'approved',
            description: `Complaint resolved in Room ${roomLabel(request)}`,
            timestamp: request.actual_completion || request.updated_at || request.created_at,
            icon: CheckCircleIcon,
            iconColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
          });
        }

        return items;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  }, [requests]);

  const updateQuickStatus = useCallback(
    async (requestId: string, status: RequestStatus, successMessage: string) => {
      setActionInFlight(requestId);
      try {
        await apiClient.post('/maintenance/update-status/', {
          request_id: requestId,
          status,
        });
        showToast(successMessage, 'success');
        await loadData();
      } catch {
        showToast('Failed to update task status', 'error');
      } finally {
        setActionInFlight(null);
      }
    },
    [loadData, showToast]
  );

  const handleAcceptTask = useCallback(
    async (requestId: string) => {
      setActionInFlight(requestId);
      try {
        await apiClient.post('/maintenance/accept-task/', { request_id: requestId });
        showToast('Task accepted', 'success');
        await loadData();
      } catch {
        showToast('Failed to accept task', 'error');
      } finally {
        setActionInFlight(null);
      }
    },
    [loadData, showToast]
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
      showToast('Maintenance data refreshed', 'success');
    } catch {
      showToast('Refresh failed', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetPanel = useCallback(async () => {
    if (!selectedRequestId) return;
    try {
      const list = await loadData();
      const fresh = list.find(request => request.request_id === selectedRequestId);
      if (fresh) {
        setPanelForm({
          assigned_to_staff_id: fresh.assigned_to_staff_id || '',
          status: fresh.status,
          estimated_completion: toDateTimeLocal(fresh.estimated_completion),
          notes: fresh.notes || '',
        });
        showToast('Form reset to the latest saved data for this request.', 'info');
      }
    } catch {
      showToast('Could not refresh from the server.', 'error');
    }
  }, [loadData, selectedRequestId, showToast]);

  const handleSavePanel = async () => {
    if (!selectedRequest) return;

    const payload: Record<string, string> = {
      request_id: selectedRequest.request_id,
    };

    const etaChanged =
      !!panelForm.estimated_completion &&
      panelForm.estimated_completion !== toDateTimeLocal(selectedRequest.estimated_completion);
    if (etaChanged) {
      const etaMs = new Date(panelForm.estimated_completion).getTime();
      if (Number.isFinite(etaMs) && etaMs < Date.now()) {
        showToast('ETA must be in the future. Choose a later date and time.', 'error');
        return;
      }
    }

    if (panelForm.status !== selectedRequest.status) {
      payload.status = panelForm.status;
    }
    if (panelForm.notes !== (selectedRequest.notes || '')) {
      payload.notes = panelForm.notes;
    }
    if (panelForm.estimated_completion && panelForm.estimated_completion !== toDateTimeLocal(selectedRequest.estimated_completion)) {
      payload.estimated_completion = new Date(panelForm.estimated_completion).toISOString();
    }

    const prevAssignee = selectedRequest.assigned_to_staff_id || '';
    if ((panelForm.assigned_to_staff_id || '') !== prevAssignee) {
      payload.assigned_to_staff_id = panelForm.assigned_to_staff_id;
    }

    if (Object.keys(payload).length === 1) {
      showToast('No changes to save', 'info');
      return;
    }

    setIsSavingPanel(true);
    try {
      await apiClient.post('/maintenance/update-status/', payload);
      showToast('Maintenance request updated', 'success');
      await loadData();
    } catch (error: unknown) {
      let message = 'Failed to save updates';
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: string; detail?: string } | undefined;
        if (data?.error) message = data.error;
        else if (data?.detail) message = String(data.detail);
      }
      showToast(message, 'error');
    } finally {
      setIsSavingPanel(false);
    }
  };

  const renderComplaintCard = (request: MaintenanceRequest) => {
    const priorityCfg = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.medium;
    const categoryLabel = CATEGORY_LABELS[request.issue_type] || request.issue_type;
    const statusLabel = getMaintenanceStatusLabel(request);
    const statusVariant = getMaintenanceStatusBadgeVariant(request);
    const isBusy = actionInFlight === request.request_id;
    const isSelected = request.request_id === selectedRequestId;
    const descMax = 52;

    return (
      <button
        type="button"
        onClick={() => setSelectedRequestId(request.request_id)}
        className={`group w-full border bg-white text-left shadow-glass-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md rounded-[20px] p-3 ${
          isSelected ? 'border-brand-300 ring-2 ring-brand-100' : 'border-surface-200/80'
        } dark:border-slate-700 dark:bg-slate-900/50`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={priorityCfg.variant} size="small">
            {priorityCfg.label}
          </Badge>
          <Badge variant={statusVariant} size="small">
            {statusLabel}
          </Badge>
          <span className="inline-flex rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-surface-200 dark:text-slate-400 dark:ring-slate-600">
            {categoryLabel}
          </span>
        </div>

        <h4 className="mt-2 text-[13px] font-semibold leading-snug text-slate-900 dark:text-slate-100">
          {getRequestTitle(request)}
        </h4>
        <p className="mt-0.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
          {truncate(request.description, descMax)}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
            Room {roomLabel(request)}
          </span>
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="h-3.5 w-3.5 shrink-0" />
            {formatTimeAgo(request.created_at)}
          </span>
          {(request.comments_count ?? 0) > 0 ? (
            <span className="inline-flex items-center gap-1">
              <ChatBubbleLeftIcon className="h-3.5 w-3.5 shrink-0" />
              {request.comments_count}
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 border-t border-surface-100 pt-2 dark:border-slate-700">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
              {request.student_name || 'Student'}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {request.assigned_to_name || 'Unassigned'}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5" onClick={e => e.stopPropagation()}>
            {request.status === 'completed' || request.status === 'cancelled' ? (
              <button
                type="button"
                onClick={() => setSelectedRequestId(request.request_id)}
                className="inline-flex items-center gap-1 rounded-xl border border-surface-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 transition-colors hover:bg-surface-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                View
              </button>
            ) : request.status === 'in_progress' ? (
              <button
                type="button"
                onClick={() => updateQuickStatus(request.request_id, 'completed', 'Complaint resolved')}
                disabled={isBusy}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
              >
                <CheckCircleIcon className="h-3.5 w-3.5" />
                Resolve
              </button>
            ) : (
              <>
                {request.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => handleAcceptTask(request.request_id)}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1 rounded-xl bg-brand-50 px-2 py-1 text-[10px] font-medium text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-50 dark:bg-brand-950/40 dark:text-brand-200 dark:hover:bg-brand-900/50"
                  >
                    <UserPlusIcon className="h-3.5 w-3.5" />
                    Accept
                  </button>
                ) : null}
                {request.status === 'assigned' ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateQuickStatus(request.request_id, 'in_progress', 'Status updated to In Progress')
                    }
                    disabled={isBusy}
                    className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-900/40"
                  >
                    <PlayIcon className="h-3.5 w-3.5" />
                    Start
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </button>
    );
  };

  const renderQueuePaginationBar = () => (
    <QueuePaginationBar
      totalItems={filteredRequests.length}
      page={clampedQueuePage}
      pageSize={queuePageSize}
      onPageChange={setQueuePage}
      onPageSizeChange={setQueuePageSize}
      pageSizeOptions={QUEUE_PAGE_SIZE_OPTIONS}
      idPrefix="maintenance-queue"
      accent="emerald"
    />
  );

  const renderListView = () => (
    <div className="overflow-hidden rounded-[28px] border border-surface-200/80 bg-white shadow-glass-sm dark:border-slate-700 dark:bg-slate-900/40">
      <div className="grid grid-cols-[1.6fr_1fr_0.85fr_0.85fr_0.95fr_0.75fr] gap-4 border-b border-surface-200 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
        <span>Issue</span>
        <span>Location & category</span>
        <span>Priority</span>
        <span>Status</span>
        <span>Assignee</span>
        <span className="text-right">View</span>
      </div>
      {filteredRequests.length > 0 && !selectedTicketOnCurrentQueuePage && selectedFilteredIndex >= 0 ? (
        <div className="flex flex-col gap-2 border-b border-amber-200/80 bg-amber-50/90 px-4 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-amber-950 dark:text-amber-100">
            The selected ticket is not on this page of the list.
          </p>
          <Button
            type="button"
            size="small"
            variant="secondary"
            onClick={() => setQueuePage(Math.floor(selectedFilteredIndex / queuePageSize) + 1)}
          >
            Go to page with selection
          </Button>
        </div>
      ) : null}
      <div className="divide-y divide-surface-100 dark:divide-slate-700">
        {filteredRequests.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No maintenance requests match the current filters.
          </div>
        ) : (
          paginatedFilteredRequests.map(request => (
            <div
              key={request.request_id}
              className={`grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[1.6fr_1fr_0.85fr_0.85fr_0.95fr_0.75fr] lg:items-center ${
                request.request_id === selectedRequestId ? 'bg-brand-50/50 dark:bg-brand-950/25' : ''
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{getRequestTitle(request)}</p>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{truncate(request.description, 96)}</p>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <p>Room {roomLabel(request)}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {CATEGORY_LABELS[request.issue_type] || request.issue_type}
                </p>
              </div>
              <div>
                <Badge variant={(PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.medium).variant} size="small">
                  {(PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.medium).label}
                </Badge>
              </div>
              <div>
                <Badge variant={getMaintenanceStatusBadgeVariant(request)} size="small">
                  {getMaintenanceStatusLabel(request)}
                </Badge>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {request.assigned_to_name || 'Unassigned'}
              </div>
              <div className="flex justify-end">
                <Button size="small" variant="secondary" onClick={() => setSelectedRequestId(request.request_id)}>
                  View
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      {renderQueuePaginationBar()}
    </div>
  );

  return (
    <AppShell
      pageTitle="Maintenance · Complaints queue"
      showTopRefresh
      onTopRefresh={handleRefresh}
      topRefreshLoading={isRefreshing}
      topRefreshLabel="Refresh"
    >
      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <section>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map(index => (
                <Skeleton key={index} height="116px" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map(card => (
                <div
                  key={card.title}
                  className={`rounded-[24px] border border-surface-200/80 ${card.shell} p-5 shadow-glass-sm`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconWrap}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-surface-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-surface-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-600">
                      {card.badge}
                    </span>
                  </div>
                  <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">{card.title}</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">{card.value}</p>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{card.hint}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,440px)] xl:items-start xl:gap-8">
          <div className="min-w-0 space-y-6">
            <div className="rounded-[28px] border border-surface-200/80 bg-white p-5 shadow-glass-sm dark:border-slate-700 dark:bg-slate-900/40">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl bg-surface-100 p-1 dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() => setViewMode('kanban')}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                          viewMode === 'kanban'
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        <Squares2X2Icon className="h-4 w-4" />
                        Cards
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                          viewMode === 'list'
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        <ListBulletIcon className="h-4 w-4" />
                        List
                      </button>
                    </div>

                    <div className="relative min-w-[220px] flex-1 lg:min-w-[280px] lg:max-w-md">
                      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search title, description, room, student, category…"
                        className="w-full rounded-xl border border-surface-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl border border-surface-200/90 bg-surface-50/90 p-4 dark:border-slate-600 dark:bg-slate-800/60">
                  <AdjustmentsHorizontalIcon className="mt-1 hidden h-5 w-5 shrink-0 text-slate-400 sm:block dark:text-slate-500" />
                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    <Select
                      label="Priority"
                      value={priorityFilter}
                      onChange={e => setPriorityFilter(e.target.value)}
                      options={PRIORITY_FILTER_OPTIONS}
                    />
                    <Select
                      label="Status"
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      options={STATUS_FILTER_OPTIONS}
                    />
                    <Select
                      label="Category"
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                      options={ISSUE_TYPE_FILTER_OPTIONS}
                    />
                    <Select
                      label="Block"
                      value={blockFilter}
                      onChange={e => setBlockFilter(e.target.value)}
                      options={blockFilterOptions}
                    />
                    <Select
                      label="Sort"
                      value={sortMode}
                      onChange={e => setSortMode(e.target.value as 'newest' | 'oldest' | 'priority')}
                      options={SORT_OPTIONS}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-surface-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{filteredRequests.length}</span>
                    {' / '}
                    <span className="font-medium">{requests.length}</span>
                    {' complaints'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {viewMode === 'kanban' && filteredRequests.length > queuePageSize ? (
                      <Badge variant="info" size="small">
                        Multiple pages
                      </Badge>
                    ) : null}
                    {filtersAreNonDefault ? (
                      <Button variant="secondary" size="small" onClick={resetBoardFilters}>
                        Reset filters
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton height="30px" width="200px" />
                <Skeleton height="220px" />
                <Skeleton height="220px" />
              </div>
            ) : viewMode === 'kanban' ? (
              <div className="space-y-3">
                <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Card board
                  </p>
                </div>
                <div className="flex flex-col rounded-[28px] border border-surface-200/80 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-1 rounded-full bg-brand-400 dark:bg-brand-500" />
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                        Queue ({filteredRequests.length})
                      </h3>
                    </div>
                  </div>
                  {filteredRequests.length === 0 ? (
                    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-surface-300/90 bg-white/90 px-6 py-12 text-center dark:border-slate-600 dark:bg-slate-900/50">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-600">
                        <Squares2X2Icon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div className="max-w-md space-y-2">
                        <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                          No requests match filters
                        </p>
                        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                          Try widening the status filter or reset filters to see more maintenance tickets here and in
                          list view.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {!selectedTicketOnCurrentQueuePage && selectedFilteredIndex >= 0 ? (
                        <div className="mb-3 flex flex-col gap-2 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-amber-950 dark:text-amber-100">
                            The selected ticket is not on this page of the queue.
                          </p>
                          <Button
                            type="button"
                            size="small"
                            variant="secondary"
                            onClick={() =>
                              setQueuePage(Math.floor(selectedFilteredIndex / queuePageSize) + 1)
                            }
                          >
                            Go to page with selection
                          </Button>
                        </div>
                      ) : null}
                      <div className="grid grid-cols-1 gap-2 pr-1 md:grid-cols-2 md:gap-x-3 md:gap-y-2">
                        {paginatedFilteredRequests.map(request => (
                          <div key={request.request_id} className="min-w-0">
                            {renderComplaintCard(request)}
                          </div>
                        ))}
                      </div>
                      {renderQueuePaginationBar()}
                    </>
                  )}
                </div>
              </div>
            ) : (
              renderListView()
            )}

            <div className="rounded-[28px] border border-surface-200/80 bg-white p-5 shadow-glass-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Closed Queue</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">Recently resolved or cancelled</h3>
                </div>
                <Badge variant="success" size="small">
                  {resolvedRequests.length} records
                </Badge>
              </div>
              <div className="mt-4 space-y-3">
                {resolvedRequests.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-surface-300 px-5 py-8 text-center text-sm text-slate-500">
                    No closed requests for the selected filters.
                  </div>
                ) : (
                  resolvedRequests.slice(0, 4).map(request => (
                    <button
                      type="button"
                      key={request.request_id}
                      onClick={() => setSelectedRequestId(request.request_id)}
                      className="flex w-full items-start justify-between gap-3 rounded-[22px] border border-surface-200/80 p-4 text-left transition-colors hover:bg-surface-50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{getRequestTitle(request)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Room {roomLabel(request)} • {formatTimeAgo(request.updated_at || request.created_at)}
                        </p>
                      </div>
                      <Badge variant={getMaintenanceStatusBadgeVariant(request)} size="small">
                        {getMaintenanceStatusLabel(request)}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <aside
            ref={detailPanelRef}
            className="w-full min-w-0 shrink-0 scroll-mt-28 self-start xl:sticky xl:top-24 xl:max-w-[440px] xl:justify-self-end"
          >
            <div className="flex max-h-[min(calc(100dvh-5rem),52rem)] flex-col overflow-hidden rounded-[28px] border border-surface-200/80 bg-white shadow-glass-sm dark:border-slate-700 dark:bg-slate-900/50 xl:max-h-[calc(100dvh-7rem)]">
              {selectedRequest ? (
                <>
                  <div className="shrink-0 border-b border-surface-200 px-5 py-4 dark:border-slate-700">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            (PRIORITY_CONFIG[selectedRequest.priority] || PRIORITY_CONFIG.medium).chipClass
                          }`}
                        >
                          {(PRIORITY_CONFIG[selectedRequest.priority] || PRIORITY_CONFIG.medium).label} priority
                        </span>
                        <span className="text-xs font-medium text-slate-400">#{selectedRequest.request_id.slice(0, 8)}</span>
                      </div>
                      <Badge variant={getMaintenanceStatusBadgeVariant(selectedRequest)} size="small">
                        {getMaintenanceStatusLabel(selectedRequest)}
                      </Badge>
                    </div>

                    <h3 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">{getRequestTitle(selectedRequest)}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <WrenchScrewdriverIcon className="h-3.5 w-3.5" />
                        {CATEGORY_LABELS[selectedRequest.issue_type] || selectedRequest.issue_type}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPinIcon className="h-3.5 w-3.5" />
                        {roomLabel(selectedRequest)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" />
                        Reported {formatTimeAgo(selectedRequest.created_at)}
                      </span>
                    </div>
                    {selectedRequest.is_overdue ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-gradient-to-r from-amber-50 to-orange-50/80 px-3 py-1.5 text-[11px] font-semibold text-amber-950 shadow-sm dark:border-amber-800/60 dark:from-amber-950/40 dark:to-orange-950/30 dark:text-amber-100">
                          <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          {formatPastDueAfterEta(selectedRequest.estimated_completion)}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {(selectedRequest.status === 'completed' || selectedRequest.status === 'cancelled') &&
                  !closedTicketEditorOpen ? (
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-auto px-5 py-6">
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        This request is <span className="font-semibold">closed</span>. The full edit form is hidden so
                        day-to-day triage stays focused on active work. Open it only when you need to reopen the ticket or
                        correct saved details.
                      </p>
                      {selectedRequest.actual_completion ? (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Completed on{' '}
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {new Date(selectedRequest.actual_completion).toLocaleString()}
                          </span>
                        </p>
                      ) : selectedRequest.updated_at ? (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Last updated{' '}
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {new Date(selectedRequest.updated_at).toLocaleString()}
                          </span>
                        </p>
                      ) : null}
                      <div className="mt-4 rounded-[22px] border border-surface-200 bg-slate-50/60 p-4 dark:border-slate-600 dark:bg-slate-800/50">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Description</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                          {selectedRequest.description}
                        </p>
                        <IssuePhotoCollapsible
                          attachment={selectedRequest.attachment}
                          heading="Student issue photo"
                          emptyText="No photo uploaded"
                          className="mt-3 border-t border-surface-200 pt-3 dark:border-slate-600"
                        />
                      </div>
                      <div className="mt-4 flex items-center gap-3 rounded-[22px] border border-surface-200 p-4 dark:border-slate-600">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                          <UserCircleIcon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Reported by</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {selectedRequest.student_name || 'Student'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Room {roomLabel(selectedRequest)}
                            {selectedRequest.student_contact ? ` • ${selectedRequest.student_contact}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6">
                        <Button type="button" onClick={() => setClosedTicketEditorOpen(true)}>
                          Edit or reopen request
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-auto">
                    <div className="space-y-5 px-5 py-5">
                    <section className="rounded-[22px] border border-surface-200 bg-slate-50/60 p-4">
                      <p className="text-sm leading-6 text-slate-700">{selectedRequest.description}</p>
                      <IssuePhotoCollapsible
                        attachment={selectedRequest.attachment}
                        heading="Student issue photo"
                        emptyText="No photo uploaded"
                        className="mt-3 border-t border-surface-200 pt-3 dark:border-slate-600"
                      />
                    </section>

                    <section>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Reported By</p>
                      <div className="mt-3 flex items-center gap-3 rounded-[22px] border border-surface-200 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                          <UserCircleIcon className="h-7 w-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">{selectedRequest.student_name || 'Student'}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Room {roomLabel(selectedRequest)}
                            {selectedRequest.student_contact ? ` • ${selectedRequest.student_contact}` : ''}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Assignment & Status</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Set assignee and <span className="font-medium text-slate-600 dark:text-slate-300">Change status</span>, then
                        use <span className="font-medium text-slate-600 dark:text-slate-300">Save updates</span> below.
                      </p>
                      {closedTicketEditorOpen &&
                        (selectedRequest.status === 'completed' || selectedRequest.status === 'cancelled') && (
                        <p className="mt-2 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
                          This ticket is still saved as <span className="font-semibold">closed</span> until you save.
                          Choose <span className="font-semibold">Pending</span>, <span className="font-semibold">Assigned</span>, or{' '}
                          <span className="font-semibold">In progress</span> to reopen, then press Save updates.
                        </p>
                      )}
                      <div className="mt-3 space-y-4 rounded-[22px] border border-surface-200 p-4 dark:border-slate-600">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Select
                            label="Assign Technician"
                            value={panelForm.assigned_to_staff_id}
                            onChange={e =>
                              setPanelForm(prev => ({ ...prev, assigned_to_staff_id: e.target.value }))
                            }
                            options={assigneeOptions}
                          />
                          <Select
                            label="Change Status"
                            value={panelForm.status}
                            onChange={e =>
                              setPanelForm(prev => ({ ...prev, status: e.target.value as RequestStatus }))
                            }
                            options={getStatusOptions({ ...selectedRequest, status: panelForm.status })}
                          />
                        </div>

                        <Input
                          label="Set ETA"
                          type="datetime-local"
                          min={datetimeLocalMinNow()}
                          value={panelForm.estimated_completion}
                          onChange={e =>
                            setPanelForm(prev => ({ ...prev, estimated_completion: e.target.value }))
                          }
                          helperText={
                            selectedRequest.is_overdue
                              ? 'Saved ETA has passed — pick a new target or close the ticket. New times must be in the future (your timezone).'
                              : 'Must be no earlier than the current date and time (your timezone).'
                          }
                        />

                        <Textarea
                          label="Internal Notes & Timeline"
                          value={panelForm.notes}
                          onChange={e => setPanelForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Add technician notes, updates, or closure summary..."
                        />
                      </div>
                    </section>

                    <section>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Request Info</p>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-[20px] border border-surface-200 p-3 dark:border-slate-600">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Days pending</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {selectedRequest.days_pending ?? 0} day(s)
                          </p>
                        </div>
                        <div className="rounded-[20px] border border-surface-200 p-3 dark:border-slate-600">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">ETA</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {selectedRequest.estimated_completion
                              ? new Date(selectedRequest.estimated_completion).toLocaleString()
                              : 'Not set'}
                          </p>
                        </div>
                        <div className="rounded-[20px] border border-surface-200 p-3 dark:border-slate-600">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Overdue</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {selectedRequest.is_overdue ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </section>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 border-t border-surface-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                    <p className="order-2 text-[11px] text-slate-500 dark:text-slate-400 sm:order-1 sm:max-w-[55%]">
                      <span className="font-medium text-slate-600 dark:text-slate-300">Reset</span> reloads this request
                      from the server and clears unsaved edits.
                    </p>
                    <div className="order-1 flex flex-wrap justify-end gap-2 sm:order-2">
                      {(selectedRequest.status === 'completed' || selectedRequest.status === 'cancelled') &&
                        closedTicketEditorOpen && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="small"
                            onClick={() => setClosedTicketEditorOpen(false)}
                          >
                            Back to summary
                          </Button>
                        )}
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => void handleResetPanel()}
                    >
                      Reset
                    </Button>
                    <Button
                      size="small"
                      onClick={handleSavePanel}
                      loading={isSavingPanel}
                      icon={<CheckIcon className="h-4 w-4" />}
                    >
                      Update Status
                    </Button>
                    </div>
                  </div>
                    </>
                  )}
                </>
              ) : (
                <div className="p-10 text-center">
                  <BuildingOffice2Icon className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-4 text-sm font-medium text-slate-800 dark:text-slate-100">No complaint selected</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Pick a maintenance request from the board or list to review its details here.
                  </p>
                </div>
              )}
            </div>
          </aside>
          </div>

          <div className="min-w-0 border-t border-surface-200/90 pt-8 dark:border-slate-700">
            <RecentActivityPanel
              items={recentActivityItems}
              title="Recent Activity"
              emptyText="No maintenance activity yet"
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default MaintenanceDashboard;
