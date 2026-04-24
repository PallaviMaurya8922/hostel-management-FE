import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AppShell from '../components/AppShell';
import NoticeBoardDisplay from '../components/dashboard/NoticeBoardDisplay';
import { getAllNotices } from '../api/notices';

const StudentNoticeBoardPage: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: getAllNotices,
  });

  return (
    <AppShell pageTitle="Notice Board">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-surface-200/80 dark:border-slate-700 shadow-glass-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Hostel Notice Board</h2>
          <NoticeBoardDisplay notices={notices} isLoading={isLoading} />
        </div>

        <footer className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-surface-200/80 dark:border-slate-700 px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
            <p className="text-slate-700 dark:text-slate-200 font-medium">HostelOps Student Portal</p>
            <p className="text-slate-500 dark:text-slate-400">
              © {currentYear} Hostel Management System. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </AppShell>
  );
};

export default StudentNoticeBoardPage;