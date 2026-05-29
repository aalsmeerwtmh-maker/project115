import {
  calcStreakBonus,
  isStreakMilestone,
  calcBossReward,
  checkinTokenAmount,
  timeInAppTokenAmount,
  TIME_IN_APP_DAILY_CAP,
} from '../tokens';

describe('calcStreakBonus', () => {
  it('returns 10 (configured streak milestone bonus)', () => {
    expect(calcStreakBonus()).toBe(10);
  });
});

describe('isStreakMilestone', () => {
  it('is true at day 7', () => expect(isStreakMilestone(7)).toBe(true));
  it('is false at day 6', () => expect(isStreakMilestone(6)).toBe(false));
  it('is true at day 14 (second weekly milestone)', () => expect(isStreakMilestone(14)).toBe(true));
  it('is true at day 21', () => expect(isStreakMilestone(21)).toBe(true));
  it('is false at day 0', () => expect(isStreakMilestone(0)).toBe(false));
  it('is false at day 1', () => expect(isStreakMilestone(1)).toBe(false));
  it('is false at negative input', () => expect(isStreakMilestone(-7)).toBe(false));
});

describe('calcBossReward', () => {
  it('returns 30 for boss_mudpaw', () => expect(calcBossReward('boss_mudpaw')).toBe(30));
  it('returns 75 for boss_thornback', () => expect(calcBossReward('boss_thornback')).toBe(75));
  it('returns 150 for boss_ironmaw', () => expect(calcBossReward('boss_ironmaw')).toBe(150));
  it('returns 250 for boss_shadowhowl', () => expect(calcBossReward('boss_shadowhowl')).toBe(250));
  it('returns 400 for boss_voidstrider', () => expect(calcBossReward('boss_voidstrider')).toBe(400));
  it('returns 0 for an unknown boss id', () => expect(calcBossReward('boss_unknown')).toBe(0));
});

describe('checkinTokenAmount', () => {
  it('returns 5 (configured checkinPerCell)', () => expect(checkinTokenAmount()).toBe(5));
});

describe('timeInAppTokenAmount', () => {
  it('returns 1 (configured timeInAppPerMinute)', () => expect(timeInAppTokenAmount()).toBe(1));
});

describe('TIME_IN_APP_DAILY_CAP', () => {
  it('is 60', () => expect(TIME_IN_APP_DAILY_CAP).toBe(60));
});
