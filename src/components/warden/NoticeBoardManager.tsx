import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Button from '../Button';
import Modal from '../Modal';
import Input from '../Input';
import Textarea from '../Textarea';
import { useToast } from '../../contexts';
import { useAuth } from '../../contexts';
import {
  getAllNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  type Notice,
  type CreateNoticeData,
} from '../../api/notices';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Bars3Icon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../utils/dateUtils';

const audienceBadgeClasses: Record<'student' | 'security', string> = {
  student: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700/60',
  security: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/60',
};

const priorityBadgeClasses: Record<'low' | 'medium' | 'high' | 'urgent', string> = {
  low: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
  medium: 'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-200 dark:border-cyan-700/60',
  high: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700/60',
  urgent: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700/60',
};

const priorityLabels: Record<'low' | 'medium' | 'high' | 'urgent', string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const NoticeBoardManager: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState<CreateNoticeData>({
    title: '',
    content: '',
    priority: 'medium',
    target_audience: 'student',
  });
  const canManageNotices = user?.role !== 'admin';

  const { data: notices = [], isLoading, refetch } = useQuery({
    queryKey: ['notices'],
    queryFn: getAllNotices,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateNoticeData) => createNotice(data),
    onSuccess: () => {
      showToast('Notice created successfully', 'success');
      setIsModalOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      showToast('Failed to create notice', 'error');
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; data: CreateNoticeData }) =>
      updateNotice(data.id, data.data),
    onSuccess: () => {
      showToast('Notice updated successfully', 'success');
      setIsModalOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      showToast('Failed to update notice', 'error');
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (noticeId: string) => deleteNotice(noticeId),
    onSuccess: () => {
      showToast('Notice deleted successfully', 'success');
      refetch();
    },
    onError: (error) => {
      showToast('Failed to delete notice', 'error');
      console.error(error);
    },
  });

  const resetForm = () => {
    setFormData({ title: '', content: '', priority: 'medium', target_audience: 'student' });
    setEditingNotice(null);
  };

  const handleOpenModal = (notice?: Notice) => {
    if (!canManageNotices) return;

    if (notice) {
      setEditingNotice(notice);
      setFormData({
        title: notice.title,
        content: notice.content,
        priority: notice.priority,
        target_audience: notice.target_audience,
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }

    if (!formData.content.trim()) {
      showToast('Content is required', 'error');
      return;
    }

    if (editingNotice) {
      updateMutation.mutate({ id: editingNotice.notice_id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (noticeId: string) => {
    if (confirm('Are you sure you want to delete this notice?')) {
      deleteMutation.mutate(noticeId);
    }
  };

  const sortedNotices = [...notices].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-surface-200/80 dark:border-slate-700 bg-white/95 dark:bg-slate-900/80 p-5 sm:p-6 shadow-glass-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Notice Board</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {sortedNotices.length} {sortedNotices.length === 1 ? 'active notice' : 'active notices'}
            </p>
          </div>
          {canManageNotices && (
            <Button
              onClick={() => handleOpenModal()}
              icon={<PlusIcon className="w-4 h-4" />}
            >
              Post Notice
            </Button>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-surface-200/80 dark:border-slate-700 bg-surface-50/80 dark:bg-slate-800/40 px-4 py-3">
          {canManageNotices ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Publish clear, timely updates for students and security teams from one place.
            </p>
          ) : (
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <ShieldCheckIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span>Admin visibility only. This notice board is read-only.</span>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : sortedNotices.length === 0 ? (
        <div className="rounded-lg border border-surface-200 dark:border-slate-700 bg-surface-50 dark:bg-slate-900/60 p-8 text-center">
          <Bars3Icon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-300">No notices posted yet.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Click "Post Notice" to add one</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedNotices.map(notice => {
            return (
              <div
                key={notice.notice_id}
                className="rounded-xl border border-surface-200/90 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">{notice.title}</h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          audienceBadgeClasses[notice.target_audience]
                        }`}
                      >
                        {notice.target_audience === 'security' ? 'Security' : 'Student'}
                      </span>
                      {canManageNotices && (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            priorityBadgeClasses[notice.priority]
                          }`}
                        >
                          {priorityLabels[notice.priority]} priority
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200 mb-3 leading-relaxed whitespace-pre-wrap">
                      {notice.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <span>Posted by {notice.warden_name}</span>
                      <span className="hidden sm:inline text-slate-400 dark:text-slate-500">•</span>
                      <span>{formatRelativeTime(notice.created_at)}</span>
                    </div>
                  </div>
                  {canManageNotices && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleOpenModal(notice)}
                        className="p-2 rounded-lg border border-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                        title="Edit notice"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notice.notice_id)}
                        className="p-2 rounded-lg border border-transparent text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 hover:border-red-100 dark:hover:border-red-700/60 transition-colors"
                        title="Delete notice"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingNotice ? 'Edit Notice' : 'Post New Notice'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            type="text"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Maintenance Schedule Updated"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
              Audience
            </label>
            <select
              value={formData.target_audience}
              onChange={e =>
                setFormData({
                  ...formData,
                  target_audience: e.target.value as 'student' | 'security',
                })
              }
              className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="student">Student</option>
              <option value="security">Security</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={e =>
                setFormData({
                  ...formData,
                  priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent',
                })
              }
              className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <Textarea
            label="Content"
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            placeholder="Write the details of the notice..."
            rows={5}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingNotice ? 'Update Notice' : 'Post Notice'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NoticeBoardManager;
