import { GAME_CONFIG, type BossDefinition } from '@/game/config';
import type { Pet } from '@/db/schema';

export type { BossDefinition };

/**
 * Returns the full list of bosses in progression order.
 */
export function getAllBosses(): BossDefinition[] {
  return GAME_CONFIG.bosses;
}

/**
 * Returns bosses whose `requiredStage` the pet has reached or surpassed.
 * Used to build the visible boss list — harder bosses unlock as the pet grows.
 */
export function getAvailableBosses(pet: Pet): BossDefinition[] {
  const stageOrder: Pet['stage'][] = ['baby', 'child', 'adult', 'elder'];
  const petStageIndex = stageOrder.indexOf(pet.stage);
  return GAME_CONFIG.bosses.filter((b) => stageOrder.indexOf(b.requiredStage) <= petStageIndex);
}

/**
 * Deterministic stat-check: all four requirements must be met simultaneously.
 * No RNG — same inputs always yield the same result.
 */
export function canChallengeBoss(boss: BossDefinition, pet: Pet, streakDays: number): boolean {
  const stageOrder: Pet['stage'][] = ['baby', 'child', 'adult', 'elder'];
  return (
    streakDays >= boss.requiredStreakDays &&
    pet.growthValue >= boss.requiredGrowthValue &&
    pet.stamina >= boss.requiredStamina &&
    stageOrder.indexOf(pet.stage) >= stageOrder.indexOf(boss.requiredStage)
  );
}

export interface BossAttemptResult {
  won: boolean;
  tokensEarned: number;
  dialogueLine: string;
}

/**
 * Attempts the boss challenge.
 *
 * Win/lose is deterministic (stat-check). The only RNG is in picking which
 * dialogue line to show from the boss's dialogue pool on a win.
 *
 * On a loss: tokensEarned = 0, dialogueLine is an empty string.
 */
export function attemptBoss(boss: BossDefinition, pet: Pet, streakDays: number): BossAttemptResult {
  const won = canChallengeBoss(boss, pet, streakDays);

  if (!won) {
    return { won: false, tokensEarned: 0, dialogueLine: '' };
  }

  const dialogueIndex = Math.floor(Math.random() * boss.dialogues.length);
  const dialogueLine = boss.dialogues[dialogueIndex] ?? '';

  return {
    won: true,
    tokensEarned: boss.tokenReward,
    dialogueLine,
  };
}
