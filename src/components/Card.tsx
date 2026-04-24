import React from 'react';

export type CardVariant = 'default' | 'compact' | 'highlighted' | 'interactive';

type CardHighlightColor = 'blue-500' | 'green-500' | 'yellow-500' | 'red-500' | 'gray-500';

export interface CardProps {
  variant?: CardVariant;
  highlightColor?: CardHighlightColor;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export interface CardHeaderProps {
  title: string;
  badge?: React.ReactNode;
  className?: string;
}

export interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}

export interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Footer: React.FC<CardFooterProps>;
} = ({
  variant = 'default',
  highlightColor = 'blue-500',
  onClick,
  className = '',
  children,
}) => {
  const baseStyles = 'bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm transition-all duration-200';

  const highlightStyles: Record<CardHighlightColor, string> = {
    'blue-500': 'border-l-[3px] border-l-brand-500',
    'green-500': 'border-l-[3px] border-l-emerald-500',
    'yellow-500': 'border-l-[3px] border-l-amber-400',
    'red-500': 'border-l-[3px] border-l-red-500',
    'gray-500': 'border-l-[3px] border-l-slate-400',
  };

  const variantStyles = {
    default: 'p-5 md:p-6',
    compact: 'p-4',
    highlighted: `p-5 md:p-6 ${highlightStyles[highlightColor]}`,
    interactive: 'p-5 md:p-6 cursor-pointer hover:shadow-glass hover:border-brand-200 active:scale-[0.99]',
  };

  const interactiveProps = onClick
    ? {
        onClick,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        },
        role: 'button',
        tabIndex: 0,
      }
    : {};

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...interactiveProps}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ title, badge, className = '' }) => {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {badge && <div>{badge}</div>}
    </div>
  );
};

const CardBody: React.FC<CardBodyProps> = ({ className = '', children }) => {
  return <div className={`text-slate-600 ${className}`}>{children}</div>;
};

const CardFooter: React.FC<CardFooterProps> = ({ className = '', children }) => {
  return (
    <div className={`flex items-center justify-end gap-2 mt-4 pt-4 border-t border-surface-200 ${className}`}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
