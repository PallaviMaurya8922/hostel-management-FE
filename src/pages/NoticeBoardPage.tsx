import React from 'react';
import AppShell from '../components/AppShell';
import NoticeBoardManager from '../components/warden/NoticeBoardManager';

/**
 * Dedicated Notice Board Management Page for Wardens
 * Allows wardens to create, edit, and manage hostel notices
 */
const NoticeBoardPage: React.FC = () => {
  return (
    <AppShell pageTitle="Notice Board Management">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <NoticeBoardManager />
      </div>
    </AppShell>
  );
};

export default NoticeBoardPage;
