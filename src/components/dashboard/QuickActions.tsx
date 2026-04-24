import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  UserPlusIcon,
  WrenchScrewdriverIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import LeaveRequestModal from '../modals/LeaveRequestModal';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
  color: string;
  bgColor: string;
}

const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const actions: QuickAction[] = [
    {
      id: 'apply-leave',
      label: 'Apply for Leave',
      description: 'Submit a new leave request',
      icon: DocumentTextIcon,
      onClick: () => setIsLeaveModalOpen(true),
      color: 'text-brand-600',
      bgColor: 'bg-brand-50 hover:bg-brand-100/80',
    },
    {
      id: 'register-guest',
      label: 'Register Guest',
      description: 'Register a visitor',
      icon: UserPlusIcon,
      onClick: () => navigate('/guest-request'),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100/80',
    },
    {
      id: 'file-complaint',
      label: 'File Complaint',
      description: 'Report a maintenance issue',
      icon: WrenchScrewdriverIcon,
      onClick: () => navigate('/maintenance-request'),
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 hover:bg-amber-100/80',
    },
  ];

  return (
    <>
      <section className="mb-6" aria-label="Quick actions">
        <h2 className="text-base font-semibold text-slate-800 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {actions.map(action => (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`group flex items-center gap-4 p-4 rounded-2xl border border-surface-200/80 bg-white shadow-glass-sm transition-all duration-200 hover:shadow-glass hover:border-transparent text-left active:scale-[0.99]`}
              aria-label={action.label}
            >
              <div className={`w-10 h-10 rounded-xl ${action.bgColor} flex items-center justify-center flex-shrink-0 transition-colors`}>
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{action.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{action.description}</p>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>
          ))}
        </div>
      </section>

      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
      />
    </>
  );
};

export default QuickActions;
