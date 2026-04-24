import type { LeaveRequest, GuestRequest, MaintenanceRequest } from '../types';
import type { FilterState } from '../hooks/useFilterState';

/**
 * Unified request type for filtering
 */
export type UnifiedRequest = (
  | LeaveRequest
  | GuestRequest
  | MaintenanceRequest
) & {
  requestType: 'leave' | 'guest' | 'maintenance';
};

/**
 * Convert individual request types to unified format
 */
export function unifyRequests(
  leaves: LeaveRequest[],
  guests: GuestRequest[],
  maintenance: MaintenanceRequest[]
): UnifiedRequest[] {
  const unifiedLeaves: UnifiedRequest[] = leaves.map(leave => ({
    ...leave,
    requestType: 'leave' as const,
  }));

  const unifiedGuests: UnifiedRequest[] = guests.map(guest => ({
    ...guest,
    requestType: 'guest' as const,
  }));

  const unifiedMaintenance: UnifiedRequest[] = maintenance.map(maint => ({
    ...maint,
    requestType: 'maintenance' as const,
  }));

  return [...unifiedLeaves, ...unifiedGuests, ...unifiedMaintenance];
}

/**
 * Filter requests by request type
 */
function filterByRequestType(
  requests: UnifiedRequest[],
  requestType: string
): UnifiedRequest[] {
  if (requestType === 'all') {
    return requests;
  }
  return requests.filter(req => req.requestType === requestType);
}

/**
 * Filter requests by date range
 */
function filterByDateRange(
  requests: UnifiedRequest[],
  dateRange: string
): UnifiedRequest[] {
  if (dateRange === 'all') {
    return requests;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return requests.filter(req => {
    const createdAt = new Date(req.created_at);

    switch (dateRange) {
      case 'today':
        return createdAt >= today;

      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt >= weekAgo;
      }

      case 'month': {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return createdAt >= monthAgo;
      }

      default:
        return true;
    }
  });
}

/**
 * Filter requests by search query (student name or room number)
 */
function filterBySearch(
  requests: UnifiedRequest[],
  searchQuery: string
): UnifiedRequest[] {
  if (!searchQuery.trim()) {
    return requests;
  }

  const query = searchQuery.toLowerCase().trim();

  return requests.filter(req => {
    // Search by student name
    const studentName =
      'student_name' in req ? req.student_name.toLowerCase() : '';

    // Search by room number
    const roomNumber =
      'student_room' in req
        ? req.student_room.toLowerCase()
        : 'room_number' in req
          ? req.room_number.toLowerCase()
          : '';

    return studentName.includes(query) || roomNumber.includes(query);
  });
}

/**
 * Apply all filters to request list
 * Returns filtered and sorted requests
 */
export function applyFilters(
  requests: UnifiedRequest[],
  filters: FilterState
): UnifiedRequest[] {
  let filtered = requests;

  // Apply filters in sequence (status is handled by queue tabs on the warden view)
  filtered = filterByRequestType(filtered, filters.requestType);
  filtered = filterByDateRange(filtered, filters.dateRange);
  filtered = filterBySearch(filtered, filters.searchQuery);

  // Sort by created_at (newest first)
  filtered.sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return filtered;
}

/**
 * Highlight matching text in search results
 * Returns text with <mark> tags around matches
 */
export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) {
    return text;
  }

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}
