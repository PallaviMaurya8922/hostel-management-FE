import apiClient from './client';

export interface NotificationItem {
  notification_id: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  action_url?: string;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  recipient_type: 'student' | 'staff' | null;
  recipient_name: string | null;
}

interface PaginatedNotificationsResponse {
  count?: number;
  next?: string;
  previous?: string;
  results?: NotificationItem[];
}

/**
 * Fetch all notifications for the current user
 */
export async function getNotifications(): Promise<NotificationItem[]> {
  try {
    const response = await apiClient.get<PaginatedNotificationsResponse | NotificationItem[]>(
      '/notifications/'
    );

    // Normalize response - DRF might return paginated object or direct array
    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (response.data?.results) {
      return response.data.results;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(
  notificationId: string
): Promise<NotificationItem> {
  const response = await apiClient.post<NotificationItem>(
    `/notifications/${notificationId}/mark_read/`
  );
  return response.data;
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllNotificationsRead(): Promise<{
  marked_as_read: number;
}> {
  const response = await apiClient.post<{ marked_as_read: number }>(
    '/notifications/mark_all_read/'
  );
  return response.data;
}

/**
 * Get the count of unread notifications
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const response = await apiClient.get<{ unread_count: number }>(
      '/notifications/unread_count/'
    );
    return response.data.unread_count;
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return 0;
  }
}
