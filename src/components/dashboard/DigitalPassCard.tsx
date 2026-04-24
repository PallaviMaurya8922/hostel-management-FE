import React, { useEffect, useState } from 'react';
import { TicketIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Card from '../Card';
import Badge from '../Badge';
import Button from '../Button';
import type { DigitalPass } from '../../types';
import { downloadPass, viewPass } from '../../api/passes';

/**
 * Digital Pass Card Component
 * Displays individual pass with status, dates, and actions
 * Requirements: 3.4, 3.5, 4.3, 4.4, 6.1, 6.9
 */

interface DigitalPassCardProps {
  pass: DigitalPass;
  onDownloadSuccess?: () => void;
  onDownloadError?: (error: string) => void;
}

const DigitalPassCard: React.FC<DigitalPassCardProps> = React.memo(
  ({ pass, onDownloadSuccess, onDownloadError }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isViewing, setIsViewing] = useState(false);
    const [passViewUrl, setPassViewUrl] = useState<string | null>(null);
    const [passViewHtml, setPassViewHtml] = useState<string | null>(null);
    const [isLoadingView, setIsLoadingView] = useState(false);

    const enhancePassHtmlForPreview = (html: string) => {
      const previewStyle = `
        <style id="pass-preview-scale-style">
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
              transform: scale(1.15);
            }
          }
        </style>
      `;

      if (/<\/head>/i.test(html)) {
        return html.replace(/<\/head>/i, `${previewStyle}</head>`);
      }

      return `${previewStyle}${html}`;
    };

    useEffect(() => {
      return () => {
        if (passViewUrl) {
          window.URL.revokeObjectURL(passViewUrl);
        }
      };
    }, [passViewUrl]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDate = new Date(`${pass.from_date}T00:00:00`);
    const toDate = new Date(`${pass.to_date}T00:00:00`);

    const isUpcoming = pass.status === 'active' && today < fromDate;
    const isActiveNow = pass.status === 'active' && today >= fromDate && today <= toDate;
    const isExpired =
      pass.status === 'expired' || (pass.status === 'active' && today > toDate);

    // Determine status badge variant and text
    const getStatusBadge = () => {
      if (isActiveNow) {
        return { variant: 'success' as const, text: 'Active' };
      }
      if (isUpcoming) {
        return { variant: 'warning' as const, text: 'Upcoming' };
      }
      if (pass.status === 'pending') {
        return { variant: 'warning' as const, text: 'Pending' };
      }
      if (isExpired) {
        return { variant: 'danger' as const, text: 'Expired' };
      }
      return { variant: 'info' as const, text: pass.status };
    };

    // Determine highlight color for card border
    const getHighlightColor = () => {
      if (isActiveNow) return 'green-500';
      if (isUpcoming) return 'yellow-500';
      if (pass.status === 'pending') return 'yellow-500';
      if (isExpired) return 'red-500';
      return 'gray-500';
    };

    // Format date for display
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    // Handle PDF download
    const handleDownload = async () => {
      setIsDownloading(true);
      try {
        const blob = await downloadPass(pass.pass_number);

        // Create download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pass_${pass.pass_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        onDownloadSuccess?.();
      } catch (error) {
        console.error('Download failed:', error);
        onDownloadError?.('Failed to download pass. Please try again.');
      } finally {
        setIsDownloading(false);
      }
    };

    // Handle view details
    const handleViewDetails = async () => {
      setIsLoadingView(true);
      try {
        const blob = await viewPass(pass.pass_number);
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

        setIsViewing(true);
      } catch (error) {
        console.error('Failed to load pass details:', error);
        onDownloadError?.('Failed to load pass details. Please try again.');
      } finally {
        setIsLoadingView(false);
      }
    };

    // Handle close modal
    const handleCloseModal = () => {
      setIsViewing(false);
      if (passViewUrl) {
        window.URL.revokeObjectURL(passViewUrl);
      }
      setPassViewUrl(null);
      setPassViewHtml(null);
    };

    const statusBadge = getStatusBadge();
    const canDownload = pass.status !== 'cancelled';

    return (
      <Card
        variant="highlighted"
        highlightColor={getHighlightColor()}
        className={[
          isActiveNow ? 'ring-2 ring-emerald-200 bg-emerald-50/30' : '',
          isExpired ? 'opacity-60' : '',
        ].join(' ').trim()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <TicketIcon className="w-5 h-5 text-brand-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                {pass.pass_number}
              </h3>
              <p className="text-xs text-slate-500">{pass.student_name}</p>
            </div>
          </div>
          <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Valid From</span>
            <span className="font-medium text-slate-800">{formatDate(pass.from_date)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Valid To</span>
            <span className="font-medium text-slate-800">{formatDate(pass.to_date)}</span>
          </div>
          {pass.is_valid && pass.days_remaining > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Days Remaining</span>
              <span className="font-medium text-emerald-600">
                {pass.days_remaining} {pass.days_remaining === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Duration</span>
            <span className="font-medium text-slate-800">
              {pass.total_days} {pass.total_days === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {canDownload && (
            <Button
              variant="primary"
              size="small"
              onClick={handleDownload}
              loading={isDownloading}
              disabled={isDownloading}
              icon={<ArrowDownTrayIcon className="w-4 h-4" />}
              aria-label={`Download pass ${pass.pass_number}`}
            >
              Download PDF
            </Button>
          )}
          <Button
            variant="secondary"
            size="small"
            onClick={handleViewDetails}
            loading={isLoadingView}
            disabled={isLoadingView}
            aria-label={`View details for pass ${pass.pass_number}`}
          >
            View Details
          </Button>
        </div>

        {/* Pass Details Modal */}
        {isViewing && (passViewUrl || passViewHtml) && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn" onClick={handleCloseModal}>
            <div
              className="bg-white rounded-2xl shadow-glass-lg w-full max-w-6xl h-[92dvh] sm:h-[90vh] overflow-hidden flex flex-col animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
                <h2 className="text-base font-semibold text-slate-800">
                  Pass Details - {pass.pass_number}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-surface-100"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-auto">
                <iframe
                  src={passViewUrl ? `${passViewUrl}#zoom=page-width` : undefined}
                  srcDoc={passViewHtml || undefined}
                  className="w-full h-full border-0"
                  title="Pass Details"
                />
              </div>

              <div className="flex gap-2 px-6 py-4 border-t border-surface-200 bg-surface-50/50">
                <Button
                  variant="primary"
                  size="small"
                  onClick={handleDownload}
                  loading={isDownloading}
                  disabled={isDownloading}
                  icon={<ArrowDownTrayIcon className="w-4 h-4" />}
                >
                  Download PDF
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={handleCloseModal}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  }
);

DigitalPassCard.displayName = 'DigitalPassCard';

export default DigitalPassCard;
