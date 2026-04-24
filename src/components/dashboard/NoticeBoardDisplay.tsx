import React, { useMemo } from 'react';
import { formatRelativeTime } from '../../utils/dateUtils';
import type { Notice } from '../../api/notices';
import {
  Bars3Icon,
} from '@heroicons/react/24/outline';

interface NoticeBoardDisplayProps {
  notices: Notice[];
  isLoading?: boolean;
}

const NoticeBoardDisplay: React.FC<NoticeBoardDisplayProps> = ({ notices, isLoading = false }) => {
  const sortedNotices = useMemo(() => {
    return [...notices].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [notices]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-surface-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (sortedNotices.length === 0) {
    return (
      <div className="rounded-lg border border-surface-200 bg-surface-50 p-6 text-center">
        <Bars3Icon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No notices at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedNotices.map(notice => {
        return (
          <div
            key={notice.notice_id}
            className="rounded-lg border border-surface-200 bg-surface-50 p-4 transition-all hover:shadow-md dark:border-emerald-700/70 dark:bg-emerald-950/70"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-emerald-100">{notice.title}</h3>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200 mb-2 line-clamp-2">{notice.content}</p>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-emerald-200">
                  <span>by {notice.warden_name}</span>
                  <span>{formatRelativeTime(notice.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NoticeBoardDisplay;
