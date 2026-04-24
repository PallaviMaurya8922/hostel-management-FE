import React from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../contexts/ToastContext';

const Toast: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-100 dark:bg-emerald-950/85 dark:text-emerald-100 dark:border-emerald-700 dark:ring-emerald-700/60';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200 ring-1 ring-red-100 dark:bg-red-950/90 dark:text-red-100 dark:border-red-500 dark:ring-red-500/60';
      case 'info':
        return 'bg-brand-50 text-brand-800 border-brand-200 ring-1 ring-brand-100 dark:bg-cyan-950/85 dark:text-cyan-100 dark:border-cyan-700 dark:ring-cyan-700/60';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-100 dark:bg-amber-950/90 dark:text-amber-100 dark:border-amber-600 dark:ring-amber-600/60';
      default:
        return 'bg-surface-50 text-slate-800 border-surface-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700';
    }
  };

  const getToastIcon = (type: string) => {
    const iconClass = 'w-5 h-5 flex-shrink-0';
    switch (type) {
      case 'success':
        return <CheckCircleIcon className={iconClass} />;
      case 'error':
        return <XCircleIcon className={iconClass} />;
      case 'info':
        return <InformationCircleIcon className={iconClass} />;
      case 'warning':
        return <ExclamationTriangleIcon className={iconClass} />;
      default:
        return <InformationCircleIcon className={iconClass} />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-glass min-w-[300px] max-w-md animate-slideIn border ${getToastStyles(toast.type)}`}
          role="alert"
        >
          {getToastIcon(toast.type)}
          <span className="flex-1 text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-current hover:opacity-70 transition-opacity focus:outline-none rounded-lg p-0.5"
            aria-label="Dismiss notification"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
