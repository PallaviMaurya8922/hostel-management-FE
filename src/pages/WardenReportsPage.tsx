import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppShell from '../components/AppShell';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { useToast } from '../contexts';
import {
  getStudentsPresent,
  getWardenDashboardStats,
  updateStudentByStaff,
  deleteStudentByStaff,
  type PresentStudent,
} from '../api/warden';

const WardenReportsPage: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [editingStudent, setEditingStudent] = useState<PresentStudent | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<PresentStudent | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [filters, setFilters] = useState({
    studentName: '',
    roomNumber: '',
    block: '',
  });
  const [editForm, setEditForm] = useState({
    email: '',
    room_number: '',
    block: '',
    phone: '',
    parent_phone: '',
  });
  const [editErrors, setEditErrors] = useState({
    room_number: '',
    block: '',
    phone: '',
    parent_phone: '',
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['warden-report-stats'],
    queryFn: getWardenDashboardStats,
    staleTime: 1000 * 30,
  });

  const { data: presentStudents = [], isLoading: isPresentLoading } = useQuery({
    queryKey: ['warden-present-students'],
    queryFn: getStudentsPresent,
    staleTime: 1000 * 30,
  });

  const filteredStudents = useMemo(() => {
    const nameFilter = filters.studentName.trim().toLowerCase();
    const roomFilter = filters.roomNumber.trim().toLowerCase();
    const blockFilter = filters.block.trim().toLowerCase();

    return presentStudents.filter(student => {
      const matchesName =
        !nameFilter || student.name.toLowerCase().includes(nameFilter);
      const matchesRoom =
        !roomFilter ||
        String(student.room_number).toLowerCase().includes(roomFilter);
      const matchesBlock =
        !blockFilter || String(student.block).toLowerCase().includes(blockFilter);

      return matchesName && matchesRoom && matchesBlock;
    });
  }, [presentStudents, filters]);

  const updateMutation = useMutation({
    mutationFn: updateStudentByStaff,
    onSuccess: data => {
      showToast(data.message || 'Student updated successfully', 'success');
      setEditingStudent(null);
      queryClient.invalidateQueries({ queryKey: ['warden-present-students'] });
      queryClient.invalidateQueries({ queryKey: ['warden-report-stats'] });
    },
    onError: () => {
      showToast('Failed to update student profile', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (payload: { studentId: string; reason: string }) =>
      deleteStudentByStaff(payload.studentId, payload.reason),
    onSuccess: data => {
      showToast(data.message || 'Student deleted successfully', 'success');
      setDeletingStudent(null);
      setDeleteReason('');
      queryClient.invalidateQueries({ queryKey: ['warden-present-students'] });
      queryClient.invalidateQueries({ queryKey: ['warden-report-stats'] });
    },
    onError: () => {
      showToast('Failed to delete student account', 'error');
    },
  });

  const handleOpenEdit = (student: PresentStudent) => {
    setEditingStudent(student);
    setEditErrors({
      room_number: '',
      block: '',
      phone: '',
      parent_phone: '',
    });
    setEditForm({
      email: '',
      room_number: student.room_number || '',
      block: student.block || '',
      phone: student.phone || '',
      parent_phone: student.parent_phone || '',
    });
  };

  const handleEditFieldChange = (
    field: 'email' | 'room_number' | 'block' | 'phone' | 'parent_phone',
    value: string
  ) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    if (field !== 'email') {
      setEditErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) {
      return;
    }

    const nextErrors = {
      room_number: '',
      block: '',
      phone: '',
      parent_phone: '',
    };

    if (!editForm.room_number.trim() || !editForm.block.trim()) {
      if (!editForm.room_number.trim()) {
        nextErrors.room_number = 'Room is required';
      }
      if (!editForm.block.trim()) {
        nextErrors.block = 'Block is required';
      }
    }

    const phoneDigits = editForm.phone.replace(/\D/g, '');
    const parentPhoneRaw = editForm.parent_phone.trim();
    const parentPhoneDigits = parentPhoneRaw.replace(/\D/g, '');

    if (!/^\d{10}$/.test(phoneDigits)) {
      nextErrors.phone = 'Invalid phone number';
    }

    if (parentPhoneRaw.startsWith('+')) {
      nextErrors.parent_phone = 'Do not include + before country code';
    }

    if (!nextErrors.parent_phone && !/^\d{12}$/.test(parentPhoneDigits)) {
      nextErrors.parent_phone = 'Invalid parent contact number';
    }

    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) {
      setEditErrors(nextErrors);
      showToast('Please correct the highlighted fields', 'error');
      return;
    }

    await updateMutation.mutateAsync({
      student_id: editingStudent.student_id,
      email: editForm.email.trim(),
      room_number: editForm.room_number.trim(),
      block: editForm.block.trim().toUpperCase(),
      phone: phoneDigits,
      parent_phone: parentPhoneDigits,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudent) {
      return;
    }

    if (!deleteReason.trim()) {
      showToast('Please provide a reason for deletion', 'error');
      return;
    }

    await deleteMutation.mutateAsync({
      studentId: deletingStudent.student_id,
      reason: deleteReason.trim(),
    });
  };

  return (
    <AppShell pageTitle="Reports">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Hostel Reports</h1>
                  <p className="text-slate-600 mt-1">
                    Live hostel overview with student presence and request analytics.
                  </p>
                </div>
              </div>
            </div>


          {isStatsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Skeleton height="96px" />
                <Skeleton height="96px" />
                <Skeleton height="96px" />
                <Skeleton height="96px" />
                <Skeleton height="96px" />
                <Skeleton height="96px" />
              </div>
            )}

            {!isStatsLoading && stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-4">
                  <div className="text-sm text-slate-600">Total Students</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total_students}</div>
                </div>
                <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-4">
                  <div className="text-sm text-slate-600">Present</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.present_students}</div>
                </div>
                <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-4">
                  <div className="text-sm text-slate-600">Total Absences Recorded</div>
                  <div className="text-2xl font-bold text-amber-600 mt-1">{stats.absent_students}</div>
                </div>
                <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-4">
                  <div className="text-sm text-slate-600">Active Guests</div>
                  <div className="text-2xl font-bold text-brand-600 mt-1">{stats.active_guests}</div>
                </div>
                <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-4">
                  <div className="text-sm text-slate-600">Pending Requests</div>
                  <div className="text-2xl font-bold text-rose-600 mt-1">{stats.total_pending_requests}</div>
                </div>
                <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-4">
                  <div className="text-sm text-slate-600">Occupancy</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{stats.occupancy_rate}%</div>
                </div>
              </div>
          )}

          <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-5">
                Students Present In Hostel ({filteredStudents.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Input
                  label="Search by Student Name"
                  value={filters.studentName}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, studentName: e.target.value }))
                  }
                  placeholder="e.g. Puneet"
                />
                <Input
                  label="Filter by Room No"
                  value={filters.roomNumber}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, roomNumber: e.target.value }))
                  }
                  placeholder="e.g. 324"
                />
                <Input
                  label="Filter by Block"
                  value={filters.block}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, block: e.target.value.toUpperCase() }))
                  }
                  placeholder="e.g. C"
                />
              </div>

              {isPresentLoading && (
                <div className="space-y-3">
                  <Skeleton height="56px" />
                  <Skeleton height="56px" />
                  <Skeleton height="56px" />
                </div>
              )}

              {!isPresentLoading && presentStudents.length === 0 && (
                <p className="text-slate-500 text-center py-6">No present student records available.</p>
              )}

              {!isPresentLoading && presentStudents.length > 0 && filteredStudents.length === 0 && (
                <p className="text-slate-500 text-center py-6">No students match current filters.</p>
              )}

              {!isPresentLoading && filteredStudents.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600 border-b border-surface-200">
                        <th className="py-3 pr-3">Student</th>
                        <th className="py-3 pr-3">ID</th>
                        <th className="py-3 pr-3">Room</th>
                        <th className="py-3 pr-3">Block</th>
                        <th className="py-3 pr-3">Contact Number</th>
                        <th className="py-3 pr-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(student => (
                        <tr key={student.student_id} className="border-b border-surface-100">
                          <td className="py-3 pr-3 font-medium text-slate-900">{student.name}</td>
                          <td className="py-3 pr-3">{student.student_id}</td>
                          <td className="py-3 pr-3">{student.room_number}</td>
                          <td className="py-3 pr-3">{student.block}</td>
                          <td className="py-3 pr-3">{student.phone || '-'}</td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2">
                              <Button size="small" variant="secondary" onClick={() => handleOpenEdit(student)}>
                                Edit
                              </Button>
                              <Button
                                size="small"
                                variant="danger"
                                className="bg-red-500 hover:bg-red-600 active:bg-red-700"
                                onClick={() => {
                                  setDeletingStudent(student);
                                  setDeleteReason('');
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title={`Edit Student (${editingStudent?.student_id || ''})`}
        footer={
          <div className="flex items-center justify-end gap-4 w-full">
            <Button variant="secondary" onClick={() => setEditingStudent(null)}>
              Cancel
            </Button>
            <Button loading={updateMutation.isPending} onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-600">
            Update room, block, and contact details. Leave email blank to keep the existing email.
          </p>

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Optional</p>
            <Input
              label="Email"
              type="email"
              value={editForm.email}
              onChange={e => handleEditFieldChange('email', e.target.value)}
              placeholder="Enter new email (optional)"
            />
          </div>

          <div className="space-y-4 pt-1">
            <Input
              label="Room"
              value={editForm.room_number}
              onChange={e => handleEditFieldChange('room_number', e.target.value)}
              error={editErrors.room_number}
              required
            />
            <Input
              label="Block"
              value={editForm.block}
              onChange={e => handleEditFieldChange('block', e.target.value)}
              error={editErrors.block}
              required
            />
          </div>

          <div className="space-y-4 pt-1">
            <Input
              label="Contact Number"
              value={editForm.phone}
              onChange={e => handleEditFieldChange('phone', e.target.value)}
              error={editErrors.phone}
            />
            <Input
              label="Parent Contact Number"
              type="tel"
              inputMode="tel"
              value={editForm.parent_phone}
              onChange={e => handleEditFieldChange('parent_phone', e.target.value)}
              error={editErrors.parent_phone}
              helperText="Enter number with country code (e.g., 919876543210)"
              placeholder="919876543210"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        title="Delete Student Account"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingStudent(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={handleConfirmDelete}>
              Delete Permanently
            </Button>
          </>
        }
      >
        <p className="text-slate-700">
          Delete student <span className="font-semibold">{deletingStudent?.name}</span> ({deletingStudent?.student_id})?
        </p>
        <p className="text-sm text-red-600 mt-2">
          This removes the account and linked requests so data will not reappear.
        </p>
        <div className="mt-4">
          <Input
            label="Reason for deletion"
            value={deleteReason}
            onChange={e => setDeleteReason(e.target.value)}
            placeholder="Enter deletion reason"
            required
          />
        </div>
      </Modal>
    </AppShell>
  );
};

export default WardenReportsPage;
