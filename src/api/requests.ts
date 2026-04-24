import { AxiosHeaders } from 'axios';
import apiClient from './client';
import type {
  LeaveRequest,
  GuestRequest,
  MaintenanceRequest,
  Student,
} from '../types';
import { normalizeListResponse } from './normalize';

/**
 * Fetch leave requests (absence records) for the authenticated student
 */
export const getLeaves = async (): Promise<LeaveRequest[]> => {
  const response = await apiClient.get('/absence-records/');
  return normalizeListResponse<LeaveRequest>(
    response.data,
    'absence_records',
    'leaves',
    'data'
  );
};

/**
 * Fetch guest requests for the authenticated student
 */
export const getGuests = async (): Promise<GuestRequest[]> => {
  const response = await apiClient.get('/guest-requests/');
  return normalizeListResponse<GuestRequest>(
    response.data,
    'guest_requests',
    'guests',
    'data'
  );
};

/**
 * Fetch maintenance requests for the authenticated student
 */
export const getMaintenance = async (): Promise<MaintenanceRequest[]> => {
  const response = await apiClient.get('/maintenance-requests/');
  return normalizeListResponse<MaintenanceRequest>(
    response.data,
    'maintenance_requests',
    'maintenance',
    'data'
  );
};

/**
 * Fetch profile details for a specific student
 */
export const getStudentProfile = async (studentId: string): Promise<Student> => {
  const response = await apiClient.get<Student>(
    `/students/${encodeURIComponent(studentId)}/`
  );
  return response.data;
};

/**
 * Submit a new leave request
 */
export interface CreateLeaveRequestData {
  start_date: string;
  end_date: string;
  reason: string;
  emergency_contact: string;
}

interface SubmitLeaveRequestResponse {
  success: boolean;
  message: string;
  auto_approved: boolean;
  requires_warden_approval: boolean;
  absence_record?: {
    id: string;
    status: string;
    from_date: string;
    to_date: string;
    total_days: number;
    reason: string;
  };
}

export const createLeaveRequest = async (
  data: CreateLeaveRequestData
): Promise<LeaveRequest> => {
  const response = await apiClient.post<SubmitLeaveRequestResponse>(
    '/submit-leave-request/',
    {
      from_date: data.start_date,
      to_date: data.end_date,
      reason: data.reason,
      emergency_contact: data.emergency_contact,
    }
  );

  // Existing callers only need successful completion and then refetch lists.
  return response.data as unknown as LeaveRequest;
};

/**
 * Submit a new guest request
 */
export interface CreateGuestRequestData {
  guest_name: string;
  visit_type: 'normal' | 'overnight';
  guest_phone: string;
  relationship?: string;
  start_date: string;
  end_date: string;
  purpose: string;
}

export const createGuestRequest = async (
  data: CreateGuestRequestData
): Promise<GuestRequest> => {
  const response = await apiClient.post<GuestRequest>('/guest-requests/', data);
  return response.data;
};

/**
 * Submit a new maintenance request
 */
export interface CreateMaintenanceRequestData {
  room_number: string;
  issue_type: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  /** Optional issue photo; sent as multipart field `attachment`. */
  photo?: File;
}

export const createMaintenanceRequest = async (
  data: CreateMaintenanceRequestData
): Promise<MaintenanceRequest> => {
  if (data.photo) {
    const fd = new FormData();
    fd.append('room_number', data.room_number);
    fd.append('issue_type', data.issue_type);
    fd.append('description', data.description);
    fd.append('priority', data.priority);
    fd.append('attachment', data.photo);

    const response = await apiClient.post<MaintenanceRequest>(
      '/maintenance-requests/',
      fd,
      {
        transformRequest: [
          (body, headers) => {
            if (headers instanceof AxiosHeaders) {
              headers.delete('Content-Type');
            }
            return body;
          },
        ],
      }
    );
    return response.data;
  }

  const response = await apiClient.post<MaintenanceRequest>('/maintenance-requests/', {
    room_number: data.room_number,
    issue_type: data.issue_type,
    description: data.description,
    priority: data.priority,
  });
  return response.data;
};

/**
 * Approve a leave request (warden action)
 */
export const approveLeaveRequest = async (
  absenceId: string
): Promise<LeaveRequest> => {
  const response = await apiClient.post<{
    absence_record: LeaveRequest;
  }>('/approve-leave-request/', {
    absence_id: absenceId,
    reason: 'Approved by warden',
  });
  return response.data.absence_record;
};

/**
 * Reject a leave request (warden action)
 */
export const rejectLeaveRequest = async (
  absenceId: string,
  rejectionReason: string
): Promise<LeaveRequest> => {
  const response = await apiClient.post<{
    absence_record: LeaveRequest;
  }>('/reject-leave-request/', {
    absence_id: absenceId,
    reason: rejectionReason,
  });
  return response.data.absence_record;
};

/**
 * Approve a guest request (warden action)
 */
export const approveGuestRequest = async (
  requestId: string
): Promise<GuestRequest> => {
  const response = await apiClient.post<{
    request: GuestRequest;
  }>('/approve-request/', {
    request_type: 'guest',
    request_id: requestId,
    reason: 'Approved by warden',
  });
  return response.data.request;
};

/**
 * Reject a guest request (warden action)
 */
export const rejectGuestRequest = async (
  requestId: string,
  rejectionReason: string
): Promise<GuestRequest> => {
  const response = await apiClient.post<{
    request: GuestRequest;
  }>('/reject-request/', {
    request_type: 'guest',
    request_id: requestId,
    reason: rejectionReason,
  });
  return response.data.request;
};

/**
 * Approve a maintenance request (warden action)
 */
export const approveMaintenanceRequest = async (
  requestId: string
): Promise<MaintenanceRequest> => {
  const response = await apiClient.post<{
    request: MaintenanceRequest;
  }>('/approve-request/', {
    request_type: 'maintenance',
    request_id: requestId,
    reason: 'Assigned by warden',
  });
  return response.data.request;
};

/**
 * Reject a maintenance request (warden action)
 */
export const rejectMaintenanceRequest = async (
  requestId: string,
  rejectionReason: string
): Promise<MaintenanceRequest> => {
  const response = await apiClient.post<{
    request: MaintenanceRequest;
  }>('/reject-request/', {
    request_type: 'maintenance',
    request_id: requestId,
    reason: rejectionReason,
  });
  return response.data.request;
};
