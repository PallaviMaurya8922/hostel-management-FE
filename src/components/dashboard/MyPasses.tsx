import React, { useState, useMemo } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { usePasses } from '../../hooks/usePasses';
import DigitalPassCard from './DigitalPassCard';
import Badge from '../Badge';
import Button from '../Button';
import { SkeletonCard } from '../Skeleton';
import LeaveRequestModal from '../modals/LeaveRequestModal';

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
}

const MyPasses: React.FC = () => {
  const { data: passes, isLoading, error } = usePasses();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const sortedPasses = useMemo(() => {
    if (!passes) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...passes].sort((a, b) => {
      const getPriority = (pass: typeof a) => {
        const fromDate = new Date(`${pass.from_date}T00:00:00`);
        const toDate = new Date(`${pass.to_date}T00:00:00`);

        if (pass.status === 'active' && today >= fromDate && today <= toDate) return 1;
        if (pass.status === 'active' && today < fromDate) return 2;
        if (pass.status === 'pending') return 3;
        return 4;
      };
      return getPriority(a) - getPriority(b);
    });
  }, [passes]);

  if (isLoading) {
    return (
      <section className="mb-6" aria-label="My passes">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">My Passes</h2>
        </div>
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-6" aria-label="My passes">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">My Passes</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
          <p className="text-sm text-red-700">Failed to load passes. Please try again later.</p>
        </div>
      </section>
    );
  }

  if (!sortedPasses || sortedPasses.length === 0) {
    return (
      <section className="mb-6" aria-label="My passes">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">My Passes</h2>
          <Badge variant="info">0</Badge>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="w-7 h-7 text-slate-400" aria-hidden="true" />
          </div>
          <p className="text-sm text-slate-500 mb-4">No active passes</p>
          <Button
            variant="primary"
            size="small"
            onClick={() => setIsLeaveModalOpen(true)}
            aria-label="Apply for leave"
          >
            Apply for Leave
          </Button>
        </div>
        <LeaveRequestModal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
        />
      </section>
    );
  }

  return (
    <>
      <section className="mb-6" aria-label="My passes">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">My Passes</h2>
          <Badge variant="success">{sortedPasses.length}</Badge>
        </div>
        <div className="space-y-3">
          {sortedPasses.map(pass => (
            <DigitalPassCard
              key={pass.pass_number}
              pass={pass}
              onDownloadSuccess={() => showToast('Pass downloaded successfully', 'success')}
              onDownloadError={(msg) => showToast(msg, 'error')}
            />
          ))}
        </div>
      </section>

      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
      />

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-glass text-sm font-medium animate-slideIn ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
          role="alert"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}
    </>
  );
};

export default MyPasses;
