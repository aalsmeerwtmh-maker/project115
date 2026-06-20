import { GAME_CONFIG } from './config';

// Growth calibration:
// At 8,000 steps/day with no streak and daily goal hit:
//   food = floor(8000 / 500) = 16 units
//   step growth = 16 * FOOD_TO_GROWTH_RATE = 0.80
//   goal bonus  = DAILY_GOAL_BONUS = 0.30
//   total/day   ≈ 1.10 → 100 growth over ~91 days (target: 90-day lifecycle)
// Streak multiplier scales the step-growth portion only, so casual walkers
// still progress while consistent walkers advance meaningfully faster.

const STEPS_PER_FOOD = 500;
const FOOD_TO_GROWTH_RATE = 0.05; // growth points per food unit
const DAILY_GOAL_BONUS = 0.3; // bonus applied once when daily goal is met
const MAX_STREAK_DAYS = 7; // multiplier caps at 7 consecutive days
const STREAK_MULTIPLIER_PER_DAY = 0.05; // +5 % per consecutive day, up to +35 %

export function stepsToFood(stepCount: number): number {
  return Math.floor(stepCount / STEPS_PER_FOOD);
}

export function streakMultiplier(consecutiveDays: number): number {
  const days = Math.max(0, Math.min(consecutiveDays, MAX_STREAK_DAYS));
  return 1 + days * STREAK_MULTIPLIER_PER_DAY;
}

export interface GrowthInput {
  stepCount: number;
  dailyGoal: number;
  consecutiveStreakDays: number;
}

export interface GrowthResult {
  foodEarned: number;
  growthValue: number;
}

export function computeDailyGrowth(input: GrowthInput): GrowthResult {
  const foodEarned = stepsToFood(input.stepCount);
  const mult = streakMultiplier(input.consecutiveStreakDays);
  const stepGrowth = foodEarned * FOOD_TO_GROWTH_RATE * mult;
  const goalBonus = input.stepCount >= input.dailyGoal ? DAILY_GOAL_BONUS : 0;
  const growthValue = stepGrowth + goalBonus;
  return { foodEarned, growthValue };
}

// Total accumulated growth → pet stage.
// Each stage spans 25 growth points; elder is final.
export type PetStage = 'baby' | 'child' | 'adult' | 'elder';

export function growthToStage(totalGrowth: number): PetStage {
  if (totalGrowth < 25) return 'baby';
  if (totalGrowth < 50) return 'child';
  if (totalGrowth < 75) return 'adult';
  return 'elder';
}

export function timeToGrowth(durationSeconds: number): number {
  const { growthPerMinuteWalking, minMinutesForGrowth } = GAME_CONFIG.petGrowth;
  const minutes = durationSeconds / 60;
  if (minutes < minMinutesForGrowth) return 0;
  return Math.round(minutes * growthPerMinuteWalking * 100) / 100;
}
