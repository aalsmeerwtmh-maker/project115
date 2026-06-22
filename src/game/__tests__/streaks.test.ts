import { computeStreak } from '../streaks';

// Helpers to produce date strings relative to today in local time.
function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return localDateString(d);
}

const today = addDays(0);
const yesterday = addDays(-1);
const twoDaysAgo = addDays(-2);

describe('computeStreak', () => {
  describe('null lastCheckinDate (first ever check-in)', () => {
    it('returns 1', () => {
      expect(computeStreak(null, 0)).toBe(1);
    });

    it('ignores currentStreak value and returns 1', () => {
      expect(computeStreak(null, 5)).toBe(1);
    });
  });

  describe('lastCheckinDate is today (double-count guard)', () => {
    it('returns currentStreak unchanged', () => {
      expect(computeStreak(today, 3)).toBe(3);
    });

    it('returns 1 unchanged when streak is 1', () => {
      expect(computeStreak(today, 1)).toBe(1);
    });
  });

  describe('lastCheckinDate is yesterday (consecutive day)', () => {
    it('increments streak by 1', () => {
      expect(computeStreak(yesterday, 4)).toBe(5);
    });

    it('starts streak from 1 → 2 on second consecutive day', () => {
      expect(computeStreak(yesterday, 1)).toBe(2);
    });

    it('correctly increments a 7-day streak to 8', () => {
      expect(computeStreak(yesterday, 7)).toBe(8);
    });
  });

  describe('lastCheckinDate is two or more days ago (gap — streak resets)', () => {
    it('resets to 1 when last check-in was two days ago', () => {
      expect(computeStreak(twoDaysAgo, 5)).toBe(1);
    });

    it('resets to 1 when last check-in was a week ago', () => {
      expect(computeStreak(addDays(-7), 20)).toBe(1);
    });

    it('resets to 1 when last check-in was 30 days ago', () => {
      expect(computeStreak(addDays(-30), 30)).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('handles a far-future date as "today or later" → returns currentStreak unchanged', () => {
      // A future date is not yesterday or older, so it will not increment or reset,
      // but it is also not "today" — result should be reset to 1 (gap logic).
      const futureDate = addDays(1);
      expect(computeStreak(futureDate, 5)).toBe(1);
    });
  });
});
