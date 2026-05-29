import { toDateString, nowMs } from '@/utils/date';

describe('toDateString', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const date = new Date('2024-03-15T10:30:00Z');
    expect(toDateString(date)).toBe('2024-03-15');
  });

  it('defaults to today when no argument is given', () => {
    // Should match the current UTC date — just check the format.
    expect(toDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('nowMs', () => {
  it('returns a positive integer close to Date.now()', () => {
    const before = Date.now();
    const result = nowMs();
    const after = Date.now();
    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });
});
