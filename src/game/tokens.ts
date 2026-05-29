import { GAME_CONFIG } from '@/game/config';

// Maximum tokens earnable from time-in-app per calendar day.
// Prevents idle farming while a walk session is left running overnight.
export const TIME_IN_APP_DAILY_CAP = 60;

/**
 * Returns the flat token bonus awarded when the user hits a streak milestone
 * (every N consecutive days as configured).
 */
export function calcStreakBonus(): number {
  return GAME_CONFIG.tokenEarnRates.streakMilestoneBonus;
}

/**
 * Returns true when `consecutiveDays` lands exactly on a milestone interval.
 * e.g. with milestoneEveryNDays = 7: days 7, 14, 21 … all return true.
 */
export function isStreakMilestone(consecutiveDays: number): boolean {
  if (consecutiveDays <= 0) return false;
  return consecutiveDays % GAME_CONFIG.tokenEarnRates.streakMilestoneEveryNDays === 0;
}

/**
 * Returns the token reward for defeating a boss.
 * Returns 0 when the bossId is not found in the config.
 */
export function calcBossReward(bossId: string): number {
  const boss = GAME_CONFIG.bosses.find((b) => b.id === bossId);
  return boss?.tokenReward ?? 0;
}

/**
 * Returns the tokens awarded each time the player enters a new geofence cell
 * during an active walk session.
 */
export function checkinTokenAmount(): number {
  return GAME_CONFIG.tokenEarnRates.checkinPerCell;
}

/**
 * Returns the tokens awarded per minute while a walk session is active.
 * Callers are responsible for enforcing the daily cap via progressStore.
 */
export function timeInAppTokenAmount(): number {
  return GAME_CONFIG.tokenEarnRates.timeInAppPerMinute;
}
