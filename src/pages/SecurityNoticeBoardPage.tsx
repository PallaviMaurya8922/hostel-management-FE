import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AppShell from '../components/AppShell';
import NoticeBoardDisplay from '../components/dashboard/NoticeBoardDisplay';
import { getAllNotices } from '../api/notices';

const SecurityNoticeBoardPage: React.FC = () => {
  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['notices', 'security'],
    queryFn: getAllNotices,
  });

  return (
    <AppShell pageTitle="Security Notice Board">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-surface-200/80 dark:border-slate-700 shadow-glass-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Security Notice Board</h2>
          <NoticeBoardDisplay notices={notices} isLoading={isLoading} />
        </div>
      </div>
    </AppShell>
  );
};

export default SecurityNoticeBoardPage;
