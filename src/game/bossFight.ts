import { GAME_CONFIG } from './config';

export function calcPetHp(stamina: number): number {
  return Math.max(stamina, 20) * GAME_CONFIG.walkBossFight.petHpPerStamina;
}

export function calcPetDmg(affection: number): number {
  const cfg = GAME_CONFIG.walkBossFight;
  const base = Math.max(
    cfg.petDmgMin,
    Math.min(cfg.petDmgMax, Math.floor((affection / 100) * cfg.petDmgMax)),
  );
  const variance = Math.floor(base * cfg.dmgVarianceFraction);
  // Roll is uniform in (-variance, +variance]
  const roll = Math.floor((Math.random() * 2 - 1) * variance);
  return Math.max(cfg.petDmgMin, Math.min(cfg.petDmgMax, base + roll));
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

/** Boss deals ~1/bossDmgPetHpFraction of the pet's max HP per hit, with ±variance. */
export function calcBossDmg(petMaxHp: number): number {
  const cfg = GAME_CONFIG.walkBossFight;
  const base = Math.floor(petMaxHp / cfg.bossDmgPetHpFraction);
  const variance = Math.floor(base * cfg.dmgVarianceFraction);
  const roll = Math.floor((Math.random() * 2 - 1) * variance);
  return Math.max(1, base + roll);
}

export function calcReward(fightCount: number): number {
  const cfg = GAME_CONFIG.walkBossFight;
  return cfg.rewardBase + fightCount * cfg.rewardPerFight;
}
