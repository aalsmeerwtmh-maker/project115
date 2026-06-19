import { GAME_CONFIG } from './config';

export function calcPetHp(stamina: number): number {
  return Math.max(stamina, 20) * GAME_CONFIG.walkBossFight.petHpPerStamina;
}

export function calcPetDmg(affection: number): number {
  const cfg = GAME_CONFIG.walkBossFight;
  // Always clamp to [petDmgMin, petDmgMax] so even aff 0–20 deal petDmgMin.
  // Only aff 100 produces petDmgMax (99 999 999), which slightly exceeds
  // bossHpBase (99 000 000) → guaranteed 1-shot at max affection.
  return Math.max(
    cfg.petDmgMin,
    Math.min(cfg.petDmgMax, Math.floor((affection / 100) * cfg.petDmgMax)),
  );
}

export function calcBossHp(affection: number, fightCount: number): number {
  const cfg = GAME_CONFIG.walkBossFight;
  return Math.max(
    500,
    Math.floor(
      cfg.bossHpBase *
        (1 + affection * cfg.bossHpAffectionMultiplier) *
        (1 + fightCount * cfg.bossHpFightMultiplier),
    ),
  );
}

/** Boss deals 1/bossDmgPetHpFraction of the pet's max HP per hit. */
export function calcBossDmg(petMaxHp: number): number {
  return Math.floor(petMaxHp / GAME_CONFIG.walkBossFight.bossDmgPetHpFraction);
}

export function calcReward(fightCount: number): number {
  const cfg = GAME_CONFIG.walkBossFight;
  return cfg.rewardBase + fightCount * cfg.rewardPerFight;
}
