/**
 * Human-readable how long a maintenance ticket has been past its saved ETA.
 * Uses elapsed wall time from `estimated_completion` to now (client clock).
 */
export function formatPastDueAfterEta(estimatedCompletion?: string | null): string {
  if (!estimatedCompletion) return 'Past due';
  const eta = new Date(estimatedCompletion).getTime();
  if (Number.isNaN(eta)) return 'Past due';
  const ms = Date.now() - eta;
  if (ms <= 0) return 'Past due';

  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'Past due less than a minute';
  if (minutes < 60) {
    return minutes === 1 ? 'Past due 1 minute' : `Past due ${minutes} minutes`;
  }

  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) {
    return hours === 1 ? 'Past due 1 hour' : `Past due ${hours} hours`;
  }

  const days = Math.floor(ms / 86_400_000);
  if (days < 30) {
    return days === 1 ? 'Past due 1 day' : `Past due ${days} days`;
  }

  if (days < 365) {
    const months = Math.floor(days / 30);
    return months <= 1 ? 'Past due 1 month' : `Past due ${months} months`;
  }

  const years = Math.floor(days / 365);
  return years === 1 ? 'Past due 1 year' : `Past due ${years} years`;
}
