import React from 'react';

export interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export interface LayoutContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export interface LayoutGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: 1;
    tablet?: 1 | 2;
    desktop?: 1 | 2 | 3;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface LayoutSectionProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> & {
  Container: React.FC<LayoutContainerProps>;
  Grid: React.FC<LayoutGridProps>;
  Section: React.FC<LayoutSectionProps>;
} = ({ children, className = '' }) => {
  return (
    <main className={`min-h-screen bg-surface-100 ${className}`} role="main">
      {children}
    </main>
  );
};

const LayoutContainer: React.FC<LayoutContainerProps> = ({
  children,
  maxWidth = 'xl',
  className = '',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={`mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 ${maxWidthClasses[maxWidth]} ${className}`}
    >
      {children}
    </div>
  );
};

const LayoutGrid: React.FC<LayoutGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = '',
}) => {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4 sm:gap-5',
    lg: 'gap-5 sm:gap-6',
  };

  const columnClasses = {
    mobile: { 1: 'grid-cols-1' },
    tablet: { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2' },
    desktop: { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3' },
  };

  const mobileClass = columnClasses.mobile[columns.mobile || 1];
  const tabletClass = columnClasses.tablet[columns.tablet || 2];
  const desktopClass = columnClasses.desktop[columns.desktop || 3];

  return (
    <div className={`grid ${mobileClass} ${tabletClass} ${desktopClass} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

const LayoutSection: React.FC<LayoutSectionProps> = ({
  children,
  className = '',
}) => {
  return <section className={`mb-5 sm:mb-6 ${className}`}>{children}</section>;
};

Layout.Container = LayoutContainer;
Layout.Grid = LayoutGrid;
Layout.Section = LayoutSection;

export default Layout;
