import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';
import { calcBossHp, calcBossDmg, calcPetHp, calcPetDmg, calcReward } from '@/game/bossFight';

// ---------------------------------------------------------------------------
// Frame image registry (static requires — Metro doesn't support dynamic paths)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Img = any;

// Dog frames are also used as the fallback, so they live outside the Record.
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
// ---------------------------------------------------------------------------

type FightPhase = 'idle' | 'petAttacking' | 'bossAttacking' | 'won' | 'lost';

function getFrameIndex(phase: FightPhase, tick: number): number {
  switch (phase) {
    case 'idle':          return 0;
    case 'petAttacking':  return tick % 2 === 0 ? 2 : 4; // frames 3 & 5
    case 'bossAttacking': return tick % 2 === 0 ? 1 : 3; // frames 2 & 4
    case 'won':           return 6;
    case 'lost':          return 3;
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
// Snapshot passed to onShopPress so the parent can resume the fight later
// ---------------------------------------------------------------------------

export interface BossFightSnapshot {
  bossHp: number;
  bossMaxHp: number;
}

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
  /**
   * When non-null the fight resumes at these values instead of starting fresh.
   * Set by the parent after the user returns from the Shop screen.
   */
  continueBossHp?: number;
  continueBossMaxHp?: number;
  /** Pet HP to restore when resuming (based on food bought in the Shop). */
  continuePetHp?: number;
  /** Called when "Continue Walk" is pressed after winning. */
  onWin: (tokensEarned: number) => void;
  /**
   * Called when "Go to Shop" is pressed after losing.
   * Receives a snapshot of the current boss HP so the fight can resume.
   */
  onShopPress: (snapshot: BossFightSnapshot) => void;
  /** Called when "Give Up" is pressed — fight count increments, modal closes. */
  onGiveUp: () => void;
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
  continueBossHp,
  continueBossMaxHp,
  continuePetHp,
  onWin,
  onShopPress,
  onGiveUp,
}: BossChallengeModalProps) {
  const frames = VS_FRAMES[species] ?? DOG_FRAMES;
  const reward = calcReward(fightCount);

  const [phase, setPhase]             = useState<FightPhase>('idle');
  const [tick, setTick]               = useState(0);
  const [petHp, setPetHp]             = useState(0);
  const [petMaxHp, setPetMaxHp]       = useState(0);
  const [bossHp, setBossHp]           = useState(0);
  const [bossMaxHp, setBossMaxHp]     = useState(0);
  const [bossDmgFlash, setBossDmgFlash] = useState<number | null>(null);
  const [petDmgFlash, setPetDmgFlash]   = useState<number | null>(null);

  // Stable refs so setTimeout closures always see the latest HP values.
  const petHpRef    = useRef(petHp);
  const bossHpRef   = useRef(bossHp);
  const bossMaxHpRef = useRef(bossMaxHp);
  const petMaxHpRef  = useRef(petMaxHp);
  const phaseRef    = useRef(phase);
  petHpRef.current    = petHp;
  bossHpRef.current   = bossHp;
  bossMaxHpRef.current = bossMaxHp;
  petMaxHpRef.current  = petMaxHp;
  phaseRef.current    = phase;

  // Reset (or resume) whenever the modal opens or continuation props change.
  useEffect(() => {
    if (!visible) return;
    const maxHp = calcPetHp(stamina);
    const bHp     = continueBossHp   ?? calcBossHp(affection, fightCount);
    const bMaxHp  = continueBossMaxHp ?? bHp;
    // When resuming, the pet's HP comes from the parent (based on food bought).
    // Cap at the new maxHp so a stamina reduction doesn't over-restore.
    const pHp = continuePetHp !== undefined
      ? Math.min(maxHp, Math.max(1, continuePetHp))
      : maxHp;
    setPetHp(pHp);
    setPetMaxHp(maxHp);
    setBossHp(bHp);
    setBossMaxHp(bMaxHp);
    setPhase('idle');
    setTick(0);
    setBossDmgFlash(null);
    setPetDmgFlash(null);
  // Re-run only when modal opens or continuation state changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, continueBossHp, continueBossMaxHp, continuePetHp]);

  // Tick counter drives frame cycling during active attack phases.
  useEffect(() => {
    if (phase !== 'petAttacking' && phase !== 'bossAttacking') return;
    const id = setInterval(() => setTick(prev => prev + 1), 200);
    return () => clearInterval(id);
  }, [phase]);

  function handleAttack() {
    if (phaseRef.current !== 'idle') return;
    const petDmg  = calcPetDmg(affection);
    // Boss DMG = 1/7 of pet's max HP so a full-HP pet survives exactly 7 hits.
    const bossDmg = calcBossDmg(petMaxHpRef.current);

    setTick(0);
    setPhase('petAttacking');

    // Pet hits boss after 750 ms of animation.
    setTimeout(() => {
      const newBossHp = Math.max(0, bossHpRef.current - petDmg);
      setBossHp(newBossHp);
      setBossDmgFlash(petDmg);
      setTimeout(() => setBossDmgFlash(null), 1200);

      if (newBossHp <= 0) {
        setPhase('won');
        return;
      }

      // Small pause then boss counterattacks.
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

  const frameIndex = getFrameIndex(phase, tick);
  const frameSrc: Img = (frames[frameIndex] ?? frames[0]) as Img;

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

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
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

          {/* Pet HP */}
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

          {/* Lose result — shop to heal + revive, or give up */}
          {phase === 'lost' && (
            <View style={styles.resultContainer}>
              <Text style={styles.loseTitle}>{t.walkBoss.loseTitle}</Text>
              <Text style={styles.loseMessage}>{t.walkBoss.loseMessage}</Text>
              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => onShopPress({ bossHp: bossHpRef.current, bossMaxHp: bossMaxHpRef.current })}
                activeOpacity={0.8}
              >
                <Text style={styles.shopButtonText}>{t.walkBoss.shopButton}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.giveUpButton} onPress={onGiveUp} activeOpacity={0.8}>
                <Text style={styles.giveUpButtonText}>{t.walkBoss.giveUpButton}</Text>
              </TouchableOpacity>
            </View>
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
});
