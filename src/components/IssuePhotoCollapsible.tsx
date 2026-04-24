import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { absoluteMediaUrl } from '../utils/mediaUrl';

export interface IssuePhotoCollapsibleProps {
  attachment?: string | null;
  /** Section heading */
  heading?: string;
  /** Shown when there is no attachment */
  emptyText?: string;
  /** Subtext on the expand bar when a photo exists */
  summaryWhenPresent?: string;
  className?: string;
  /** Visual weight for nested contexts */
  tone?: 'panel' | 'inline';
  /** Use inside buttons/cards so expand does not trigger parent click */
  stopTogglePropagation?: boolean;
}

/**
 * Issue photo: plain message when empty; collapsible bar + image when a file exists.
 */
const IssuePhotoCollapsible: React.FC<IssuePhotoCollapsibleProps> = ({
  attachment,
  heading = 'Issue photo',
  emptyText = 'No photo uploaded',
  summaryWhenPresent = 'Tap to show or hide the image',
  className = '',
  tone = 'panel',
  stopTogglePropagation = false,
}) => {
  const [open, setOpen] = useState(false);
  const src = absoluteMediaUrl(attachment ?? undefined);

  const wrap =
    tone === 'panel'
      ? 'rounded-xl border border-surface-200 bg-white dark:border-slate-600 dark:bg-slate-900/50'
      : 'rounded-lg border border-surface-200 bg-slate-50/90 dark:border-slate-600 dark:bg-slate-800/50';

  if (!src) {
    return (
      <p className={`text-sm text-slate-600 dark:text-slate-300 ${className}`}>{emptyText}</p>
    );
  }

  const onToggle = (e: React.MouseEvent) => {
    if (stopTogglePropagation) e.stopPropagation();
    setOpen(v => !v);
  };

  return (
    <div className={`${wrap} overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80"
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {heading}
          </span>
          <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300">{summaryWhenPresent}</span>
        </span>
        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 text-slate-500 transition-transform dark:text-slate-400 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-surface-200 px-3 pb-3 pt-2 dark:border-slate-600">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => {
              if (stopTogglePropagation) e.stopPropagation();
            }}
            className="text-sm font-medium text-cyan-700 hover:underline dark:text-cyan-400"
          >
            Open full size in new tab
          </a>
          <img
            src={src}
            alt=""
            className="mt-2 max-h-72 w-full rounded-lg border border-surface-200 object-contain dark:border-slate-600"
            onClick={e => {
              if (stopTogglePropagation) e.stopPropagation();
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default IssuePhotoCollapsible;
