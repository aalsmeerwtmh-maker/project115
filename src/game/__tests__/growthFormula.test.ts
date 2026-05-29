import { stepsToFood, streakMultiplier, computeDailyGrowth, growthToStage } from '../growthFormula';

describe('stepsToFood', () => {
  it('returns 0 for 0 steps', () => {
    expect(stepsToFood(0)).toBe(0);
  });

  it('returns 0 for steps below one food unit threshold', () => {
    expect(stepsToFood(499)).toBe(0);
  });

  it('yields 1 food at exactly 500 steps', () => {
    expect(stepsToFood(500)).toBe(1);
  });

  it('yields 16 food at 8000 steps', () => {
    expect(stepsToFood(8000)).toBe(16);
  });

  it('floors partial units', () => {
    expect(stepsToFood(1499)).toBe(2);
  });
});

describe('streakMultiplier', () => {
  it('is 1.0 at streak 0', () => {
    expect(streakMultiplier(0)).toBeCloseTo(1.0);
  });

  it('is 1.05 at streak 1', () => {
    expect(streakMultiplier(1)).toBeCloseTo(1.05);
  });

  it('is 1.35 at streak 7 (max)', () => {
    expect(streakMultiplier(7)).toBeCloseTo(1.35);
  });

  it('caps at 7 days — streak 10 equals streak 7', () => {
    expect(streakMultiplier(10)).toBeCloseTo(streakMultiplier(7));
  });

  it('clamps negative input to 1.0', () => {
    expect(streakMultiplier(-5)).toBeCloseTo(1.0);
  });
});

describe('computeDailyGrowth', () => {
  it('returns 0 food and 0 growth for 0 steps with no goal', () => {
    const result = computeDailyGrowth({
      stepCount: 0,
      dailyGoal: 8000,
      consecutiveStreakDays: 0,
    });
    expect(result.foodEarned).toBe(0);
    expect(result.growthValue).toBeCloseTo(0);
  });

  it('applies no goal bonus when steps fall short', () => {
    const result = computeDailyGrowth({
      stepCount: 4000,
      dailyGoal: 8000,
      consecutiveStreakDays: 0,
    });
    expect(result.foodEarned).toBe(8);
    // 8 * 0.05 * 1.0 = 0.40, no goal bonus
    expect(result.growthValue).toBeCloseTo(0.4);
  });

  it('adds daily-goal bonus when step goal is met exactly', () => {
    const result = computeDailyGrowth({
      stepCount: 8000,
      dailyGoal: 8000,
      consecutiveStreakDays: 0,
    });
    expect(result.foodEarned).toBe(16);
    // 16 * 0.05 * 1.0 + 0.30 = 1.10
    expect(result.growthValue).toBeCloseTo(1.1);
  });

  it('adds daily-goal bonus when steps exceed goal', () => {
    const result = computeDailyGrowth({
      stepCount: 10000,
      dailyGoal: 8000,
      consecutiveStreakDays: 0,
    });
    expect(result.foodEarned).toBe(20);
    // 20 * 0.05 * 1.0 + 0.30 = 1.30
    expect(result.growthValue).toBeCloseTo(1.3);
  });

  it('applies streak multiplier to step-growth portion only', () => {
    const base = computeDailyGrowth({
      stepCount: 8000,
      dailyGoal: 8000,
      consecutiveStreakDays: 0,
    });
    const withStreak = computeDailyGrowth({
      stepCount: 8000,
      dailyGoal: 8000,
      consecutiveStreakDays: 7,
    });
    // step portion: 16 * 0.05 * 1.35 = 1.08, + 0.30 = 1.38
    expect(withStreak.growthValue).toBeGreaterThan(base.growthValue);
    expect(withStreak.growthValue).toBeCloseTo(1.38);
  });

  it('produces ~91-day lifecycle at 8k steps, 0 streak, goal hit every day', () => {
    const daily = computeDailyGrowth({
      stepCount: 8000,
      dailyGoal: 8000,
      consecutiveStreakDays: 0,
    });
    const daysToComplete = 100 / daily.growthValue;
    expect(daysToComplete).toBeGreaterThan(80);
    expect(daysToComplete).toBeLessThan(100);
  });
});

describe('growthToStage', () => {
  it('is baby at 0', () => expect(growthToStage(0)).toBe('baby'));
  it('is baby at 24.99', () => expect(growthToStage(24.99)).toBe('baby'));
  it('is child at 25', () => expect(growthToStage(25)).toBe('child'));
  it('is adult at 50', () => expect(growthToStage(50)).toBe('adult'));
  it('is elder at 75', () => expect(growthToStage(75)).toBe('elder'));
  it('is elder above 100', () => expect(growthToStage(150)).toBe('elder'));
});
