import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'small' | 'medium';

export interface BadgeProps {
  variant: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  variant,
  size = 'medium',
  icon,
  children,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-lg';

  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
    danger: 'bg-red-50 text-red-700 ring-1 ring-red-200/60',
    info: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200/60',
  };

  const sizeStyles = {
    small: 'text-[11px] px-2 py-0.5 gap-1',
    medium: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
