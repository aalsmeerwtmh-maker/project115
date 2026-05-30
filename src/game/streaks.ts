// Streak calculation: consecutive days, break detection, double-count guard.

/**
 * Compute the new streak value given a last-checkin date and the current streak count.
 *
 * Rules:
 *  - If `lastCheckinDate` was yesterday → increment: currentStreak + 1.
 *  - If `lastCheckinDate` was more than one day ago (or null) → reset to 1.
 *  - If `lastCheckinDate` is today → unchanged (guard against double-count).
 *
 * All date arithmetic uses UTC-midnight boundaries to avoid DST surprises.
 *
 * @param lastCheckinDate  'YYYY-MM-DD' string, or null if the user has never checked in.
 * @param currentStreak    The streak value stored in the progress store.
 * @returns                The new streak value to persist.
 */
export function computeStreak(lastCheckinDate: string | null, currentStreak: number): number {
  const todayStr = utcDateString(new Date());

  // First-ever check-in.
  if (lastCheckinDate === null) return 1;

  // Guard: already checked in today — do not increment.
  if (lastCheckinDate === todayStr) return currentStreak;

  const yesterdayStr = utcDateString(addDays(new Date(), -1));

  if (lastCheckinDate === yesterdayStr) {
    // Consecutive day — extend streak.
    return currentStreak + 1;
  }

  // Gap in streak — reset.
  return 1;
}

// ---------------------------------------------------------------------------
// Date helpers (pure, no global side-effects)
// ---------------------------------------------------------------------------

/** Returns 'YYYY-MM-DD' in UTC for a given Date. */
function utcDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns a new Date that is `n` calendar days offset from `date`. */
function addDays(date: Date, n: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + n);
  return result;
}
