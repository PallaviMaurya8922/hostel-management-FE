import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface NavLink {
  label: string;
  href: string;
  isActive?: boolean;
  icon?: React.ReactNode;
}

export interface NavigationProps {
  links: NavLink[];
  onNavigate?: (href: string) => void;
  className?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  links,
  onNavigate,
  className = '',
  isMobileOpen = false,
  onMobileClose,
}) => {
  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(href);
    }
    onMobileClose?.();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onNavigate) {
        onNavigate(href);
      }
      onMobileClose?.();
    }
  };

  const navContent = (
    <ul className="space-y-1 px-3 py-2">
      {links.map(link => (
        <li key={link.href}>
          <a
            href={link.href}
            onClick={e => handleLinkClick(e, link.href)}
            onKeyDown={e => handleKeyDown(e, link.href)}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${
                link.isActive
                  ? 'bg-brand-50 text-brand-700 shadow-glow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-surface-100'
              }
            `}
            aria-current={link.isActive ? 'page' : undefined}
            tabIndex={0}
          >
            {link.icon && (
              <span className={`w-5 h-5 flex-shrink-0 ${link.isActive ? 'text-brand-600' : 'text-slate-400'}`}>
                {link.icon}
              </span>
            )}
            <span>{link.label}</span>
            {link.isActive && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
            )}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Desktop: horizontal tab bar */}
      <nav
        className={`hidden lg:block bg-white border-b border-surface-200/60 ${className}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="px-4 md:px-6">
          <ul className="flex space-x-1">
            {links.map(link => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={e => handleLinkClick(e, link.href)}
                  onKeyDown={e => handleKeyDown(e, link.href)}
                  className={`
                    relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200
                    ${
                      link.isActive
                        ? 'text-brand-700'
                        : 'text-slate-500 hover:text-slate-800'
                    }
                  `}
                  aria-current={link.isActive ? 'page' : undefined}
                  tabIndex={0}
                >
                  {link.icon && (
                    <span className={`w-4 h-4 ${link.isActive ? 'text-brand-600' : 'text-slate-400'}`}>
                      {link.icon}
                    </span>
                  )}
                  {link.label}
                  {link.isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-600 rounded-t-full" />
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile: slide-out drawer */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-fadeIn lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <nav
            className="fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-glass-lg animate-slideInLeft lg:hidden"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between px-4 h-16 border-b border-surface-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">H</span>
                </div>
                <span className="text-sm font-semibold text-slate-800">Menu</span>
              </div>
              <button
                type="button"
                onClick={onMobileClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-surface-100 transition-colors"
                aria-label="Close menu"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            {navContent}
          </nav>
        </>
      )}

      {/* Tablet: horizontal compact nav */}
      <nav
        className={`lg:hidden block bg-white border-b border-surface-200/60 ${className}`}
        role="navigation"
        aria-label="Tab navigation"
      >
        <div className="px-3 overflow-x-auto">
          <ul className="flex space-x-1 min-w-max">
            {links.map(link => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={e => handleLinkClick(e, link.href)}
                  onKeyDown={e => handleKeyDown(e, link.href)}
                  className={`
                    relative inline-flex items-center gap-2 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-all duration-200
                    ${
                      link.isActive
                        ? 'text-brand-700'
                        : 'text-slate-500 hover:text-slate-800'
                    }
                  `}
                  aria-current={link.isActive ? 'page' : undefined}
                  tabIndex={0}
                >
                  {link.label}
                  {link.isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-600 rounded-t-full" />
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
