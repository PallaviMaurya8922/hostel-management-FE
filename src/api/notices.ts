import apiClient from './client';

export interface Notice {
  notice_id: string;
  warden: string;
  warden_name: string;
  warden_id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_audience: 'student' | 'security';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNoticeData {
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_audience: 'student' | 'security';
}

export interface UpdateNoticeData {
  title?: string;
  content?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  target_audience?: 'student' | 'security';
  is_active?: boolean;
}

// Get all active notices (students see only active)
export const getAllNotices = async (): Promise<Notice[]> => {
  const response = await apiClient.get<{ results: Notice[] }>('/notices/');
  return response.data.results || [];
};

// Get a specific notice by ID
export const getNotice = async (noticeId: string): Promise<Notice> => {
  const response = await apiClient.get<Notice>(`/notices/${noticeId}/`);
  return response.data;
};

// Create a new notice (wardens/admins only)
export const createNotice = async (data: CreateNoticeData): Promise<Notice> => {
  const response = await apiClient.post<Notice>('/notices/', data);
  return response.data;
};

// Update a notice (wardens/admins only)
export const updateNotice = async (
  noticeId: string,
  data: UpdateNoticeData
): Promise<Notice> => {
  const response = await apiClient.patch<Notice>(`/notices/${noticeId}/`, data);
  return response.data;
};

// Delete a notice (wardens/admins only)
export const deleteNotice = async (noticeId: string): Promise<void> => {
  await apiClient.delete(`/notices/${noticeId}/`);
};
