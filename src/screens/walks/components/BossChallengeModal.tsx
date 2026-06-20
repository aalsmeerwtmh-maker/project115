import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useProgressStore } from '@/stores/progressStore';
import { usePetStore } from '@/stores/petStore';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';
import { GAME_CONFIG } from '@/game/config';
import { calcBossHp, calcBossDmg, calcPetHp, calcPetDmg, calcReward } from '@/game/bossFight';

// ---------------------------------------------------------------------------
// Frame image registry (static requires — Metro doesn't support dynamic paths)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Img = any;

const DOG_FRAMES: readonly Img[] = [
  require('../../../../assets/vs/boss_vs_dog_1.png'),
  require('../../../../assets/vs/boss_vs_dog_2.png'),
  require('../../../../assets/vs/boss_vs_dog_3.png'),
  require('../../../../assets/vs/boss_vs_dog_4.png'),
  require('../../../../assets/vs/boss_vs_dog_5.png'),
  require('../../../../assets/vs/boss_vs_dog_6.png'),
  require('../../../../assets/vs/boss_vs_dog_7.png'),
];

const VS_FRAMES: Record<string, readonly Img[]> = {
  dog: DOG_FRAMES,
  cat: [
    require('../../../../assets/vs/boss_vs_cat_1.png'),
    require('../../../../assets/vs/boss_vs_cat_2.png'),
    require('../../../../assets/vs/boss_vs_cat_3.png'),
    require('../../../../assets/vs/boss_vs_cat_4.png'),
    require('../../../../assets/vs/boss_vs_cat_5.png'),
    require('../../../../assets/vs/boss_vs_cat_6.png'),
    require('../../../../assets/vs/boss_vs_cat_7.png'),
  ],
  bird: [
    require('../../../../assets/vs/boss_vs_bird_1.png'),
    require('../../../../assets/vs/boss_vs_bird_2.png'),
    require('../../../../assets/vs/boss_vs_bird_3.png'),
    require('../../../../assets/vs/boss_vs_bird_4.png'),
    require('../../../../assets/vs/boss_vs_bird_5.png'),
    require('../../../../assets/vs/boss_vs_bird_6.png'),
    require('../../../../assets/vs/boss_vs_bird_7.png'),
  ],
};

// ---------------------------------------------------------------------------
// Fight state machine
// idle → petAttacking → [won | bossAttacking] → [lost | idle]
// lost → shopping (inline food shop) → [idle (bought food) | lost (exited)]
// ---------------------------------------------------------------------------

type FightPhase = 'idle' | 'petAttacking' | 'bossAttacking' | 'won' | 'lost' | 'shopping';

function getFrameIndex(phase: FightPhase, tick: number): number {
  switch (phase) {
    case 'idle':          return 0;
    case 'petAttacking':  return tick % 2 === 0 ? 2 : 4;
    case 'bossAttacking': return tick % 2 === 0 ? 1 : 3;
    case 'won':           return 6;
    case 'lost':
    case 'shopping':      return 3;
  }
}

// ---------------------------------------------------------------------------
// HpBar
// ---------------------------------------------------------------------------

function HpBar({ current, max, label, barColor }: { current: number; max: number; label: string; barColor: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  return (
    <View style={hpStyles.container}>
      <View style={hpStyles.row}>
        <Text style={hpStyles.label}>{label}</Text>
        <Text style={hpStyles.value}>{current.toLocaleString()}</Text>
      </View>
      <View style={hpStyles.track}>
        <View style={[hpStyles.fill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const hpStyles = StyleSheet.create({
  container: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { ...typography.caption, color: '#FFFFFF', opacity: 0.85 },
  value: { ...typography.caption, color: '#FFFFFF', fontWeight: 'bold' },
  track: { height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 7 },
});

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BossChallengeModalProps {
  visible: boolean;
  species: string;
  petName: string;
  stamina: number;
  affection: number;
  fightCount: number;
  /** Called when "Continue Walk" is pressed after winning. */
  onWin: (tokensEarned: number) => void;
  /** Called when "Give Up" is pressed — fight count increments, modal closes. */
  onGiveUp: () => void;
}

// ---------------------------------------------------------------------------
// Food display name helper
// ---------------------------------------------------------------------------

function getFoodDisplayName(id: string): string {
  if (id === 'food_bread') return t.statusCheck.foodBread;
  if (id === 'food_milk') return t.statusCheck.foodMilk;
  return t.statusCheck.foodFeeds;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BossChallengeModal({
  visible,
  species,
  petName,
  stamina,
  affection,
  fightCount,
  onWin,
  onGiveUp,
}: BossChallengeModalProps) {
  const tokens        = useProgressStore((s) => s.tokens);
  const spendTokens   = useProgressStore((s) => s.spendTokens);
  const activePet     = usePetStore((s) => s.activePet);
  const updateActivePet = usePetStore((s) => s.updateActivePet);

  const frames = VS_FRAMES[species] ?? DOG_FRAMES;
  const reward = calcReward(fightCount);

  const [phase, setPhase]               = useState<FightPhase>('idle');
  const [tick, setTick]                 = useState(0);
  const [petHp, setPetHp]               = useState(0);
  const [petMaxHp, setPetMaxHp]         = useState(0);
  const [bossHp, setBossHp]             = useState(0);
  const [bossMaxHp, setBossMaxHp]       = useState(0);
  const [bossDmgFlash, setBossDmgFlash] = useState<number | null>(null);
  const [petDmgFlash, setPetDmgFlash]   = useState<number | null>(null);
  const [loadingFoodId, setLoadingFoodId] = useState<string | null>(null);

  const petHpRef     = useRef(petHp);
  const bossHpRef    = useRef(bossHp);
  const bossMaxHpRef = useRef(bossMaxHp);
  const petMaxHpRef  = useRef(petMaxHp);
  const phaseRef     = useRef(phase);
  petHpRef.current     = petHp;
  bossHpRef.current    = bossHp;
  bossMaxHpRef.current = bossMaxHp;
  petMaxHpRef.current  = petMaxHp;
  phaseRef.current     = phase;

  // Reset whenever the modal opens with a fresh fight.
  useEffect(() => {
    if (!visible) return;
    const maxHp = calcPetHp(stamina);
    const bHp   = calcBossHp(affection, fightCount);
    setPetHp(maxHp);
    setPetMaxHp(maxHp);
    setBossHp(bHp);
    setBossMaxHp(bHp);
    setPhase('idle');
    setTick(0);
    setBossDmgFlash(null);
    setPetDmgFlash(null);
    setLoadingFoodId(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Tick counter drives frame cycling during active attack phases.
  useEffect(() => {
    if (phase !== 'petAttacking' && phase !== 'bossAttacking') return;
    const id = setInterval(() => setTick(prev => prev + 1), 200);
    return () => clearInterval(id);
  }, [phase]);

  function handleAttack() {
    if (phaseRef.current !== 'idle') return;
    const petDmg  = calcPetDmg(affection);
    const bossDmg = calcBossDmg(petMaxHpRef.current);

    setTick(0);
    setPhase('petAttacking');

    setTimeout(() => {
      const newBossHp = Math.max(0, bossHpRef.current - petDmg);
      setBossHp(newBossHp);
      setBossDmgFlash(petDmg);
      setTimeout(() => setBossDmgFlash(null), 1200);

      if (newBossHp <= 0) {
        setPhase('won');
        return;
      }

      setTimeout(() => {
        setTick(0);
        setPhase('bossAttacking');

        setTimeout(() => {
          const newPetHp = Math.max(0, petHpRef.current - bossDmg);
          setPetHp(newPetHp);
          setPetDmgFlash(bossDmg);
          setTimeout(() => setPetDmgFlash(null), 1200);

          setPhase(newPetHp <= 0 ? 'lost' : 'idle');
        }, 700);
      }, 150);
    }, 750);
  }

  async function handleBuyFood(foodId: string) {
    const food = GAME_CONFIG.food.find((f) => f.id === foodId);
    if (!food || tokens < food.tokenCost) return;
    setLoadingFoodId(foodId);
    try {
      await spendTokens(food.tokenCost);
      const currentStamina   = activePet?.stamina   ?? 20;
      const currentAffection = activePet?.affection ?? 0;
      const newStamina   = Math.min(100, currentStamina   + food.staminaBoost);
      const newAffection = Math.min(100, currentAffection + food.affectionBoost);
      await updateActivePet({ stamina: newStamina, affection: newAffection });
      const newMaxHp  = calcPetHp(newStamina);
      const healedHp  = food.staminaBoost * GAME_CONFIG.walkBossFight.petHpPerStamina;
      setPetMaxHp(newMaxHp);
      setPetHp(Math.min(newMaxHp, Math.max(1, healedHp)));
      setPhase('idle');
    } finally {
      setLoadingFoodId(null);
    }
  }

  function handleExitPress() {
    Alert.alert(
      t.walkBoss.exitConfirmTitle,
      t.walkBoss.exitConfirmMessage,
      [
        { text: t.walkBoss.exitConfirmNo, style: 'cancel' },
        { text: t.walkBoss.exitConfirmYes, style: 'destructive', onPress: onGiveUp },
      ],
    );
  }

  const frameIndex = getFrameIndex(phase, tick);
  const frameSrc: Img = (frames[frameIndex] ?? frames[0]) as Img;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* ── Inline food shop panel ── */}
          {phase === 'shopping' && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.shopHeader}>
                <Text style={styles.shopTitle}>{t.walkBoss.shopTitle}</Text>
                <Text style={styles.shopSubtitle}>{t.walkBoss.shopSubtitle}</Text>
                <Text style={styles.tokenBalance}>{t.statusCheck.tokenBalance(tokens)}</Text>
              </View>

              {GAME_CONFIG.food.map((food) => {
                const canAfford = tokens >= food.tokenCost;
                const isLoading = loadingFoodId === food.id;
                const hpRestore = food.staminaBoost * GAME_CONFIG.walkBossFight.petHpPerStamina;
                return (
                  <TouchableOpacity
                    key={food.id}
                    style={[styles.foodRow, !canAfford && styles.foodRowDisabled]}
                    onPress={() => { void handleBuyFood(food.id); }}
                    disabled={!canAfford || loadingFoodId !== null}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                  >
                    <Text style={styles.foodEmoji}>{food.emoji}</Text>
                    <View style={styles.foodInfo}>
                      <Text style={[styles.foodName, !canAfford && styles.foodNameDisabled]}>
                        {getFoodDisplayName(food.id)}
                      </Text>
                      <Text style={styles.foodStats}>
                        {t.statusCheck.foodStats(food.staminaBoost, food.affectionBoost)}
                        {' · '}
                        +{hpRestore.toLocaleString()} HP
                      </Text>
                    </View>
                    {isLoading
                      ? <ActivityIndicator color="#FFFFFF" size="small" />
                      : (
                        <Text style={[styles.foodCost, !canAfford && styles.foodCostDisabled]}>
                          {food.tokenCost} 🪙
                        </Text>
                      )
                    }
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.shopExitButton}
                onPress={() => setPhase('lost')}
                activeOpacity={0.8}
              >
                <Text style={styles.shopExitButtonText}>{t.walkBoss.shopExitButton}</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ── Normal fight UI (hidden while shopping) ── */}
          {phase !== 'shopping' && (
            <>
              {/* Header row with exit button */}
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  <Text style={styles.title}>{t.walkBoss.encounterTitle}</Text>
                  <Text style={styles.subtitle}>{t.walkBoss.fightCount(fightCount)}</Text>
                </View>
                {(phase === 'idle' || phase === 'petAttacking' || phase === 'bossAttacking') && (
                  <TouchableOpacity style={styles.exitButton} onPress={handleExitPress} activeOpacity={0.7}>
                    <Text style={styles.exitButtonText}>{t.walkBoss.exitButton}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <HpBar
                current={bossHp}
                max={bossMaxHp}
                label={t.walkBoss.bossHpLabel}
                barColor={colors.error}
              />

              {/* VS image + damage flash numbers */}
              <View style={styles.imageContainer}>
                <Image source={frameSrc} style={styles.vsImage} resizeMode="contain" />
                {bossDmgFlash != null && (
                  <View style={styles.dmgBossContainer} pointerEvents="none">
                    <Text style={styles.dmgBossText}>-{bossDmgFlash.toLocaleString()}</Text>
                  </View>
                )}
                {petDmgFlash != null && (
                  <View style={styles.dmgPetContainer} pointerEvents="none">
                    <Text style={styles.dmgPetText}>-{petDmgFlash.toLocaleString()}</Text>
                  </View>
                )}
              </View>

              <HpBar
                current={petHp}
                max={petMaxHp}
                label={t.walkBoss.petHpLabel(petName)}
                barColor={colors.success}
              />

              {/* Attack button — only shown while fighting */}
              {phase === 'idle' && (
                <TouchableOpacity style={styles.attackButton} onPress={handleAttack} activeOpacity={0.75}>
                  <Text style={styles.attackButtonText}>{t.walkBoss.attackButton}</Text>
                </TouchableOpacity>
              )}

              {/* Win result */}
              {phase === 'won' && (
                <View style={styles.resultContainer}>
                  <Text style={styles.winTitle}>{t.walkBoss.winTitle}</Text>
                  <Text style={styles.rewardText}>{t.walkBoss.winReward(reward)}</Text>
                  <TouchableOpacity style={styles.continueButton} onPress={() => onWin(reward)} activeOpacity={0.8}>
                    <Text style={styles.continueButtonText}>{t.walkBoss.continueButton}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Lost — must buy food to revive or give up; cannot fight without condition */}
              {phase === 'lost' && (
                <View style={styles.resultContainer}>
                  <Text style={styles.loseTitle}>{t.walkBoss.loseTitle}</Text>
                  <Text style={styles.loseMessage}>{t.walkBoss.loseMessage}</Text>
                  <TouchableOpacity
                    style={styles.shopButton}
                    onPress={() => setPhase('shopping')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.shopButtonText}>{t.walkBoss.shopButton}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.giveUpButton} onPress={onGiveUp} activeOpacity={0.8}>
                    <Text style={styles.giveUpButtonText}>{t.walkBoss.giveUpButton}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    width: '100%',
    backgroundColor: '#1a1a2e',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryContainer,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerText: { flex: 1 },
  title: {
    ...typography.heading2,
    color: colors.primaryContainer,
  },
  subtitle: {
    ...typography.caption,
    color: '#FFFFFF',
    opacity: 0.6,
    marginTop: 2,
  },
  exitButton: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  exitButtonText: { ...typography.caption, color: 'rgba(255,255,255,0.6)' },
  imageContainer: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    position: 'relative',
  },
  vsImage: { width: '100%', height: '100%' },
  dmgBossContainer: { position: 'absolute', top: 16, right: spacing.lg },
  dmgBossText: {
    ...typography.heading2,
    color: '#FF5252',
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  dmgPetContainer: { position: 'absolute', bottom: 16, left: spacing.lg },
  dmgPetText: {
    ...typography.heading3,
    color: '#FF9800',
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  attackButton: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  attackButtonText: { ...typography.bodyBold, color: colors.onPrimaryContainer, fontSize: 18 },
  resultContainer: { marginTop: spacing.md, alignItems: 'center', gap: spacing.sm },
  winTitle: { ...typography.heading2, color: '#FFD700', textAlign: 'center' },
  rewardText: { ...typography.bodyBold, color: '#FFFFFF', textAlign: 'center' },
  loseTitle: { ...typography.heading3, color: '#FF5252', textAlign: 'center' },
  loseMessage: { ...typography.body, color: '#FFFFFF', opacity: 0.8, textAlign: 'center' },
  continueButton: {
    backgroundColor: colors.tertiary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  continueButtonText: { ...typography.bodyBold, color: colors.onTertiary },
  shopButton: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  shopButtonText: { ...typography.bodyBold, color: colors.onSecondary },
  giveUpButton: {
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  giveUpButtonText: { ...typography.bodyBold, color: 'rgba(255,255,255,0.6)' },

  // ── Inline food shop ──
  shopHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  shopTitle: {
    ...typography.heading2,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  shopSubtitle: {
    ...typography.body,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  tokenBalance: {
    ...typography.bodyBold,
    color: colors.primaryContainer,
    textAlign: 'center',
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  foodRowDisabled: {
    opacity: 0.45,
  },
  foodEmoji: { fontSize: 28 },
  foodInfo: { flex: 1 },
  foodName: {
    ...typography.bodyBold,
    color: '#FFFFFF',
  },
  foodNameDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
  foodStats: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  foodCost: {
    ...typography.bodyBold,
    color: '#FFD700',
  },
  foodCostDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
  shopExitButton: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  shopExitButtonText: {
    ...typography.bodyBold,
    color: 'rgba(255,255,255,0.6)',
  },
});
