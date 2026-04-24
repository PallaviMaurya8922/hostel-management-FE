import React, { useRef } from 'react';
import { XMarkIcon, CheckIcon, UserIcon } from '@heroicons/react/24/outline';
import Badge from '../Badge';
import type { LeaveRequest, GuestRequest, MaintenanceRequest } from '../../types';
import { formatDateRange } from '../../utils/dateUtils';
import IssuePhotoCollapsible from '../IssuePhotoCollapsible';
import {
  getMaintenanceStatusBadgeVariant,
  getMaintenanceStatusLabel,
} from '../../utils/maintenanceStatusDisplay';
import QRCodeImport from 'react-qr-code';

export type HistoryKind = 'leave' | 'guest' | 'maintenance';

export interface HistoryRow {
  kind: HistoryKind;
  id: string;
  typeLabel: 'Leave' | 'Guest' | 'Maintenance';
  title: string;
  date: string;
  status: string;
  raw: LeaveRequest | GuestRequest | MaintenanceRequest;
}

const QRCodeComponent =
  (QRCodeImport as unknown as { default?: React.ComponentType<any> }).default ?? QRCodeImport;

function formatStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

function statusBadgeVariant(
  status: string
): 'success' | 'warning' | 'danger' {
  const s = status.toLowerCase();
  if (s === 'approved' || s === 'completed' || s === 'active') return 'success';
  if (s === 'pending' || s === 'assigned' || s === 'in_progress') return 'warning';
  return 'danger';
}

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const target = new Date(dateString);
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface RequestHistorySidePanelProps {
  row: HistoryRow | null;
  onClose: () => void;
}

const RequestHistorySidePanel: React.FC<RequestHistorySidePanelProps> = ({
  row,
  onClose,
}) => {
  if (!row) return null;

  const { kind, raw, status } = row;

  const panelStatusLabel =
    kind === 'maintenance'
      ? getMaintenanceStatusLabel(raw as MaintenanceRequest)
      : formatStatusLabel(status);
  const panelStatusVariant =
    kind === 'maintenance'
      ? getMaintenanceStatusBadgeVariant(raw as MaintenanceRequest)
      : statusBadgeVariant(status);

  const headerSummaryText =
    kind === 'leave'
      ? ((raw as LeaveRequest).reason || row.title).trim() || '—'
      : row.title;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] animate-fadeIn"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 bottom-0 z-50 w-full bg-white dark:bg-slate-900 shadow-2xl border-l border-surface-200 dark:border-slate-700 flex flex-col ${
          kind === 'leave' ? 'max-w-lg' : 'max-w-md'
        }`}
        style={{ animation: 'slideInRight 0.22s ease-out' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-history-panel-title"
      >
        <div
          className={`shrink-0 px-5 py-4 border-b border-surface-200 dark:border-slate-700 flex items-start justify-between gap-3 ${
            kind === 'leave'
              ? 'bg-gradient-to-r from-sky-50 via-blue-50/80 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-800'
              : kind === 'guest'
                ? 'bg-gradient-to-r from-emerald-50 to-white dark:from-slate-900 dark:to-slate-800'
                : 'bg-gradient-to-r from-red-50 to-white dark:from-slate-900 dark:to-slate-800'
          }`}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              {row.typeLabel} request
            </p>
            <h2 id="request-history-panel-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
              Request status
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {panelStatusVariant === 'warning' ? (
                <span className="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#FFF4E5] text-[#663D00]">
                  {panelStatusLabel}
                </span>
              ) : (
                <span className="shrink-0">
                  <Badge variant={panelStatusVariant}>{panelStatusLabel}</Badge>
                </span>
              )}
              <span
                className="text-sm font-medium text-slate-900 dark:text-slate-100 min-w-0 flex-1 leading-snug break-words line-clamp-3"
                title={headerSummaryText}
              >
                {headerSummaryText}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-colors shrink-0"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {kind === 'leave' && (
            <LeaveDetails leave={raw as LeaveRequest} />
          )}
          {kind === 'guest' && (
            <GuestDetails guest={raw as GuestRequest} />
          )}
          {kind === 'maintenance' && (
            <MaintenanceDetails maint={raw as MaintenanceRequest} />
          )}
        </div>
      </aside>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

function SummaryField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-slate-900 dark:text-slate-100 font-medium leading-snug break-words">{value ?? '—'}</p>
    </div>
  );
}

function LeaveDetails({ leave }: { leave: LeaveRequest }) {
  const dateFmt: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return (
    <>
      <section className="rounded-2xl border border-surface-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-surface-200/80 dark:border-slate-700">
          Leave summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryField label="Reason" value={leave.reason} />
          <SummaryField
            label="Dates"
            value={formatDateRange(leave.start_date, leave.end_date)}
          />
          <SummaryField label="Duration" value={`${leave.duration_days} day(s)`} />
          <SummaryField label="Short leave" value={leave.is_short_leave ? 'Yes' : 'No'} />
          <div className="sm:col-span-2">
            <SummaryField label="Emergency contact" value={leave.emergency_contact} />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Request progress</h3>
        <div className="relative pl-0 pr-1">
          <div className="absolute left-[6.75rem] top-3 bottom-6 w-px bg-sky-200" aria-hidden />

          <div className="space-y-5 relative">
            {/* Step 1 */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-[5.5rem] sm:w-28 shrink-0 text-right pt-0.5 text-xs">
                <p className="font-semibold text-[#0f1729]">Request Submitted</p>
                <p className="text-sky-700/90 mt-0.5">
                  {new Date(leave.created_at).toLocaleString('en-US', dateFmt)}
                </p>
              </div>
              <div className="relative z-10 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-[3px] border-white shadow-sm shrink-0 mt-0.5">
                <CheckIcon className="w-3 h-3 text-white stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5" />
            </div>

            {/* Step 2 — WhatsApp */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-[5.5rem] sm:w-28 shrink-0 text-right pt-0.5 text-xs">
                <p className="font-semibold text-[#0f1729]">WhatsApp Sent</p>
                <p className="text-sky-700/90 mt-0.5">
                  {new Date(leave.created_at).toLocaleString('en-US', dateFmt)}
                </p>
              </div>
              <div className="relative z-10 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80">
                  Message delivered & read
                </span>
              </div>
            </div>

            {/* Step 3 — Parent */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-[5.5rem] sm:w-28 shrink-0 text-right pt-0.5 text-xs">
                <p className="font-semibold text-[#0f1729]">Parent Approved</p>
                <p className="text-sky-700/90 mt-0.5">
                  {leave.parent_response_at
                    ? new Date(leave.parent_response_at).toLocaleString('en-US', dateFmt)
                    : 'Pending'}
                </p>
              </div>
              <div
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-[3px] border-white shadow-sm shrink-0 mt-0.5 ${
                  leave.parent_approval ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              >
                <UserIcon
                  className={`w-3 h-3 ${leave.parent_approval ? 'text-white' : 'text-slate-400'}`}
                />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                {leave.parent_approval === false && (
                  <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-red-50 text-red-800 ring-1 ring-red-200/80">
                    Parent declined or no response
                  </span>
                )}
              </div>
            </div>

            {/* Step 4 — Warden */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-[5.5rem] sm:w-28 shrink-0 text-right pt-0.5 text-xs">
                <p
                  className={`font-semibold ${
                    leave.status === 'approved' ? 'text-[#0f1729]' : 'text-slate-500'
                  }`}
                >
                  Warden Approval
                </p>
                <p className="text-sky-700/90 mt-0.5">
                  {leave.status === 'approved'
                    ? new Date(leave.updated_at).toLocaleString('en-US', dateFmt)
                    : leave.status === 'rejected'
                      ? new Date(leave.updated_at).toLocaleString('en-US', dateFmt)
                      : 'Pending'}
                </p>
              </div>
              <div
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-[3px] border-white shadow-sm shrink-0 mt-0.5 ${
                  leave.status === 'approved'
                    ? 'bg-emerald-500'
                    : leave.status === 'rejected'
                      ? 'bg-red-500'
                      : 'bg-amber-400 ring-2 ring-amber-200'
                }`}
              >
                {leave.status === 'approved' ? (
                  <CheckIcon className="w-3 h-3 text-white stroke-[2.5]" />
                ) : leave.status === 'rejected' ? (
                  <span className="text-white text-xs font-bold leading-none">×</span>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5 space-y-1.5">
                {leave.status === 'pending' && (
                  <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-900 ring-1 ring-amber-200/80">
                    Awaiting final review by Warden
                  </span>
                )}
                {leave.status === 'approved' && (
                  <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80">
                    Approved by Warden
                  </span>
                )}
                {leave.status === 'rejected' && (
                  <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-red-50 text-red-800 ring-1 ring-red-200/80">
                    Rejected by Warden
                  </span>
                )}
                {(leave.approved_by_name || leave.approval_reason) && leave.status === 'approved' && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {leave.approved_by_name && (
                      <span className="block">By: {leave.approved_by_name}</span>
                    )}
                    {leave.approval_reason && (
                      <span className="block mt-1">Note: {leave.approval_reason}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-2 border-t border-surface-100 dark:border-slate-700">
        <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Record
        </h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div>
            <dt className="text-slate-400 dark:text-slate-500 uppercase tracking-wide text-[10px] mb-0.5">Submitted</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">{new Date(leave.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-slate-400 dark:text-slate-500 uppercase tracking-wide text-[10px] mb-0.5">Last updated</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">{new Date(leave.updated_at).toLocaleString()}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}

function GuestDetails({ guest }: { guest: GuestRequest }) {
  const rel = guest.relationship_display || guest.relationship || '—';
  const guestQrWrapperRef = useRef<HTMLDivElement | null>(null);

  const downloadGuestQr = () => {
    const wrapper = guestQrWrapperRef.current;
    if (!wrapper) return;

    const svg = wrapper.querySelector('svg');
    if (!svg) return;

    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `guest_qr_${guest.request_id}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      // No-op: keep panel interaction uninterrupted if download fails.
    }
  };

  return (
    <>
      <section className="rounded-2xl border border-surface-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-surface-200/80 dark:border-slate-700">
          Guest & visit
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryField label="Guest name" value={guest.guest_name} />
          <SummaryField
            label="Visit type"
            value={guest.visit_type === 'overnight' ? 'Overnight' : 'Normal'}
          />
          <SummaryField label="Relationship" value={rel} />
          <SummaryField label="Guest phone" value={guest.guest_phone} />
          <div className="sm:col-span-2">
            <SummaryField
              label="Visit window"
              value={`${new Date(guest.start_date).toLocaleString()} → ${new Date(guest.end_date).toLocaleString()}`}
            />
          </div>
          <div className="sm:col-span-2">
            <SummaryField label="Purpose" value={guest.purpose} />
          </div>
          <SummaryField label="Duration" value={`${guest.duration_days} day(s)`} />
        </div>
      </section>
      <section className="rounded-2xl border border-surface-200 dark:border-slate-700 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-surface-200/80 dark:border-slate-700">
          Status & approval
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryField label="Auto-approved" value={guest.auto_approved ? 'Yes' : 'No'} />
          <SummaryField
            label="Current approval"
            value={
              guest.status === 'approved' || guest.status === 'active' ? (
                <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80">
                  Approved
                </span>
              ) : guest.status === 'pending' ? (
                <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-900 ring-1 ring-amber-200/80">
                  Awaiting warden review
                </span>
              ) : (
                <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-red-50 text-red-800 ring-1 ring-red-200/80">
                  {formatStatusLabel(guest.status)}
                </span>
              )
            }
          />
          <SummaryField label="Approved by" value={guest.approved_by_name || '—'} />
          <SummaryField label="Approval note" value={guest.approval_reason || '—'} />
          <div className="sm:col-span-2">
            <SummaryField
              label="QR / gate"
              value={
                guest.qr_token || guest.qr_image_path ? (
                  <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80">
                    QR issued for this visit
                  </span>
                ) : (
                  '—'
                )
              }
            />
          </div>
        </div>
      </section>
      {guest.qr_token && (
        <section className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-900/20 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-emerald-200/80 dark:border-emerald-800">
            Guest Entry QR
          </h3>
          <div className="flex items-start gap-4">
            <div
              ref={guestQrWrapperRef}
              className="w-28 h-28 rounded-xl bg-white border border-emerald-100 flex items-center justify-center p-2 shrink-0"
            >
              <QRCodeComponent
                value={guest.qr_token}
                size={96}
                bgColor="#ffffff"
                fgColor="#0f172a"
                style={{ height: '100%', width: '100%' }}
                aria-label={`Guest QR for ${guest.guest_name}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{guest.guest_name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Visit: {guest.visit_type === 'overnight' ? 'Overnight' : 'Normal'}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Valid: {formatDateRange(guest.start_date, guest.end_date)}</p>
              {guest.status !== 'approved' && guest.status !== 'active' && (
                <p className="text-[11px] text-amber-700 mt-1">Issued QR from approved request (history copy).</p>
              )}
              <button
                type="button"
                onClick={downloadGuestQr}
                className="mt-3 inline-flex items-center justify-center rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors"
              >
                Download Guest QR
              </button>
            </div>
          </div>
        </section>
      )}
      <section className="pt-2 border-t border-surface-100 dark:border-slate-700">
        <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Record
        </h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div>
            <dt className="text-slate-400 dark:text-slate-500 uppercase tracking-wide text-[10px] mb-0.5">Submitted</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">{new Date(guest.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-slate-400 dark:text-slate-500 uppercase tracking-wide text-[10px] mb-0.5">Last updated</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">{new Date(guest.updated_at).toLocaleString()}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}

function MaintenanceDetails({ maint }: { maint: MaintenanceRequest }) {
  const progressionOrder: Record<MaintenanceRequest['status'], number> = {
    pending: 0,
    assigned: 1,
    in_progress: 2,
    completed: 3,
    cancelled: 1,
  };

  const currentStep = progressionOrder[maint.status] ?? 0;
  const isCancelled = maint.status === 'cancelled';

  return (
    <>
      <section className="rounded-2xl border border-surface-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-surface-200/80 dark:border-slate-700">
          Complaint
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryField label="Issue type" value={maint.issue_type} />
          <SummaryField label="Room" value={maint.room_number} />
          <SummaryField
            label="Priority"
            value={
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  maint.priority === 'high'
                    ? 'bg-red-50 text-red-800 ring-1 ring-red-200/80'
                    : maint.priority === 'medium'
                      ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
                      : 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/80'
                }`}
              >
                {maint.priority.charAt(0).toUpperCase() + maint.priority.slice(1)}
              </span>
            }
          />
          <div className="sm:col-span-2">
            <SummaryField label="Description" value={maint.description} />
          </div>
          <div className="sm:col-span-2">
            <IssuePhotoCollapsible
              attachment={maint.attachment}
              heading="Issue photo"
              emptyText="No photo uploaded"
            />
          </div>
        </div>
      </section>
      <section className="rounded-2xl border border-surface-200 dark:border-slate-700 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-surface-200/80 dark:border-slate-700">
          Work status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryField label="Assigned to" value={maint.assigned_to_name || '—'} />
          <SummaryField
            label="Current state"
            value={
              maint.status === 'completed' ? (
                <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80">
                  Completed
                </span>
              ) : maint.status === 'assigned' || maint.status === 'in_progress' ? (
                <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-sky-50 text-sky-800 ring-1 ring-sky-200/80">
                  {formatStatusLabel(maint.status)}
                </span>
              ) : maint.status === 'pending' ? (
                maint.is_overdue ? (
                  <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-red-50 text-red-800 ring-1 ring-red-200/80">
                    Overdue
                  </span>
                ) : (
                  <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-900 ring-1 ring-amber-200/80">
                    {getMaintenanceStatusLabel(maint)}
                  </span>
                )
              ) : (
                <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 ring-1 ring-slate-200/80">
                  {formatStatusLabel(maint.status)}
                </span>
              )
            }
          />
          <SummaryField
            label="Estimated completion"
            value={maint.estimated_completion ? new Date(maint.estimated_completion).toLocaleString() : '—'}
          />
          <SummaryField
            label="Completed"
            value={maint.actual_completion ? new Date(maint.actual_completion).toLocaleString() : '—'}
          />
          {maint.status !== 'pending' ? (
            <SummaryField
              label="Overdue (vs ETA)"
              value={
                maint.is_overdue ? (
                  <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-red-50 text-red-800 ring-1 ring-red-200/80">
                    Yes
                  </span>
                ) : (
                  'No'
                )
              }
            />
          ) : null}
          <div className="sm:col-span-2">
            <SummaryField label="Staff notes" value={maint.notes || '—'} />
          </div>
        </div>

        <div className="mt-5 border-t border-surface-200/80 dark:border-slate-700 pt-4">
          <h4 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Progress timeline
          </h4>
          <div className="space-y-2.5">
            {[
              { key: 0, label: 'Complaint submitted', time: maint.created_at },
              { key: 1, label: 'Assigned', time: maint.status !== 'pending' ? maint.updated_at : null },
              { key: 2, label: 'Work started', time: maint.status === 'in_progress' || maint.status === 'completed' ? maint.updated_at : null },
              { key: 3, label: 'Completed', time: maint.actual_completion || (maint.status === 'completed' ? maint.updated_at : null) },
            ].map(step => {
              const isDone = !isCancelled && step.key <= currentStep;
              const isCurrent = !isCancelled && step.key === currentStep;
              return (
                <div key={step.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                        isDone
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-surface-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800'
                      }`}
                    >
                      {isDone ? '✓' : '○'}
                    </span>
                    <span className={`text-sm ${isCurrent ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                      {step.label}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {step.time ? formatRelativeTime(step.time) : 'Pending'}
                  </span>
                </div>
              );
            })}
            {isCancelled ? (
              <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
                This request was cancelled before completion.
              </p>
            ) : null}
          </div>
        </div>
      </section>
      <section className="pt-2 border-t border-surface-100 dark:border-slate-700">
        <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Record
        </h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div>
            <dt className="text-slate-400 dark:text-slate-500 uppercase tracking-wide text-[10px] mb-0.5">Submitted</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">{new Date(maint.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-slate-400 dark:text-slate-500 uppercase tracking-wide text-[10px] mb-0.5">Last updated</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">
              {new Date(maint.updated_at).toLocaleString()} ({formatRelativeTime(maint.updated_at)})
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}

export default RequestHistorySidePanel;
