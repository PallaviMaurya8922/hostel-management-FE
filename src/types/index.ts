// Status types
export type Status =
  | 'active'
  | 'pending'
  | 'rejected'
  | 'approved'
  | 'expired'
  | 'cancelled';
export type Priority = 'low' | 'medium' | 'high';
export type MaintenanceStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// User types
export interface Student {
  student_id: string;
  name: string;
  email?: string;
  room_number: string;
  block?: string;
  phone: string;
  parent_phone?: string;
  violation_count?: number;
  last_violation_date?: string;
  has_recent_violations?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Digital Pass types
export interface DigitalPass {
  pass_number: string;
  student_name: string;
  student_id: string;
  room_number: string;
  verification_code: string;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string;
  status: Status;
  approval_type: 'auto' | 'manual';
  is_valid: boolean;
  days_remaining: number;
  created_at: string;
}

// Leave Request types (AbsenceRecord)
export interface LeaveRequest {
  absence_id: string;
  student: string;
  student_number?: string;
  student_name: string;
  student_room: string;
  student_contact?: string;
  start_date: string;
  end_date: string;
  reason: string;
  emergency_contact: string;
  status: Status;
  auto_approved: boolean;
  parent_approval: boolean | null;
  parent_response_at?: string;
  approval_reason?: string;
  approved_by?: string;
  approved_by_name?: string;
  duration_days: number;
  is_short_leave: boolean;
  created_at: string;
  updated_at: string;
}

// Guest Request types
export interface GuestRequest {
  request_id: string;
  student: string;
  student_name: string;
  student_room: string;
  student_contact?: string;
  guest_name: string;
  visit_type: 'normal' | 'overnight';
  relationship?: string;
  relationship_display?: string;
  guest_phone: string;
  start_date: string;
  end_date: string;
  purpose: string;
  status: Status;
  auto_approved: boolean;
  qr_token?: string;
  qr_image_path?: string;
  qr_generated_at?: string;
  approval_reason?: string;
  approved_by?: string;
  approved_by_name?: string;
  duration_days: number;
  is_short_stay: boolean;
  created_at: string;
  updated_at: string;
}

// Maintenance Request types
export interface MaintenanceRequest {
  request_id: string;
  student: string;
  student_name: string;
  student_contact?: string;
  room_number: string;
  issue_type: string;
  description: string;
  priority: Priority;
  status: MaintenanceStatus;
  auto_approved: boolean;
  assigned_to?: string;
  assigned_to_name?: string;
  estimated_completion?: string;
  actual_completion?: string;
  notes?: string;
  /** Absolute or relative URL of optional student photo */
  attachment?: string | null;
  is_overdue: boolean;
  days_pending: number;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
