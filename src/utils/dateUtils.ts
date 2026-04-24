/**
 * Date utility functions for formatting dates and times
 */

/**
 * Format a date string as relative time (e.g., "2 hours ago", "Jan 27, 10:30 AM")
 * Uses relative time for recent dates (< 24 hours) and absolute time for older dates
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Less than 1 minute
  if (diffMinutes < 1) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  // Less than 24 hours
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }

  // Less than 7 days
  if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }

  // Older than 7 days - show absolute date and time
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  return date.toLocaleString('en-US', options);
};

/**
 * Format a date string as a readable date (e.g., "Jan 27, 2025")
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Format a date range (e.g., "Jan 27 - Jan 30, 2025")
 */
export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  const endOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  return `${start.toLocaleDateString('en-US', startOptions)} - ${end.toLocaleDateString('en-US', endOptions)}`;
};

/** Time-of-day greeting for the signed-in user (local clock). */
export function getTimeOfDayGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Good night';
}

/**
 * Short name for header greeting: first name, else email local-part, else "there".
 */
export function greetingDisplayName(
  name: string | undefined,
  email: string | undefined
): string {
  const trimmed = (name || '').trim();
  if (trimmed) {
    return trimmed.split(/\s+/)[0];
  }
  const em = (email || '').trim();
  if (em.includes('@')) {
    return em.split('@')[0];
  }
  return 'there';
}

/** Local calendar day as `YYYY-MM-DD` for `<input type="date">` and same-day filtering. */
export function toLocalDateInputKey(isoDateString: string): string {
  const d = new Date(isoDateString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
