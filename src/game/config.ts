// DO NOT hardcode game-balance numbers outside this file.
// All token rates, boss requirements, shop prices, and IAP bundles
// are controlled here so balance tuning requires only one file change.

export interface BossDefinition {
  id: string;
  name: string;
  description: string;
  villainLine: string; // shown on the challenge screen before the fight (villain style)
  requiredStreakDays: number;
  requiredGrowthValue: number;
  requiredStage: 'baby' | 'child' | 'adult' | 'elder';
  requiredStamina: number;
  tokenReward: number;
  retryBlockHours: number; // hours the player must wait before retrying after a loss
  dialogues: string[]; // pet-perspective win lines shown in result modal
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: 'hat' | 'suit' | 'accessory' | 'background';
  tokenCost: number;
  iapProductId: string | null;
  assetKey: string;
}

export interface IapBundle {
  productId: string;
  tokenAmount: number;
  displayPrice: string;
}

export interface FoodItem {
  id: string;
  tokenCost: number;
  staminaBoost: number;
  affectionBoost: number;
  emoji: string;
}

export interface TokenEarnRates {
  checkinPerCell: number;
  streakMilestoneEveryNDays: number;
  streakMilestoneBonus: number;
  timeInAppPerMinute: number; // tokens per minute of active app use (walk session active)
}

export interface WalkEvents {
  /** How often a random walk event fires, in minutes. */
  intervalMinutes: number;
  /** Pet-perspective dialogue snippets shown during a walk. These are game content strings, not i18n keys. */
  dialogues: string[];
}

export interface WalkBossFightConfig {
  stepTrigger: number;
  timeTriggerSecs: number;
  petHpPerStamina: number;
  petDmgMin: number;
  petDmgMax: number;
  bossHpBase: number;
  bossHpAffectionMultiplier: number;
  bossHpFightMultiplier: number;
  bossDmgPetHpFraction: number;
  bossStaminaCost: number;
  rewardBase: number;
  rewardPerFight: number;
  /** Fraction of base damage applied as ±random variance each hit (0.25 = ±25%). */
  dmgVarianceFraction: number;
}

export interface BadgeDef {
  id: 'first_walk' | 'streak_7' | 'streak_30' | 'steps_100k';
  emoji: string;
  tokenReward: number;
}

export interface PetGrowthConfig {
  /** Growth points earned per minute of active walk session. */
  growthPerMinuteWalking: number;
  /** Minimum walk duration (minutes) before any growth is awarded. */
  minMinutesForGrowth: number;
}

export interface ARConfig {
  depthEnabled: boolean; // ARCore Depth API; set false to save battery on low-end hardware
  /** Maximum distance (metres) from the camera for each hit-test type before the result is rejected. */
  hitTestMaxDistances: {
    existingPlaneUsingExtent: number;
    existingPlane: number;
    estimatedHorizontalPlane: number;
    featurePoint: number;
  };
  /** Minimum depth-confidence (0–1) when depth data is present; results below this are skipped. */
  minDepthConfidence: number;
  /** Milliseconds to show the "Placing…" state before transitioning to "placed". */
  placingFeedbackMs: number;
  /** Horizontal distance (m) beyond which the pet starts walking toward the user. */
  petFollowDistanceM: number;
  /** Horizontal distance (m) within which the pet stops following and resumes its mood. */
  petArriveDistanceM: number;
  /** Metres the pet moves per step tick while following. */
  petWalkStepM: number;
  /** Milliseconds between each step tick while the pet is following the user. */
  petWalkStepIntervalMs: number;
}

export interface GameConfig {
  badges: BadgeDef[];
  bosses: BossDefinition[];
  walkBossFight: WalkBossFightConfig;
  equipment: EquipmentItem[];
  food: FoodItem[];
  iapBundles: IapBundle[];
  tokenEarnRates: TokenEarnRates;
  walkEvents: WalkEvents;
  ar: ARConfig;
  petGrowth: PetGrowthConfig;
  /** Step count thresholds that control the home-screen pet animation tier. */
  petAnimationStepThresholds: {
    excited: number; // steps ≥ this → excited wiggle
    happy: number;   // steps ≥ this → happy bounce
    normal: number;  // steps ≥ this → gentle float; below → sad droop
  };
  /** Token cost to rename a pet after the first (free) rename. */
  petRenameCost: number;
  /** How long (ms) the eating display mood persists after the player feeds their pet. */
  foodMoodDurationMs: number;
}

export const GAME_CONFIG: GameConfig = {
  badges: [
    { id: 'first_walk',  emoji: '👟', tokenReward: 30  },
    { id: 'streak_7',   emoji: '🔥', tokenReward: 100 },
    { id: 'streak_30',  emoji: '🏆', tokenReward: 500 },
    { id: 'steps_100k', emoji: '💯', tokenReward: 200 },
  ],

  walkBossFight: {
    stepTrigger: 200,
    timeTriggerSecs: 300,
    petHpPerStamina: 100,
    // petDmgMin is the floor DMG regardless of affection (aff 0–20 all deal this).
    // Only affection 100 reaches petDmgMax, which slightly exceeds bossHpBase → 1-shot.
    petDmgMin: 20_000_000,
    petDmgMax: 99_999_999,
    bossHpBase: 99_000_000,
    bossHpAffectionMultiplier: 0,   // boss HP does not scale with affection
    bossHpFightMultiplier: 0.2,     // boss grows 20 % per fight
    // Boss deals 1/bossDmgPetHpFraction of the pet's max HP per hit.
    // At 7, a full-HP pet survives exactly 7 hits before going down.
    bossDmgPetHpFraction: 7,
    // Stamina drained from the pet each time a boss encounter starts.
    bossStaminaCost: 5,
    rewardBase: 20,
    rewardPerFight: 10,
    dmgVarianceFraction: 0.25,
  },

  tokenEarnRates: {
    checkinPerCell: 5,
    streakMilestoneEveryNDays: 7,
    streakMilestoneBonus: 10,
    timeInAppPerMinute: 1,
  },

  bosses: [
    {
      id: 'boss_mudpaw',
      name: 'Mudpaw the Rascal',
      description: 'A scrappy little troublemaker who has been stirring up the neighbourhood.',
      villainLine:
        "Oh look, a tiny baby pet. How adorable. Come back when you've grown up a little, yeah?",
      requiredStreakDays: 3,
      requiredGrowthValue: 5,
      requiredStage: 'baby',
      requiredStamina: 55,
      tokenReward: 30,
      retryBlockHours: 12,
      dialogues: [
        "We did it! Mudpaw won't be bothering the park squirrels anymore.",
        'Ha! That rascal never saw my finishing move coming.',
        'First win! My paws are shaking but my heart is full.',
      ],
    },
    {
      id: 'boss_thornback',
      name: 'Thornback Rex',
      description: 'A spiky brute who claims the riverside as his personal territory.',
      villainLine:
        'You think a few walks make you tough? My spines have been battle-tested for years. Step up.',
      requiredStreakDays: 7,
      requiredGrowthValue: 25,
      requiredStage: 'child',
      requiredStamina: 65,
      tokenReward: 75,
      retryBlockHours: 18,
      dialogues: [
        "Thornback tried to bite me but I dodged every single one. That's my new move!",
        'The river is ours now. We earned this view.',
        'Seven days of walks. Seven days of grit. Worth every step.',
      ],
    },
    {
      id: 'boss_ironmaw',
      name: 'Ironmaw the Titan',
      description: 'A colossal guardian who refuses to let anyone cross the mountain pass.',
      villainLine:
        "The mountain pass is MINE. I've crushed challengers who trained twice as hard as you. Turn around.",
      requiredStreakDays: 14,
      requiredGrowthValue: 50,
      requiredStage: 'adult',
      requiredStamina: 75,
      tokenReward: 150,
      retryBlockHours: 24,
      dialogues: [
        "The Titan fell. I still can't believe it. We actually did it.",
        'Ironmaw hit the ground and I just kept running. Two weeks of training paid off.',
        'The mountain pass is open. Wherever we go next, we go together.',
      ],
    },
    {
      id: 'boss_shadowhowl',
      name: 'Shadowhowl Prime',
      description: 'A spectral predator who haunts the twilight trails and feeds on doubt.',
      villainLine:
        "I have stalked these trails for centuries. Your determination amuses me. It won't save you.",
      requiredStreakDays: 21,
      requiredGrowthValue: 75,
      requiredStage: 'elder',
      requiredStamina: 90,
      tokenReward: 250,
      retryBlockHours: 24,
      dialogues: [
        "Shadowhowl's howl faded into the night. I didn't flinch. Not even once.",
        "Three weeks of dawn runs to get here. Shadowhowl didn't stand a chance.",
        'The twilight trail is peaceful again. We are the reason why.',
      ],
    },
    {
      id: 'boss_voidstrider',
      name: 'Voidstrider the Eternal',
      description: 'An ancient force who has watched civilisations rise and fall from the void.',
      villainLine:
        'I have outlasted empires. A month of morning jogs will not impress me. Impress me anyway.',
      requiredStreakDays: 30,
      requiredGrowthValue: 90,
      requiredStage: 'elder',
      requiredStamina: 100,
      tokenReward: 400,
      retryBlockHours: 48,
      dialogues: [
        "The Eternal bowed. I think that means we're done. We're really done.",
        "Thirty days. Every single one. Voidstrider called it impressive. I'll take it.",
        'From the void to the park bench — what a journey. Thank you for every step.',
      ],
    },
  ],

  equipment: [
    {
      id: 'hat_cozy',
      name: 'Cozy Hat',
      category: 'hat',
      tokenCost: 80,
      iapProductId: null,
      assetKey: 'hat_cozy',
    },
    {
      id: 'suit_formal',
      name: 'Suit',
      category: 'suit',
      tokenCost: 150,
      iapProductId: null,
      assetKey: 'suit_formal',
    },
    {
      id: 'bg_park',
      name: 'Park Background',
      category: 'background',
      tokenCost: 100,
      iapProductId: null,
      assetKey: 'bg_park',
    },
    {
      id: 'bg_winter_park',
      name: 'Winter Park Background',
      category: 'background',
      tokenCost: 120,
      iapProductId: null,
      assetKey: 'bg_winter_park',
    },
  ],

  food: [
    { id: 'food_bread', tokenCost: 5,  staminaBoost: 5,  affectionBoost: 2,  emoji: '🍞' },
    { id: 'food_milk',  tokenCost: 10, staminaBoost: 10, affectionBoost: 5,  emoji: '🥛' },
    { id: 'food_feeds', tokenCost: 20, staminaBoost: 20, affectionBoost: 10, emoji: '🦴' },
  ],

  iapBundles: [
    {
      productId: 'pawstep.tokens.small',
      tokenAmount: 100,
      displayPrice: '$0.99',
    },
    {
      productId: 'pawstep.tokens.medium',
      tokenAmount: 300,
      displayPrice: '$2.49',
    },
    {
      productId: 'pawstep.tokens.large',
      tokenAmount: 700,
      displayPrice: '$4.99',
    },
  ],

  ar: {
    depthEnabled: false,
    hitTestMaxDistances: {
      existingPlaneUsingExtent: 3.5,
      existingPlane: 3.0,
      estimatedHorizontalPlane: 2.5,
      featurePoint: 1.5,
    },
    minDepthConfidence: 0.3,
    placingFeedbackMs: 700,
    petFollowDistanceM: 2.0,
    petArriveDistanceM: 0.5,
    petWalkStepM: 0.025,
    petWalkStepIntervalMs: 50,
  },

  petGrowth: {
    growthPerMinuteWalking: 0.1,
    minMinutesForGrowth: 2,
  },

  petAnimationStepThresholds: {
    excited: 7000,
    happy: 3000,
    normal: 1,
  },

  petRenameCost: 5,
  foodMoodDurationMs: 10 * 60 * 1000,

  walkEvents: {
    intervalMinutes: 10,
    dialogues: [
      "Oh! That puddle smelled incredible. I'm adding it to my mental map.",
      'Every step we take together makes my paws a little stronger.',
      'Did you see that squirrel? It waved. I waved back. We have an understanding.',
      "The air is different here. Fresher, maybe. Or maybe I'm just happy.",
      'I found a really great stick. I left it behind. The world deserves to enjoy it.',
      'This is my favourite part of the walk — the part where we just keep going.',
      "I'm pretty sure I can see farther when I'm walking with you.",
      "Something moved in those bushes. I've decided it was friendly.",
    ],
  },
};
