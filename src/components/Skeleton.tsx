import React from 'react';

export interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'rectangular',
}) => {
  const variantStyles = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={`animate-shimmer ${variantStyles[variant]} ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="0.875rem"
          width={index === lines - 1 ? '75%' : '100%'}
          variant="text"
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div className={`p-5 bg-white border border-surface-200/80 rounded-2xl ${className}`}>
      <div className="flex items-center space-x-3 mb-4">
        <Skeleton width="40px" height="40px" variant="circular" />
        <div className="flex-1 space-y-2">
          <Skeleton height="0.875rem" width="55%" />
          <Skeleton height="0.75rem" width="35%" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
};

export default Skeleton;
