import React from 'react';
import {
  CalendarDaysIcon,
  TicketIcon,
  ClockIcon,
  WrenchIcon,
} from '@heroicons/react/24/outline';
import Skeleton from '../Skeleton';
import {
  usePasses,
  useLeaveRequests,
  useGuestRequests,
  useMaintenanceRequests,
} from '../../hooks';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  isLoading: boolean;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  count,
  isLoading,
  color,
  bgColor,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-5">
        <div className="flex items-center gap-4">
          <Skeleton width="44px" height="44px" variant="rectangular" className="rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton width="40px" height="24px" />
            <Skeleton width="80px" height="14px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-5 hover-lift">
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
          <span className={color}>{icon}</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{count}</p>
          <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  );
};

const OverviewStats: React.FC = () => {
  const { data: passes, isLoading: passesLoading } = usePasses();
  const { data: leaves, isLoading: leavesLoading } = useLeaveRequests();
  const { data: guests, isLoading: guestsLoading } = useGuestRequests();
  const { data: maintenance, isLoading: maintenanceLoading } = useMaintenanceRequests();

  const totalPasses = passes?.length || 0;
  const activePasses =
    passes?.filter(pass => pass.status === 'active' && pass.is_valid).length || 0;
  const pendingRequests =
    (leaves?.filter(l => l.status === 'pending').length || 0) +
    (guests?.filter(g => g.status === 'pending').length || 0) +
    (maintenance?.filter(m => m.status === 'pending').length || 0);
  const openComplaints =
    maintenance?.filter(
      m => m.status !== 'completed' && m.status !== 'cancelled'
    ).length || 0;

  const stats = [
    {
      id: 'total-leaves',
      icon: <CalendarDaysIcon className="w-5 h-5" />,
      label: 'Total Passes',
      count: totalPasses,
      isLoading: passesLoading,
      color: 'text-brand-600',
      bgColor: 'bg-brand-50',
    },
    {
      id: 'active-passes',
      icon: <TicketIcon className="w-5 h-5" />,
      label: 'Active Passes',
      count: activePasses,
      isLoading: passesLoading,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      id: 'pending-requests',
      icon: <ClockIcon className="w-5 h-5" />,
      label: 'Pending Requests',
      count: pendingRequests,
      isLoading: leavesLoading || guestsLoading || maintenanceLoading,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      id: 'complaints',
      icon: <WrenchIcon className="w-5 h-5" />,
      label: 'Complaints',
      count: openComplaints,
      isLoading: maintenanceLoading,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
  ];

  return (
    <section className="mb-6" aria-label="Overview statistics">
      <h2 className="text-base font-semibold text-slate-800 mb-4">Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(stat => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>
    </section>
  );
};

export default OverviewStats;
