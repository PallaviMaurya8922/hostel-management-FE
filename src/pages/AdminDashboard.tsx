import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UsersIcon,
  SignalIcon,
  ClockIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  WrenchScrewdriverIcon,
  PlusIcon,
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import AppShell from '../components/AppShell';
import Button from '../components/Button';
import Badge, { type BadgeVariant } from '../components/Badge';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Skeleton from '../components/Skeleton';
import { useAuth, useToast } from '../contexts';
import apiClient from '../api/client';
import { normalizeListResponse } from '../api/normalize';
import {
  createStaffAccount,
  deleteStaffByAdmin,
  deleteStudentByStaff,
  type CreateStaffData,
} from '../api/warden';

interface Student {
  student_id: string;
  name: string;
  room_number: string;
  block: string;
  phone?: string;
  created_at?: string;
}

interface Staff {
  staff_id: string;
  name: string;
  email: string;
  role: string;
  is_active?: boolean;
  created_at?: string;
}

interface LeaveRequest {
  status: string;
}

interface GuestRequest {
  status: string;
}

interface MaintenanceRequestSummary {
  status: string;
}

const ROLE_CARDS = [
  {
    name: 'Admin',
    description: 'Full system access. Manages users, roles, and global settings.',
    icon: ShieldCheckIcon,
    bgColor: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  {
    name: 'Warden',
    description: 'Approves leave and guest requests. Monitors student presence.',
    icon: LockClosedIcon,
    bgColor: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    name: 'Security',
    description: 'Verifies digital passes and manages gate entry/exit logs.',
    icon: WrenchScrewdriverIcon,
    bgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    name: 'Maintenance Head',
    description: 'Tracks complaints, assigns work, and updates resolution status.',
    icon: UserPlusIcon,
    bgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
];

function formatRoleLabel(role: string) {
  if (role === 'maintenance') return 'Maintenance Head';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getRoleBadgeVariant(role: string): BadgeVariant {
  if (role === 'admin') return 'info';
  if (role === 'warden') return 'warning';
  if (role === 'maintenance') return 'success';
  if (role === 'security') return 'info';
  return 'info';
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  type CreatedStaffCredentials = {
    staffId: string;
    role: 'warden' | 'security' | 'maintenance';
    defaultPassword: string;
  };
  type DeleteTarget = {
    type: 'student' | 'staff';
    id: string;
    name: string;
  };

  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [openMaintenanceCount, setOpenMaintenanceCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateStaffData>({
    name: '',
    role: 'warden',
    email: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreateStaffData, string>>>({});
  const [createdStaffCredentials, setCreatedStaffCredentials] = useState<CreatedStaffCredentials | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studentsRes, staffRes, leavesRes, guestsRes, maintenanceRes] = await Promise.all([
        apiClient.get<Student[] | { results: Student[] }>('/students/'),
        apiClient.get<Staff[] | { results: Staff[] }>('/staff/'),
        apiClient.get<LeaveRequest[] | { results: LeaveRequest[] }>('/absence-records/').catch(() => ({ data: [] as LeaveRequest[] })),
        apiClient.get<GuestRequest[] | { results: GuestRequest[] }>('/guest-requests/').catch(() => ({ data: [] as GuestRequest[] })),
        apiClient
          .get<MaintenanceRequestSummary[] | { results: MaintenanceRequestSummary[] }>('/maintenance-requests/')
          .catch(() => ({ data: [] as MaintenanceRequestSummary[] })),
      ]);

      const studentList = normalizeListResponse<Student>(studentsRes.data);
      const staffList = normalizeListResponse<Staff>(staffRes.data);
      const leaveList = normalizeListResponse<LeaveRequest>(leavesRes.data);
      const guestList = normalizeListResponse<GuestRequest>(guestsRes.data);
      const maintenanceList = normalizeListResponse<MaintenanceRequestSummary>(maintenanceRes.data);

      setStudents(studentList);
      setStaff(staffList);

      const pending =
        leaveList.filter(r => r.status === 'pending').length +
        guestList.filter(r => r.status === 'pending').length;
      setPendingCount(pending);
      setOpenMaintenanceCount(
        maintenanceList.filter(r => ['pending', 'assigned', 'in_progress'].includes(r.status)).length
      );
    } catch {
      showToast('Failed to load admin data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalStudents = students.length;
  const activeStaffCount = useMemo(() => staff.filter(member => member.is_active !== false).length, [staff]);

  const handleFormChange = (field: keyof CreateStaffData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateForm = (data: CreateStaffData) => {
    const errors: Partial<Record<keyof CreateStaffData, string>> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = data.phone.replace(/\D/g, '');

    if (!data.name.trim()) errors.name = 'Full name is required';
    if (!data.role.trim()) errors.role = 'Role is required';
    if (!data.email.trim()) errors.email = 'Email is required';
    else if (!emailRegex.test(data.email.trim())) errors.email = 'Enter a valid email address';
    if (!data.phone.trim()) errors.phone = 'Phone number is required';
    else if (phoneDigits.length !== 10) errors.phone = 'Enter a valid 10-digit phone number';

    return errors;
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned: CreateStaffData = {
      name: formData.name.trim(),
      role: formData.role,
      email: formData.email.trim(),
      phone: formData.phone.replace(/\D/g, ''),
    };
    const errors = validateForm(cleaned);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Please fix form errors before submitting', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const response = await createStaffAccount(cleaned);
      showToast('Staff account created successfully', 'success');
      setFormData({ name: '', role: 'warden', email: '', phone: '' });
      setFormErrors({});
      setIsCreateOpen(false);
      setCreatedStaffCredentials({
        staffId: response.staff.staff_id,
        role: response.staff.role,
        defaultPassword: response.staff.default_password,
      });
      fetchData();
    } catch {
      showToast('Failed to create staff account', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'student') {
        await deleteStudentByStaff(deleteTarget.id);
      } else {
        await deleteStaffByAdmin(deleteTarget.id);
      }
      showToast('User deleted successfully', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch {
      showToast('Failed to delete user', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const statCards = [
    { label: 'Total Students', value: totalStudents, icon: UsersIcon, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Active Staff', value: activeStaffCount, icon: SignalIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Approvals', value: pendingCount, icon: ClockIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
    {
      label: 'Active complaints',
      value: openMaintenanceCount,
      icon: WrenchScrewdriverIcon,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ];

  return (
    <>
      <AppShell pageTitle="User & Role Management" showSearch>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-slate-500">
              Manage system access, define roles, and configure integrations.
            </p>
            <Button
              className="!bg-gradient-to-r !from-cyan-500 !to-blue-600 !text-white hover:!from-cyan-600 hover:!to-blue-700 !shadow-md"
              icon={<PlusIcon className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Add New User
            </Button>
          </div>

          {/* Stats Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} height="96px" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {statCards.map(card => (
                <div
                  key={card.label}
                  className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-5 flex items-center gap-4"
                >
                  <div className={`${card.bg} w-11 h-11 rounded-xl flex items-center justify-center`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</p>
                    <p className="text-2xl font-bold text-slate-800 mt-0.5">{card.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Roles & Permissions */}
          <section>
            <h2 className="text-base font-semibold text-slate-800 mb-3">Roles &amp; Permissions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {ROLE_CARDS.map(role => (
                <div
                  key={role.name}
                  className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-5 flex items-start gap-4"
                >
                  <div className={`${role.bgColor} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <role.icon className={`w-5 h-5 ${role.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{role.name}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* System Users Table */}
          <section>
            <h2 className="text-base font-semibold text-slate-800 mb-3">System Users</h2>
            <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm overflow-hidden">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height="48px" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-surface-200">
                        <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                        <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                        <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Identifier</th>
                        <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map(s => (
                        <tr key={`staff-${s.staff_id}`} className="border-b border-surface-200 last:border-0">
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-medium text-slate-800">{s.name}</p>
                            <p className="text-xs text-slate-400">{s.email}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant={getRoleBadgeVariant(s.role)} size="small">
                              {formatRoleLabel(s.role)}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant="success" size="small">Active</Badge>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-400">{s.staff_id}</td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => setDeleteTarget({ type: 'staff', id: s.staff_id, name: s.name })}
                              className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                              aria-label={`Delete ${s.name}`}
                              disabled={s.staff_id === user?.id}
                              title={s.staff_id === user?.id ? 'You cannot delete your own account' : 'Delete staff account'}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {students.map(s => (
                        <tr key={`stu-${s.student_id}`} className="border-b border-surface-200 last:border-0">
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-medium text-slate-800">{s.name}</p>
                            <p className="text-xs text-slate-400">
                              Room {s.room_number}, Block {s.block}
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant="info" size="small">Student</Badge>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant="success" size="small">Active</Badge>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-400">{s.student_id}</td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => setDeleteTarget({ type: 'student', id: s.student_id, name: s.name })}
                              className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                              aria-label={`Delete ${s.name}`}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {staff.length === 0 && students.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </AppShell>

      {/* Create Student Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New User"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" form="admin-create-staff" loading={isCreating}>Create Account</Button>
          </div>
        }
      >
        <form id="admin-create-staff" onSubmit={handleCreateStaff} className="space-y-5">
          <div className="space-y-4">
            <Input
              label="Full Name" required
              value={formData.name} error={formErrors.name}
              onChange={e => handleFormChange('name', e.target.value)}
              placeholder="Staff name"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={e => handleFormChange('role', e.target.value as CreateStaffData['role'])}
                className="w-full px-3 py-2.5 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="warden">Warden</option>
                <option value="security">Security</option>
                <option value="maintenance">Maintenance</option>
              </select>
              {formErrors.role && <p className="mt-1 text-xs text-red-600">{formErrors.role}</p>}
            </div>
            <Input
              label="Email" type="email" required
              value={formData.email} error={formErrors.email}
              onChange={e => handleFormChange('email', e.target.value)}
              placeholder="staff@example.com"
            />
            <Input
              label="Phone Number" type="tel" inputMode="tel" required
              value={formData.phone} error={formErrors.phone}
              onChange={e => handleFormChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              helperText="Enter 10-digit mobile number" placeholder="9876543210"
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!createdStaffCredentials}
        onClose={() => setCreatedStaffCredentials(null)}
        title="Staff Account Created"
        footer={
          <div className="flex items-center justify-end w-full">
            <Button onClick={() => setCreatedStaffCredentials(null)}>Close</Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Account created successfully.
          </p>
          <div className="rounded-lg border border-surface-200 bg-surface-50 p-3 space-y-1">
            <p><span className="font-semibold">User ID:</span> {createdStaffCredentials?.staffId}</p>
            <p><span className="font-semibold">Default Password:</span> {createdStaffCredentials?.defaultPassword}</p>
            <p><span className="font-semibold">Role:</span> {createdStaffCredentials?.role}</p>
          </div>
          <p className="text-xs text-slate-500">
            On first login, this staff member must change the default password before continuing.
          </p>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); }}
        title="Delete User"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="secondary" onClick={() => { setDeleteTarget(null); }}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteUser} loading={isDeleting}>Delete</Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 mb-4">
          Are you sure want to delete <span className="font-semibold">{deleteTarget?.name}</span> ({deleteTarget?.id})?
          This action cannot be undone.
        </p>
      </Modal>
    </>
  );
};

export default AdminDashboard;
