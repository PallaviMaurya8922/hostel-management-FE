import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import RequestCard from './RequestCard';
import { SkeletonCard } from '../Skeleton';
import Badge from '../Badge';
import Button from '../Button';
import LeaveRequestModal from '../modals/LeaveRequestModal';
import { useAllRequests } from '../../hooks/useRequests';
import type {
  LeaveRequest,
  GuestRequest,
  MaintenanceRequest,
} from '../../types';

interface RequestGroup {
  title: string;
  type: 'leave' | 'guest' | 'maintenance';
  requests: (LeaveRequest | GuestRequest | MaintenanceRequest)[];
  emptyMessage: string;
}

const PendingRequests: React.FC = () => {
  const { leaves, guests, maintenance, isLoading, isError, error } = useAllRequests();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    leave: true,
    guest: true,
    maintenance: true,
  });

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  }, []);

  const pendingLeaves = useMemo(
    () => leaves.data?.filter(req => req.status === 'pending') || [],
    [leaves.data]
  );
  const pendingGuests = useMemo(
    () => guests.data?.filter(req => req.status === 'pending') || [],
    [guests.data]
  );
  const pendingMaintenance = useMemo(
    () => maintenance.data?.filter(req => req.status === 'pending') || [],
    [maintenance.data]
  );

  const requestGroups: RequestGroup[] = useMemo(
    () => [
      { title: 'Leave Requests', type: 'leave', requests: pendingLeaves, emptyMessage: 'No pending leave requests' },
      { title: 'Guest Requests', type: 'guest', requests: pendingGuests, emptyMessage: 'No pending guest requests' },
      { title: 'Maintenance Requests', type: 'maintenance', requests: pendingMaintenance, emptyMessage: 'No pending maintenance requests' },
    ],
    [pendingLeaves, pendingGuests, pendingMaintenance]
  );

  const totalPending = useMemo(
    () => pendingLeaves.length + pendingGuests.length + pendingMaintenance.length,
    [pendingLeaves.length, pendingGuests.length, pendingMaintenance.length]
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-800">Pending Requests</h2>
        </div>
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-800">Pending Requests</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-red-600 mb-1">Failed to load requests</p>
          <p className="text-xs text-slate-500">{error?.message || 'An error occurred'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-slate-800">Pending Requests</h2>
        {totalPending > 0 && (
          <Badge variant="warning" size="medium">{totalPending} Total</Badge>
        )}
      </div>

      <div className="space-y-3">
        {requestGroups.map(group => {
          const isExpanded = expandedGroups[group.type];
          const count = group.requests.length;

          return (
            <div key={group.type} className="border border-surface-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleGroup(group.type)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleGroup(group.type);
                  }
                }}
                className="w-full flex items-center justify-between p-3.5 bg-surface-50 hover:bg-surface-100 transition-colors duration-150"
                aria-expanded={isExpanded}
                aria-controls={`${group.type}-requests`}
              >
                <div className="flex items-center gap-2.5">
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-slate-500" />
                  )}
                  <h3 className="text-sm font-medium text-slate-700">{group.title}</h3>
                  <Badge variant={count > 0 ? 'warning' : 'info'} size="small">{count}</Badge>
                </div>
              </button>

              {isExpanded && (
                <div id={`${group.type}-requests`} className="p-3.5 bg-white">
                  {count === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">{group.emptyMessage}</p>
                  ) : (
                    <div className="space-y-2.5">
                      {group.requests.map(request => {
                        let requestId: string;
                        if ('absence_id' in request) {
                          requestId = (request as LeaveRequest).absence_id;
                        } else if ('request_id' in request) {
                          requestId = (request as GuestRequest | MaintenanceRequest).request_id;
                        } else {
                          requestId = String(Date.now());
                        }
                        return <RequestCard key={requestId} type={group.type} request={request} />;
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPending === 0 && (
        <div className="mt-4 flex justify-center">
          <Button variant="primary" size="small" onClick={() => setIsLeaveModalOpen(true)}>
            Apply Leave
          </Button>
        </div>
      )}

      <LeaveRequestModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} />
    </div>
  );
};

export default PendingRequests;
