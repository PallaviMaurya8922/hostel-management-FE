import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  HomeIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  QueueListIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts';
import Modal from './Modal';
import Button from './Button';
import ThemeToggle from './ThemeToggle';
import { getTimeOfDayGreeting, greetingDisplayName } from '../utils/dateUtils';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '../api';

const SIDEBAR_COLLAPSED_KEY = 'hostelops-sidebar-collapsed';

function readSidebarCollapsed(): boolean {
  try {
    return typeof window !== 'undefined' && localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: string[];
  /** Group label shown once above consecutive items with the same section */
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { section: 'Overview', label: 'Home', href: '/', icon: HomeIcon, roles: ['student'] },
  {
    section: 'History',
    label: 'Request history',
    href: '/student/request-history',
    icon: ClipboardDocumentListIcon,
    roles: ['student'],
  },
  { section: 'Campus', label: 'Notice board', href: '/student/notice-board', icon: BellIcon, roles: ['student'] },

  { section: 'Overview', label: 'Dashboard', href: '/warden/dashboard', icon: ShieldCheckIcon, roles: ['warden'] },
  { section: 'Workspace', label: 'Notice board', href: '/notice-board', icon: BellIcon, roles: ['warden'] },
  { section: 'Workspace', label: 'Pass history', href: '/warden/history', icon: CalendarDaysIcon, roles: ['warden'] },
  { section: 'Workspace', label: 'Reports', href: '/warden/reports', icon: ChartBarSquareIcon, roles: ['warden'] },

  { section: 'Overview', label: 'Gate dashboard', href: '/security/dashboard', icon: LockClosedIcon, roles: ['security'] },
  { section: 'Campus', label: 'Notice board', href: '/security/notice-board', icon: BellIcon, roles: ['security'] },
  { section: 'Verification', label: 'Guest QR queue', href: '/security/verification-queue', icon: QueueListIcon, roles: ['security'] },
  { section: 'Verification', label: 'Active passes', href: '/security/active-passes', icon: ClipboardDocumentListIcon, roles: ['security'] },

  { section: 'Overview', label: 'Complaints board', href: '/maintenance/dashboard', icon: WrenchScrewdriverIcon, roles: ['maintenance'] },

  { section: 'Overview', label: 'Notice board', href: '/notice-board', icon: BellIcon, roles: ['admin'] },
  { section: 'System', label: 'Admin console', href: '/admin/dashboard', icon: CogIcon, roles: ['admin'] },
];

interface AppShellProps {
  children: React.ReactNode;
  /** Optional context under the time-based greeting (e.g. "Warden Operations"). */
  pageTitle?: string;
  showSearch?: boolean;
  showTopRefresh?: boolean;
  onTopRefresh?: () => void | Promise<void>;
  topRefreshLoading?: boolean;
  topRefreshLabel?: string;
}

const AppShell: React.FC<AppShellProps> = ({
  children,
  pageTitle,
  showSearch = false,
  showTopRefresh = false,
  onTopRefresh,
  topRefreshLoading = false,
  topRefreshLabel = 'Refresh',
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsPopoverRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  const userRole = user?.role || 'student';

  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications', userRole],
    queryFn: getNotifications,
    enabled: !!user && userRole !== 'admin',
    staleTime: 30_000,
  });

  const sortedNotifications = [...notifications].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const unreadCount = sortedNotifications.filter(notification => !notification.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications', userRole] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications', userRole] });
    },
  });

  const greeting = getTimeOfDayGreeting();
  const displayName = greetingDisplayName(user?.name, user?.email);

  const visibleNavItems = NAV_ITEMS.filter(item => item.roles.includes(userRole));

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const goToProfile = () => {
    navigate('/profile');
    setIsMobileOpen(false);
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.is_read) {
      await markReadMutation.mutateAsync(notification.notification_id);
    }

    if (notification.action_url) {
      navigate(notification.action_url);
    }

    setIsNotificationsOpen(false);
  };

  const onProfilePage = location.pathname === '/profile';

  useEffect(() => {
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isNotificationsOpen) return;

      const target = event.target as Node | null;
      if (!target) return;

      if (notificationsPopoverRef.current && !notificationsPopoverRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  const renderSidebarBody = (narrow: boolean) => (
    <>
      {/* Logo */}
      <div
        className={`flex items-center h-16 shrink-0 border-b border-surface-200 dark:border-white/10 ${
          narrow ? 'justify-center px-2' : 'gap-3 px-5'
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 21V7l9-4 9 4v14H3zm2-2h14V8.3l-7-3.11L5 8.3V19zm3-2h8v-2H8v2zm0-4h8v-2H8v2z" />
          </svg>
        </div>
        {!narrow && (
          <span className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            HostelOps
          </span>
        )}
      </div>

      {/* Navigation — grouped sections for clearer IA */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto min-h-0">
        {visibleNavItems.map((item, index) => {
          const active = isActive(item.href);
          const prev = visibleNavItems[index - 1];
          const showSection =
            !narrow && item.section && (index === 0 || prev?.section !== item.section);
          return (
            <div
              key={`${item.href}-${item.label}`}
              className={
                showSection ? (index > 0 ? 'mt-4 border-t border-surface-200 pt-3 dark:border-white/10' : 'pt-0.5') : ''
              }
            >
              {showSection ? (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  {item.section}
                </p>
              ) : null}
              <button
                type="button"
                title={narrow ? `${item.section ? `${item.section}: ` : ''}${item.label}` : undefined}
                onClick={() => {
                  navigate(item.href);
                  setIsMobileOpen(false);
                }}
                className={`mb-1 flex w-full items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                  narrow ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  active
                    ? narrow
                      ? 'bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:ring-cyan-400/35'
                      : 'border-l-[3px] border-cyan-600 bg-cyan-50 text-cyan-800 dark:border-cyan-400 dark:bg-cyan-500/15 dark:text-cyan-400'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                }`}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 ${active ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-500'}`}
                />
                <span className={narrow ? 'sr-only' : ''}>{item.label}</span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* User section — opens Profile */}
      <div
        className={`shrink-0 border-t border-surface-200 dark:border-white/10 ${narrow ? 'px-2 py-3' : 'px-4 py-4'}`}
      >
        <button
          type="button"
          onClick={goToProfile}
          title={narrow ? `${user?.name || 'User'} — Profile` : undefined}
          className={`flex w-full items-center rounded-xl transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 dark:hover:bg-white/5 dark:focus-visible:ring-cyan-400/60 ${
            narrow ? 'justify-center p-2' : 'gap-3 p-1 -m-1 text-left'
          } ${onProfilePage ? 'bg-slate-100 ring-1 ring-cyan-200 dark:bg-white/10 dark:ring-cyan-400/30' : ''}`}
        >
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt=""
              className={`shrink-0 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-white/20 ${narrow ? 'h-10 w-10' : 'h-9 w-9'}`}
            />
          ) : (
            <div
              className={`rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shrink-0 ${
                narrow ? 'w-10 h-10' : 'w-9 h-9'
              }`}
            >
              <span className="text-white text-sm font-semibold">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {!narrow && (
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{user?.name || 'User'}</p>
              <p className="truncate text-xs capitalize text-slate-500 dark:text-slate-400">{userRole}</p>
            </div>
          )}
          {narrow && <span className="sr-only">Open profile</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-surface-100">
      {/* Desktop sidebar */}
      <aside
        className={`z-30 hidden bg-white transition-[width] duration-200 ease-out dark:bg-[#0f1729] lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:border-r lg:border-surface-200/90 lg:dark:border-white/5 ${
          sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'
        }`}
      >
        {renderSidebarBody(sidebarCollapsed)}
      </aside>

      {/* Mobile sidebar overlay — always expanded width for readability */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fadeIn"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed left-0 top-0 z-50 flex h-full w-[260px] animate-slideInLeft flex-col border-r border-surface-200 bg-white dark:border-transparent dark:bg-[#0f1729] lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Close menu"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            {renderSidebarBody(false)}
          </aside>
        </>
      )}

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-200 ease-out ${
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 min-h-16 bg-white border-b border-surface-200/60 px-4 lg:px-6 flex items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-surface-100 transition-colors shrink-0"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(c => !c)}
              className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-surface-100 transition-colors shrink-0"
              aria-expanded={!sidebarCollapsed}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronDoubleRightIcon className="w-5 h-5" />
              ) : (
                <ChevronDoubleLeftIcon className="w-5 h-5" />
              )}
            </button>
            <div className="min-w-0 flex flex-col justify-center py-0.5">
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate leading-snug">
                <span className="text-slate-600 font-medium">{greeting}, </span>
                <span className="text-slate-900">{displayName}</span>
              </h1>
              {pageTitle ? (
                <p className="text-xs sm:text-sm text-slate-500 truncate mt-0.5">{pageTitle}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 sm:gap-3">
            <ThemeToggle variant="toolbar" />
            {showSearch && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-100 rounded-xl border border-surface-200 w-56">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none flex-1 min-w-0"
                />
              </div>
            )}
            {showTopRefresh && onTopRefresh ? (
              <button
                type="button"
                onClick={() => {
                  void onTopRefresh();
                }}
                disabled={topRefreshLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={topRefreshLabel}
              >
                <ArrowPathIcon className={`w-4 h-4 ${topRefreshLoading ? 'animate-spin' : ''}`} />
                {topRefreshLabel}
              </button>
            ) : null}
            <div ref={notificationsPopoverRef} className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(open => !open)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-surface-100 transition-colors"
                aria-label="Notifications"
                aria-expanded={isNotificationsOpen}
              >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-red-500 rounded-full text-[10px] font-semibold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-surface-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden z-30">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-slate-700">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">Latest updates for your role</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => markAllReadMutation.mutate()}
                      className="text-xs font-medium text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 disabled:opacity-40"
                      disabled={unreadCount === 0 || markAllReadMutation.isPending}
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {sortedNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No notifications yet</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">You’ll see request updates and notices here.</p>
                      </div>
                    ) : (
                      sortedNotifications.map(notification => {
                        const isUnread = !notification.is_read;
                        const priorityTone =
                          notification.priority === 'high'
                            ? 'border-surface-200 bg-surface-50/80 dark:border-emerald-700/70 dark:bg-emerald-950/70'
                            : notification.priority === 'medium'
                              ? 'border-surface-200 bg-surface-50/80 dark:border-emerald-700/70 dark:bg-emerald-950/70'
                              : 'border-surface-200 bg-surface-50/80 dark:border-emerald-700/70 dark:bg-emerald-950/70';

                        return (
                          <button
                            key={notification.notification_id}
                            type="button"
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full text-left px-4 py-3 border-b border-surface-100 dark:border-slate-700 last:border-b-0 hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors ${
                              isUnread ? 'bg-cyan-50/40 dark:bg-cyan-900/25' : ''
                            }`}
                          >
                            <div className={`rounded-xl border px-3 py-2 ${priorityTone}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                      {notification.title}
                                    </span>
                                    {isUnread && <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />}
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-200 line-clamp-2">{notification.message}</p>
                                </div>
                                <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-300 font-semibold">
                                  {notification.type}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300">
                                <span className="capitalize">{notification.priority}</span>
                                <span>{new Date(notification.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="w-px h-6 bg-surface-200 hidden sm:block" />
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              aria-label="Logout"
            >
              <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Logout confirmation modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLogoutModal(false)} disabled={isLoggingOut}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLogoutConfirm} loading={isLoggingOut} disabled={isLoggingOut}>
              Logout
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Are you sure you want to log out of your account?</p>
      </Modal>
    </div>
  );
};

export default AppShell;
