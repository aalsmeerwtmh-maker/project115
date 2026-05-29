import { getAllBosses, getAvailableBosses, canChallengeBoss, attemptBoss } from '../bosses';
import type { Pet } from '@/db/schema';

// Helper: build a Pet with only the fields bosses.ts needs
function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'test-pet',
    name: 'Tester',
    species: 'dog',
    stage: 'baby',
    stamina: 50,
    affection: 0,
    growthValue: 0,
    mood: 'normal',
    isActive: true,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

// Qualifying stats for boss_mudpaw
const MUDPAW_QUALIFYING = makePet({
  stage: 'baby',
  stamina: 55,
  growthValue: 5,
});
const MUDPAW_STREAK = 3;

describe('getAllBosses', () => {
  it('returns 5 bosses', () => {
    expect(getAllBosses()).toHaveLength(5);
  });

  it('starts with boss_mudpaw', () => {
    expect(getAllBosses()[0]?.id).toBe('boss_mudpaw');
  });
});

describe('getAvailableBosses', () => {
  it('baby-stage pet sees only boss_mudpaw', () => {
    const pet = makePet({ stage: 'baby' });
    const available = getAvailableBosses(pet);
    expect(available).toHaveLength(1);
    expect(available[0]?.id).toBe('boss_mudpaw');
  });

  it('child-stage pet sees mudpaw and thornback', () => {
    const pet = makePet({ stage: 'child' });
    const available = getAvailableBosses(pet);
    expect(available.map((b) => b.id)).toEqual(
      expect.arrayContaining(['boss_mudpaw', 'boss_thornback']),
    );
    expect(available).toHaveLength(2);
  });

  it('adult-stage pet sees mudpaw, thornback, and ironmaw', () => {
    const pet = makePet({ stage: 'adult' });
    const available = getAvailableBosses(pet);
    expect(available).toHaveLength(3);
  });

  it('elder-stage pet sees all 5 bosses', () => {
    const pet = makePet({ stage: 'elder' });
    const available = getAvailableBosses(pet);
    expect(available).toHaveLength(5);
  });
});

describe('canChallengeBoss — boss_mudpaw', () => {
  const boss = getAllBosses().find((b) => b.id === 'boss_mudpaw')!;

  it('returns false when stamina is 50 (below required 55)', () => {
    expect(canChallengeBoss(boss, makePet({ stage: 'baby', stamina: 50, growthValue: 5 }), 3)).toBe(false);
  });

  it('returns false when streak is insufficient', () => {
    expect(canChallengeBoss(boss, MUDPAW_QUALIFYING, 2)).toBe(false);
  });

  it('returns false when growthValue is below threshold', () => {
    expect(canChallengeBoss(boss, makePet({ stage: 'baby', stamina: 55, growthValue: 4 }), 3)).toBe(false);
  });

  it('returns true when all requirements are met exactly', () => {
    expect(canChallengeBoss(boss, MUDPAW_QUALIFYING, MUDPAW_STREAK)).toBe(true);
  });

  it('returns true when requirements are exceeded', () => {
    expect(
      canChallengeBoss(boss, makePet({ stage: 'baby', stamina: 80, growthValue: 20 }), 10),
    ).toBe(true);
  });
});

describe('attemptBoss', () => {
  const boss = getAllBosses().find((b) => b.id === 'boss_mudpaw')!;

  it('returns won: false, tokensEarned: 0 when requirements not met', () => {
    const result = attemptBoss(boss, makePet({ stage: 'baby', stamina: 50, growthValue: 0 }), 0);
    expect(result.won).toBe(false);
    expect(result.tokensEarned).toBe(0);
  });

  it('returns won: true, tokensEarned: 30 with qualifying stats', () => {
    const result = attemptBoss(boss, MUDPAW_QUALIFYING, MUDPAW_STREAK);
    expect(result.won).toBe(true);
    expect(result.tokensEarned).toBe(30);
  });

  it('returns a non-empty dialogue line on a win', () => {
    const result = attemptBoss(boss, MUDPAW_QUALIFYING, MUDPAW_STREAK);
    expect(result.dialogueLine.length).toBeGreaterThan(0);
  });

  it('returns an empty dialogue line on a loss', () => {
    const result = attemptBoss(boss, makePet(), 0);
    expect(result.dialogueLine).toBe('');
  });

  it('win dialogue is always one of the configured lines', () => {
    const result = attemptBoss(boss, MUDPAW_QUALIFYING, MUDPAW_STREAK);
    expect(boss.dialogues).toContain(result.dialogueLine);
  });
});
