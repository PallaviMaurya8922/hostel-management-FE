import apiClient from './client';
import { normalizeListResponse } from './normalize';

export interface SecurityStats {
  active_passes: number;
  students_away: number;
  expired_passes: number;
}

export interface ActivePass {
  pass_number: string;
  verification_code: string;
  student_name: string;
  student_id: string;
  room_number: string;
  block: string;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string;
  days_remaining: number;
  approval_type: 'auto' | 'manual';
  created_at: string;
}

export interface RecentVerification {
  student_name: string;
  student_id: string;
  pass_number: string;
  verified_by: string;
  verification_time: string | null;
  status: string;
  notes: string;
}

export interface StudentPassSearchResult {
  student_id: string;
  name: string;
  room_number: string;
  block: string;
  email?: string;
  has_active_pass: boolean;
  active_passes: Array<{
    pass_number: string;
    verification_code: string;
    from_date: string;
    to_date: string;
    total_days: number;
    reason: string;
    is_valid: boolean;
    days_remaining: number;
  }>;
}

export interface PassVerificationResult {
  valid: boolean;
  message?: string;
  error?: string;
  student_name?: string;
  student_id?: string;
  room_number?: string;
  pass_number?: string;
  status?: string;
}

export interface GuestQrVerificationResult {
  valid: boolean;
  message?: string;
  reason?: string;
  guest_name?: string;
  guest_phone?: string;
  host_student?: string;
  host_student_id?: string;
  host_room?: string;
  visit_type?: 'normal' | 'overnight';
  visit_purpose?: string;
  valid_from?: string;
  valid_until?: string;
  request_id?: string;
  verified_at?: string;
}

export interface ApprovedGuestQr {
  request_id: string;
  guest_name: string;
  guest_phone: string;
  host_student: string;
  host_room: string;
  visit_type: 'normal' | 'overnight';
  valid_from: string;
  valid_until: string;
  qr_token: string;
}

export const getSecurityStats = async (): Promise<SecurityStats> => {
  const response = await apiClient.get<{ success: boolean; stats: SecurityStats }>('/security/stats/');
  return response.data.stats;
};

export const getActivePasses = async (): Promise<ActivePass[]> => {
  const response = await apiClient.get<{ success: boolean; active_passes: ActivePass[] }>('/security/active-passes/');
  return response.data.active_passes || [];
};

export const getRecentVerifications = async (): Promise<RecentVerification[]> => {
  const response = await apiClient.get<{ success: boolean; recent_verifications: RecentVerification[] }>('/security/recent-verifications/');
  return response.data.recent_verifications || [];
};

export const searchStudentPasses = async (query: string): Promise<StudentPassSearchResult[]> => {
  const response = await apiClient.get<{ success: boolean; students: StudentPassSearchResult[] }>('/security/search-students/', {
    params: { q: query },
  });
  return response.data.students || [];
};

export const verifyDigitalPass = async (
  passNumber: string,
  verifiedBy: string,
  token?: string
): Promise<PassVerificationResult> => {
  const response = await apiClient.post<{
    success: boolean;
    verification_result: PassVerificationResult;
  }>('/verify-pass/', {
    pass_number: passNumber,
    verified_by: verifiedBy,
    token: token || '',
  });

  return response.data.verification_result;
};

export const verifyGuestQr = async (qrToken: string): Promise<GuestQrVerificationResult> => {
  const response = await apiClient.get<GuestQrVerificationResult>(`/guest/verify/${encodeURIComponent(qrToken)}/`);
  return response.data;
};

export const getApprovedGuestQrs = async (): Promise<ApprovedGuestQr[]> => {
  const response = await apiClient.get('/guest-requests/');
  const items = normalizeListResponse<any>(response.data, 'guest_requests', 'guests', 'data');

  return items
    .filter(item => item.status === 'approved' && item.qr_token)
    .map(item => ({
      request_id: item.request_id,
      guest_name: item.guest_name,
      guest_phone: item.guest_phone || '',
      host_student: item.student_name,
      host_room: item.student_room,
      visit_type: item.visit_type,
      valid_from: item.start_date,
      valid_until: item.end_date,
      qr_token: item.qr_token,
    }));
};
