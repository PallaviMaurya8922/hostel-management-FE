import apiClient from './client';
import { config } from '../config/env';

const authBaseUrl = config.apiBaseUrl.replace(/\/api\/?$/, '');

export interface PassHistoryRecord {
  type: 'digital_pass' | 'leave_request';
  student_name: string;
  student_id: string;
  room_number: string;
  pass_number: string;
  from_date: string;
  to_date: string;
  total_days: number;
  status: string;
  approved_by: string;
  created_at: string;
}

export interface PassHistoryFilters {
  start_date?: string;
  end_date?: string;
  student_name?: string;
  pass_type?: 'digital' | 'leave';
  status?: string;
}

interface PassHistoryResponse {
  success: boolean;
  total_records: number;
  history: PassHistoryRecord[];
}

export const getPassHistory = async (
  filters: PassHistoryFilters = {}
): Promise<PassHistoryRecord[]> => {
  const response = await apiClient.get<PassHistoryResponse>('/pass-history/', {
    params: filters,
  });
  return response.data.history || [];
};

export const exportPassHistory = async (
  filters: PassHistoryFilters = {}
): Promise<Blob> => {
  const response = await apiClient.get('/pass-history/export/', {
    params: filters,
    responseType: 'blob',
  });
  return response.data;
};

export interface DashboardStats {
  total_students: number;
  present_students: number;
  absent_students: number;
  active_guests: number;
  total_pending_requests: number;
  pending_guest_requests: number;
  pending_absence_requests: number;
  pending_maintenance_requests: number;
  high_priority_maintenance: number;
  occupancy_rate: number;
  todays_messages: number;
  todays_requests: number;
}

interface DashboardDataResponse {
  success: boolean;
  data?: {
    stats: DashboardStats;
  };
}

export const getWardenDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get<DashboardDataResponse>('/dashboard-data/', {
    params: { refresh: true },
  });

  return (
    response.data.data?.stats || {
      total_students: 0,
      present_students: 0,
      absent_students: 0,
      active_guests: 0,
      total_pending_requests: 0,
      pending_guest_requests: 0,
      pending_absence_requests: 0,
      pending_maintenance_requests: 0,
      high_priority_maintenance: 0,
      occupancy_rate: 0,
      todays_messages: 0,
      todays_requests: 0,
    }
  );
};

export interface PresentStudent {
  student_id: string;
  name: string;
  room_number: string;
  block: string;
  active_guests: number;
  phone?: string;
  parent_phone?: string;
}

interface StudentsPresentResponse {
  success: boolean;
  data?: {
    total_present: number;
    students: PresentStudent[];
  };
}

export const getStudentsPresent = async (): Promise<PresentStudent[]> => {
  const response = await apiClient.get<StudentsPresentResponse>('/students-present/');
  return response.data.data?.students || [];
};

export interface CreateStudentData {
  student_id: string;
  name: string;
  email: string;
  room_number: string;
  block: string;
  phone: string;
  parent_phone: string;
}

export interface CreateStaffData {
  name: string;
  role: 'warden' | 'security' | 'maintenance';
  email: string;
  phone: string;
}

export interface CreateStaffResponse {
  success: boolean;
  message: string;
  staff: {
    staff_id: string;
    name: string;
    role: 'warden' | 'security' | 'maintenance';
    email: string;
    phone: string;
    default_password: string;
  };
}

export const createStaffAccount = async (
  data: CreateStaffData
): Promise<CreateStaffResponse> => {
  const response = await apiClient.post<CreateStaffResponse>(
    '/staff/create-staff/',
    data,
    {
      baseURL: authBaseUrl,
    }
  );
  return response.data;
};

export interface CreateStudentResponse {
  success: boolean;
  message: string;
  student: {
    student_id: string;
    name: string;
    email: string;
    room_number: string;
    block: string;
    default_password: string;
  };
}

export const createStudentAccount = async (
  data: CreateStudentData
): Promise<CreateStudentResponse> => {
  const response = await apiClient.post<CreateStudentResponse>(
    '/staff/create-student/',
    data,
    {
      baseURL: authBaseUrl,
    }
  );
  return response.data;
};

export interface UpdateStudentByStaffData {
  student_id: string;
  email: string;
  room_number: string;
  block: string;
  phone: string;
  parent_phone?: string;
}

interface UpdateStudentByStaffResponse {
  success: boolean;
  message: string;
  student: {
    student_id: string;
    email: string;
    room_number: string;
    block: string;
    phone: string;
    parent_phone?: string;
  };
}

export const updateStudentByStaff = async (
  data: UpdateStudentByStaffData
): Promise<UpdateStudentByStaffResponse> => {
  const response = await apiClient.post<UpdateStudentByStaffResponse>(
    '/staff/update-student-profile/',
    data,
    {
      baseURL: authBaseUrl,
    }
  );
  return response.data;
};

interface DeleteStudentByStaffResponse {
  success: boolean;
  message: string;
  deleted_student_id: string;
}

export const deleteStudentByStaff = async (
  studentId: string,
  reason?: string
): Promise<DeleteStudentByStaffResponse> => {
  const response = await apiClient.post<DeleteStudentByStaffResponse>(
    '/staff/delete-student/',
    reason ? { student_id: studentId, reason } : { student_id: studentId },
    {
      baseURL: authBaseUrl,
    }
  );
  return response.data;
};

interface DeleteStaffByAdminResponse {
  success: boolean;
  message: string;
  deleted_staff_id: string;
}

export const deleteStaffByAdmin = async (
  staffId: string
): Promise<DeleteStaffByAdminResponse> => {
  const response = await apiClient.post<DeleteStaffByAdminResponse>(
    '/staff/delete-staff/',
    { staff_id: staffId },
    {
      baseURL: authBaseUrl,
    }
  );
  return response.data;
};
