import React, { useState, useMemo, useEffect, useRef } from 'react';
import AppShell from '../components/AppShell';
import { useAuth, useToast } from '../contexts';
import FirstLoginModal from '../components/modals/FirstLoginModal';
import LeaveRequestModal from '../components/modals/LeaveRequestModal';
import GuestRequestModal from '../components/modals/GuestRequestModal';
import MaintenanceRequestModal from '../components/modals/MaintenanceRequestModal';
import { usePasses, useLeaveRequests, useMaintenanceRequests, useGuestRequests } from '../hooks';
import { viewPass } from '../api/passes';
import QRCodeImport from 'react-qr-code';
import Badge from '../components/Badge';
import {
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
  PlusIcon,
  QrCodeIcon,
  ArrowRightIcon,
  CheckIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatDateRange } from '../utils/dateUtils';
import Skeleton from '../components/Skeleton';
import { RecentActivity } from '../components/dashboard/RecentActivity';

const QRCodeComponent = (QRCodeImport as unknown as { default?: React.ComponentType<any> }).default ?? QRCodeImport;

const Dashboard: React.FC = () => {
  const { user, isFirstLogin } = useAuth();
  const { showToast } = useToast();
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(isFirstLogin);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isPassViewerOpen, setIsPassViewerOpen] = useState(false);
  const [passViewUrl, setPassViewUrl] = useState<string | null>(null);
  const [passViewHtml, setPassViewHtml] = useState<string | null>(null);
  const [isPassViewerLoading, setIsPassViewerLoading] = useState(false);
  const [passViewerError, setPassViewerError] = useState<string | null>(null);
  const leaveQrWrapperRef = useRef<HTMLDivElement | null>(null);
  const studentName = user?.name || 'Student';

  const { data: passes, isLoading: passesLoading } = usePasses();
  const { data: leaves, isLoading: leavesLoading } = useLeaveRequests();
  const { data: guests, isLoading: guestsLoading } = useGuestRequests();
  const { data: maintenance, isLoading: maintenanceLoading } = useMaintenanceRequests();

  const activeLeave = useMemo(() => {
    if (!leaves) return null;
    return leaves.find(l => l.status === 'pending' || l.status === 'active' || l.status === 'approved') || null;
  }, [leaves]);
  const isLeaveTrackingActive = activeLeave?.status === 'pending';

  const pendingLeavesCount = useMemo(() => leaves?.filter(l => l.status === 'pending').length || 0, [leaves]);
  const pendingGuestsCount = useMemo(() => guests?.filter(g => g.status === 'pending').length || 0, [guests]);
  const pendingMaintenanceCount = useMemo(() => maintenance?.filter(m => m.status === 'pending').length || 0, [maintenance]);

  const leaveBreakdown = useMemo(() => {
    if (!leaves?.length) {
      return { total: 0, pending: 0, approved: 0, rejected: 0, other: 0 };
    }
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let other = 0;
    for (const l of leaves) {
      if (l.status === 'pending') pending += 1;
      else if (l.status === 'approved' || l.status === 'active') approved += 1;
      else if (l.status === 'rejected') rejected += 1;
      else other += 1;
    }
    return { total: leaves.length, pending, approved, rejected, other };
  }, [leaves]);

  const guestBreakdown = useMemo(() => {
    if (!guests?.length) {
      return { total: 0, pending: 0, approved: 0, rejected: 0, other: 0 };
    }
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let other = 0;
    for (const g of guests) {
      if (g.status === 'pending') pending += 1;
      else if (g.status === 'approved' || g.status === 'active') approved += 1;
      else if (g.status === 'rejected') rejected += 1;
      else other += 1;
    }
    return { total: guests.length, pending, approved, rejected, other };
  }, [guests]);

  const maintenanceBreakdown = useMemo(() => {
    if (!maintenance?.length) {
      return { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 };
    }
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let cancelled = 0;
    for (const m of maintenance) {
      if (m.status === 'pending') pending += 1;
      else if (m.status === 'assigned' || m.status === 'in_progress') inProgress += 1;
      else if (m.status === 'completed') completed += 1;
      else if (m.status === 'cancelled') cancelled += 1;
    }
    return { total: maintenance.length, pending, inProgress, completed, cancelled };
  }, [maintenance]);

  const activePass = useMemo(() => {
    if (!passes) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return passes.find(p => {
      const toDate = new Date(`${p.to_date}T00:00:00`);
      return (p.status === 'active' || p.status === 'approved') && today <= toDate;
    }) || null;
  }, [passes]);

  const activePassQrValue = useMemo(() => {
    if (!activePass) return '';

    const token = (activePass.verification_code || '').trim();

    const qrLines = [
      'Hostel Digital Leave Pass',
      `Pass Number: ${activePass.pass_number}`,
      `Student ID: ${activePass.student_id}`,
      `Valid From: ${activePass.from_date}`,
      `Valid To: ${activePass.to_date}`,
    ];

    if (token) {
      qrLines.push(`Verification Code: ${token}`);
    }
    return qrLines.join('\n');
  }, [activePass]);

  const downloadQrFromWrapper = (wrapper: HTMLDivElement | null, filename: string, qrLabel: string) => {
    if (!wrapper) {
      showToast(`Unable to download ${qrLabel} right now`, 'warning');
      return;
    }

    const svg = wrapper.querySelector('svg');
    if (!svg) {
      showToast(`QR image is not ready yet for ${qrLabel}`, 'warning');
      return;
    }

    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${filename}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
      showToast(`${qrLabel} downloaded`, 'success');
    } catch {
      showToast(`Failed to download ${qrLabel}`, 'error');
    }
  };

  const enhancePassHtmlForPreview = (html: string) => {
    const previewStyle = `
      <style id="dashboard-pass-preview-scale-style">
        html, body {
          margin: 0;
          padding: 0;
          background: #f3f4f6;
        }
        body {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 24px;
          overflow: auto;
        }
        body > * {
          transform: scale(1.45);
          transform-origin: top center;
        }
        @media (max-width: 768px) {
          body {
            padding: 12px;
          }
          body > * {
            transform: scale(1.12);
          }
        }
      </style>
    `;

    if (/<\/head>/i.test(html)) {
      return html.replace(/<\/head>/i, `${previewStyle}</head>`);
    }

    return `${previewStyle}${html}`;
  };

  const handleOpenPassViewer = async () => {
    if (!activePass) return;

    setPassViewerError(null);
    setIsPassViewerLoading(true);

    try {
      const blob = await viewPass(activePass.pass_number);
      const contentType = blob.type.toLowerCase();

      if (passViewUrl) {
        window.URL.revokeObjectURL(passViewUrl);
      }

      if (contentType.includes('text/html')) {
        const html = await blob.text();
        setPassViewHtml(enhancePassHtmlForPreview(html));
        setPassViewUrl(null);
      } else {
        const objectUrl = window.URL.createObjectURL(blob);
        setPassViewUrl(objectUrl);
        setPassViewHtml(null);
      }

      setIsPassViewerOpen(true);
    } catch {
      setPassViewerError('Unable to open full pass preview right now. Please try again.');
    } finally {
      setIsPassViewerLoading(false);
    }
  };

  const closePassViewer = () => {
    setIsPassViewerOpen(false);
    if (passViewUrl) {
      window.URL.revokeObjectURL(passViewUrl);
    }
    setPassViewUrl(null);
    setPassViewHtml(null);
  };

  useEffect(() => {
    return () => {
      if (passViewUrl) {
        window.URL.revokeObjectURL(passViewUrl);
      }
    };
  }, [passViewUrl]);

  const isLoading = passesLoading || leavesLoading || maintenanceLoading || guestsLoading;

  if (isLoading) {
    return (
      <AppShell showSearch>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <Skeleton height="150px" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1"><Skeleton height="350px" /></div>
            <div className="lg:col-span-2"><Skeleton height="350px" /></div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showSearch>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Top Grid: Stats and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          
          {/* Stat Cards (Col 1-3) */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Leave requests — summary + breakdown */}
            <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-5 flex flex-col min-h-[240px]">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <CalendarDaysIcon className="w-5 h-5 text-blue-500" />
                </div>
                <Badge variant={pendingLeavesCount > 0 ? 'warning' : 'success'}>
                  {pendingLeavesCount > 0 ? 'Action needed' : 'All clear'}
                </Badge>
              </div>
              <div className="rounded-xl bg-slate-50/90 border border-surface-100 py-3 px-3.5 space-y-2 flex-1">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-slate-500">Pending approval</span>
                  <span
                    className={`font-semibold tabular-nums ${leaveBreakdown.pending > 0 ? 'text-amber-700' : 'text-slate-800'}`}
                  >
                    {leaveBreakdown.pending}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-slate-500">Approved / active</span>
                  <span className="font-semibold tabular-nums text-emerald-700">{leaveBreakdown.approved}</span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-slate-500">Rejected</span>
                  <span
                    className={`font-semibold tabular-nums ${leaveBreakdown.rejected > 0 ? 'text-red-600' : 'text-slate-800'}`}
                  >
                    {leaveBreakdown.rejected}
                  </span>
                </div>
                {leaveBreakdown.other > 0 && (
                  <div className="flex justify-between items-center text-xs gap-2 pt-1 border-t border-surface-200/60">
                    <span className="text-slate-500">Other status</span>
                    <span className="font-semibold tabular-nums text-slate-800">{leaveBreakdown.other}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-surface-100">
                <p className="text-xs text-slate-500 font-medium mb-0.5">Leave requests</p>
                <h3 className="text-2xl font-bold text-slate-800 tabular-nums">{leaveBreakdown.total}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {leaveBreakdown.total === 0
                    ? 'No leave requests yet'
                    : `${leaveBreakdown.total} total · ${leaveBreakdown.pending} awaiting warden`}
                </p>
              </div>
            </div>

            {/* Guest requests */}
            <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-5 flex flex-col min-h-[240px]">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5 text-emerald-500" />
                </div>
                <Badge variant={pendingGuestsCount > 0 ? 'warning' : 'success'}>
                  {pendingGuestsCount > 0 ? 'Action needed' : 'All clear'}
                </Badge>
              </div>
              <div className="rounded-xl bg-slate-50/90 border border-surface-100 py-3 px-3.5 space-y-2 flex-1">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-slate-500">Pending approval</span>
                  <span
                    className={`font-semibold tabular-nums ${guestBreakdown.pending > 0 ? 'text-amber-700' : 'text-slate-800'}`}
                  >
                    {guestBreakdown.pending}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-slate-500">Approved / active</span>
                  <span className="font-semibold tabular-nums text-emerald-700">{guestBreakdown.approved}</span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-slate-500">Rejected</span>
                  <span
                    className={`font-semibold tabular-nums ${guestBreakdown.rejected > 0 ? 'text-red-600' : 'text-slate-800'}`}
                  >
                    {guestBreakdown.rejected}
                  </span>
                </div>
                {guestBreakdown.other > 0 && (
                  <div className="flex justify-between items-center text-xs gap-2 pt-1 border-t border-surface-200/60">
                    <span className="text-slate-500">Other status</span>
                    <span className="font-semibold tabular-nums text-slate-800">{guestBreakdown.other}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-surface-100">
                <p className="text-xs text-slate-500 font-medium mb-0.5">Guest requests</p>
                <h3 className="text-2xl font-bold text-slate-800 tabular-nums">{guestBreakdown.total}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {guestBreakdown.total === 0
                    ? 'No guest requests yet'
                    : `${guestBreakdown.total} total · ${guestBreakdown.pending} awaiting warden`}
                </p>
              </div>
            </div>

            {/* Maintenance */}
            <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-5 flex flex-col min-h-[240px]">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <WrenchScrewdriverIcon className="w-5 h-5 text-red-500" />
                </div>
                <Badge
                  variant={
                    pendingMaintenanceCount > 0 || maintenanceBreakdown.inProgress > 0 ? 'warning' : 'success'
                  }
                >
                  {pendingMaintenanceCount > 0 || maintenanceBreakdown.inProgress > 0
                    ? 'In pipeline'
                    : 'All clear'}
                </Badge>
              </div>
              <div className="rounded-xl bg-slate-50/90 border border-surface-100 py-3 px-3.5 space-y-2 flex-1">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-slate-500">Queued (pending)</span>
                  <span
                    className={`font-semibold tabular-nums ${maintenanceBreakdown.pending > 0 ? 'text-amber-700' : 'text-slate-800'}`}
                  >
                    {maintenanceBreakdown.pending}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-slate-500">In progress</span>
                  <span
                    className={`font-semibold tabular-nums ${maintenanceBreakdown.inProgress > 0 ? 'text-sky-700' : 'text-slate-800'}`}
                  >
                    {maintenanceBreakdown.inProgress}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-slate-500">Resolved</span>
                  <span className="font-semibold tabular-nums text-emerald-700">
                    {maintenanceBreakdown.completed}
                  </span>
                </div>
                {maintenanceBreakdown.cancelled > 0 && (
                  <div className="flex justify-between items-center text-xs gap-2 pt-1 border-t border-surface-200/60">
                    <span className="text-slate-500">Cancelled</span>
                    <span className="font-semibold tabular-nums text-slate-600">
                      {maintenanceBreakdown.cancelled}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-surface-100">
                <p className="text-xs text-slate-500 font-medium mb-0.5">Maintenance complaints</p>
                <h3 className="text-2xl font-bold text-slate-800 tabular-nums">{maintenanceBreakdown.total}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {maintenanceBreakdown.total === 0
                    ? 'No complaints filed'
                    : `${maintenanceBreakdown.pending + maintenanceBreakdown.inProgress} in pipeline · ${maintenanceBreakdown.completed} resolved`}
                </p>
              </div>
            </div>

          </div>

          {/* Quick Actions (Col 4) */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-5">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setIsMaintenanceModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-surface-200 hover:bg-surface-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <PlusIcon className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Raise Complaint</span>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>
              
              <button 
                onClick={() => setIsLeaveModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-surface-200 hover:bg-surface-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <CalendarDaysIcon className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Request Leave</span>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>

              <button 
                onClick={() => setIsGuestModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-surface-200 hover:bg-surface-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <UserIcon className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Guest Request</span>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Grid: Gate Pass & Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Digital Gate Pass (Col 1) */}
          <div className="relative flex h-full min-h-[400px] flex-col overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-6 shadow-glass-sm dark:border-transparent dark:bg-[#0f1729] dark:shadow-glass-lg">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-transparent dark:to-cyan-900/20" />
            <div className="relative z-10 mb-6 flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Digital Gate Pass</h3>
              <Badge
                variant={activePass ? 'success' : 'warning'}
                className="border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400"
              >
                {activePass ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {activePass ? (
              <div className="relative z-10 mb-6 flex flex-1 flex-col items-center rounded-xl border border-surface-200 bg-white p-5 shadow-lg dark:border-white/10">
                <div
                  ref={leaveQrWrapperRef}
                  className="w-full aspect-square max-w-[200px] mb-4 mt-auto rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-4"
                >
                  <QRCodeComponent
                    value={activePassQrValue}
                    size={160}
                    bgColor="#f8fafc"
                    fgColor="#0f172a"
                    style={{ height: '100%', width: '100%' }}
                    aria-label={`Digital gate pass QR for ${activePass.pass_number}`}
                  />
                </div>
                <div className="w-full text-center border-t border-dashed border-surface-200 pt-3 mt-auto">
                  <p className="text-xs text-slate-500 font-medium">
                    Valid until: {new Date(`${activePass.to_date}T23:59:59`).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">
                    Scan the QR to verify pass {activePass.pass_number}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative z-10 mb-6 flex flex-1 flex-col items-center justify-center rounded-xl border border-surface-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="mb-4 flex aspect-square w-full max-w-[200px] items-center justify-center">
                   <div className="relative">
                     <QrCodeIcon className="h-24 w-24 text-slate-200 dark:text-white/10" />
                     <div className="absolute inset-0 flex items-center justify-center">
                       <span className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-slate-500 dark:bg-[#0f1729]/80 dark:text-white/40">
                         Inactive
                       </span>
                     </div>
                   </div>
                </div>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">No active pass available</p>
              </div>
            )}

            <div className="relative z-10 mb-6 mt-auto flex justify-between text-sm">
              <div>
                <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Type</p>
                <p className="font-medium text-slate-900 dark:text-white">{activePass ? 'Approved Leave' : 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Pass ID</p>
                <p className="font-medium text-slate-900 dark:text-white">{activePass ? activePass.pass_number : '---'}</p>
              </div>
            </div>

            <button 
              onClick={handleOpenPassViewer}
              disabled={!activePass}
              className="relative z-10 mt-auto w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPassViewerLoading ? 'Opening Pass...' : 'Show Full Screen for Scan'}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadQrFromWrapper(
                  leaveQrWrapperRef.current,
                  activePass ? `leave_qr_${activePass.pass_number}` : 'leave_qr',
                  'Leave QR'
                )
              }
              disabled={!activePass}
              className="relative z-10 mt-2 w-full rounded-xl border border-surface-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-800 transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              Download Leave QR
            </button>
            {passViewerError && (
              <p className="relative z-10 mt-2 text-center text-[11px] text-rose-600 dark:text-rose-300">
                {passViewerError}
              </p>
            )}
          </div>

          {/* Current Leave Status (Col 2 & 3) */}
          {activeLeave && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-slate-800">Current Leave Status</h3>
                <div className="inline-flex items-center gap-2 text-sm font-normal text-slate-700">
                  <span
                    className={`h-2.5 w-2.5 rounded-full bg-emerald-500 ${
                      isLeaveTrackingActive ? 'animate-pulse' : ''
                    }`}
                    aria-hidden="true"
                  />
                  {isLeaveTrackingActive ? 'Live Tracking' : 'Completed'}
                </div>
              </div>

              <div className="border border-surface-200 rounded-xl p-5 mb-8 bg-surface-50/50">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-slate-800 font-semibold">{activeLeave.reason.split('\n')[0]}</h4>
                  <Badge variant={activeLeave.status === 'pending' ? 'warning' : 'success'} className={activeLeave.status === 'pending' ? "bg-amber-100 text-amber-800 border-0" : ""}>
                    {activeLeave.status === 'pending' ? 'In Progress' : 'Approved'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <CalendarDaysIcon className="w-4 h-4" />
                  <span>{formatDateRange(activeLeave.start_date, activeLeave.end_date)}</span>
                </div>
                <p className="text-sm text-slate-600">Reason: {activeLeave.reason}</p>
              </div>

              <div className="flex-1 px-4 relative max-w-md mx-auto w-full">
                {/* Vertical Line */}
                <div className="absolute left-[8.5rem] top-4 bottom-8 w-px bg-surface-200" />

                <div className="space-y-6 relative">
                  {/* Step 1: Request Submitted */}
                  <div className="flex items-start gap-4">
                    <div className="w-28 text-right pt-1 text-xs">
                      <p className="font-semibold text-slate-800">Request Submitted</p>
                      <p className="text-slate-500">{new Date(activeLeave.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="relative z-10 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-white shadow-sm mt-0.5">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1 pt-1" />
                  </div>

                  {/* Step 2: WhatsApp Sent */}
                  <div className="flex items-start gap-4">
                    <div className="w-28 text-right pt-1 text-xs">
                      <p className="font-semibold text-slate-800">WhatsApp Sent</p>
                      <p className="text-slate-500">{new Date(activeLeave.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="relative z-10 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-white shadow-sm mt-0.5">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                      </svg>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                        Message delivered & read
                      </Badge>
                    </div>
                  </div>

                  {/* Step 3: Parent Approved */}
                  <div className="flex items-start gap-4">
                    <div className="w-28 text-right pt-1 text-xs">
                      <p className="font-semibold text-slate-800">Parent Approved</p>
                      <p className="text-slate-500">{activeLeave.parent_response_at ? new Date(activeLeave.parent_response_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}</p>
                    </div>
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-4 border-white shadow-sm mt-0.5 ${activeLeave.parent_approval ? 'bg-emerald-500' : 'bg-surface-200'}`}>
                      <UserIcon className={`w-3 h-3 ${activeLeave.parent_approval ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 pt-1" />
                  </div>

                  {/* Step 4: Warden Approval */}
                  <div className="flex items-start gap-4">
                    <div className="w-28 text-right pt-1 text-xs">
                      <p className={`font-semibold ${activeLeave.status === 'approved' ? 'text-slate-800' : 'text-slate-400'}`}>Warden Approval</p>
                      <p className="text-slate-400">{activeLeave.status === 'approved' ? new Date(activeLeave.updated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}</p>
                    </div>
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-4 border-white shadow-sm mt-0.5 ${activeLeave.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-400'}`}>
                      {activeLeave.status === 'approved' ? (
                        <CheckIcon className="w-3 h-3 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5">
                      {activeLeave.status === 'pending' && (
                        <Badge variant="warning" className="bg-amber-50 text-amber-700 border-amber-200 font-medium">
                          Awaiting final review by Warden
                        </Badge>
                      )}
                      {activeLeave.status === 'approved' && (
                        <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                          Approved by Warden
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>

        <div className="mt-6">
          <RecentActivity />
        </div>

      </div>

      <FirstLoginModal
        isOpen={showFirstLoginModal}
        userName={studentName}
        onComplete={() => setShowFirstLoginModal(false)}
      />

      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
      />
      <GuestRequestModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
      />
      <MaintenanceRequestModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
      />

      {isPassViewerOpen && (passViewUrl || passViewHtml) && (
        <div
          className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={closePassViewer}
        >
          <div
            className="bg-white rounded-2xl shadow-glass-lg w-full max-w-6xl h-[94dvh] sm:h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="text-base font-semibold text-slate-800">
                Digital Gate Pass - {activePass?.pass_number}
              </h2>
              <button
                onClick={closePassViewer}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-surface-100"
                aria-label="Close pass preview"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              <iframe
                src={passViewUrl ? `${passViewUrl}#zoom=page-width` : undefined}
                srcDoc={passViewHtml || undefined}
                className="w-full h-full border-0"
                title="Digital Gate Pass"
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default Dashboard;
