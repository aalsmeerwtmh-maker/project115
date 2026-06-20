import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, Image, ImageBackground, StyleSheet, ScrollView, TouchableOpacity, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { usePetStore } from '@/stores/petStore';
import { useStepStore } from '@/stores/stepStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProgressStore, useFeedActive } from '@/stores/progressStore';
import { useStepCounter } from '@/hooks/useStepCounter';
import { PET_IMAGES, resolvePetStandImage } from '@/components/PetAvatar';
import { useEquipmentStore } from '@/stores/equipmentStore';
import { PetStateDisplay } from '@/components/PetStateDisplay';
import { DailyCheckinModal } from './components/DailyCheckinModal';
import { RenameModal } from './components/RenameModal';
import { getLastCheckinDate, setLastCheckinDate, getProgress, setProgress } from '@/db/repositories/progress';
import { computeStreak } from '@/game/streaks';
import { isStreakMilestone, calcStreakBonus, checkinTokenAmount } from '@/game/tokens';
import { resolveDisplayMood, type DisplayMood } from '@/game/petMood';
import { hapticReward, hapticSuccess } from '@/services/haptics';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';
import { GAME_CONFIG } from '@/game/config';
import type { BadgeDef } from '@/game/config';
import { markBadgeAchieved } from '@/db/repositories/badges';
import { BadgeCelebrationModal } from '@/components/BadgeCelebrationModal';

type HomeNav = NativeStackNavigationProp<RootStackParamList>;

function todayUtcString(): string {
  const d = new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const PET_SPECIES = ['dog', 'cat', 'bird'] as const;
type PetSpecies = typeof PET_SPECIES[number];

const SPECIES_LABEL: Record<PetSpecies, string> = { dog: 'Dog', cat: 'Cat', bird: 'Bird' };

const BG_IMAGES: Record<string, ImageSourcePropType> = {
  bg_park:        require('../../../assets/backgrounds/bg_park.png'),
  bg_winter_park: require('../../../assets/backgrounds/bg_winter_park.png'),
};

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const activePet = usePetStore((s) => s.activePet);
  const updateActivePet = usePetStore((s) => s.updateActivePet);
  const tokens = useProgressStore((s) => s.tokens);
  const spendTokens = useProgressStore((s) => s.spendTokens);
  const today = useStepStore((s) => s.today);
  const { isAvailable } = useStepCounter();
  const dailyGoal = useSettingsStore((s) => s.dailyGoal);
  const streakCurrent = useProgressStore((s) => s.streakCurrent);
  const setStreakCurrent = useProgressStore((s) => s.setStreakCurrent);
  const addTokens = useProgressStore((s) => s.addTokens);
  const feedActive = useFeedActive();
  const equipped = useEquipmentStore((s) => s.equipped);

  const hasHat  = equipped.includes('hat_cozy');
  const hasSuit = equipped.includes('suit_formal');
  const equippedBg = equipped.includes('bg_winter_park')
    ? 'bg_winter_park'
    : equipped.includes('bg_park')
    ? 'bg_park'
    : null;

  const clothedPetImage = activePet
    ? resolvePetStandImage(activePet.species, hasHat, hasSuit)
    : null;

  const steps = today?.stepCount ?? 0;
  const goal = dailyGoal;
  const goalReached = steps >= goal;
  const stepsToGo = Math.max(goal - steps, 0);
  const progress = Math.min(steps / goal, 1);

  const hour = useMemo(() => new Date().getHours(), []);
  const displayMood = useMemo<DisplayMood>(() => {
    if (!activePet) return 'normal';
    if (feedActive) return 'eating';
    return resolveDisplayMood(activePet.mood, hour);
  }, [activePet, hour, feedActive]);
  const moodLabel = t.mood[displayMood];

  const handleSwitchSpecies = useCallback(async (species: PetSpecies) => {
    if (!activePet || activePet.species === species) return;
    try { await updateActivePet({ species }); } catch { /* non-fatal */ }
  }, [activePet, updateActivePet]);

  const handleRename = useCallback(async (newName: string) => {
    setRenameVisible(false);
    try {
      if (!isFreeRename) {
        await spendTokens(GAME_CONFIG.petRenameCost);
      }
      await updateActivePet({ name: newName });
      const next = renameCount + 1;
      setRenameCount(next);
      await setProgress('pet_rename_count', next);
    } catch {
      // spendTokens throws if balance is too low — modal already guards this, so non-fatal.
    }
  }, [isFreeRename, spendTokens, updateActivePet, renameCount]);

  const [checkinVisible, setCheckinVisible] = useState(false);
  const [pendingStreak, setPendingStreak] = useState(0);
  const [pendingTokens, setPendingTokens] = useState(0);
  const [earnedBadge, setEarnedBadge] = useState<{ def: BadgeDef; achievedAt: number } | null>(null);

  const [renameVisible, setRenameVisible] = useState(false);
  const [renameCount, setRenameCount] = useState(0);
  const isFreeRename = renameCount === 0;

  useEffect(() => {
    async function init() {
      try {
        const [lastDate, savedRenameCount] = await Promise.all([
          getLastCheckinDate(),
          getProgress<number>('pet_rename_count'),
        ]);
        setRenameCount(savedRenameCount ?? 0);

        const todayStr = todayUtcString();
        if (lastDate !== todayStr) {
          const newStreak = computeStreak(lastDate, streakCurrent);
          const isMilestone = isStreakMilestone(newStreak);
          const earned = isMilestone ? calcStreakBonus() : checkinTokenAmount();
          setPendingStreak(newStreak);
          setPendingTokens(earned);
          setCheckinVisible(true);
        }
      } catch {
        // If the DB isn't ready yet, skip silently.
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClaim = useCallback(async () => {
    setCheckinVisible(false);
    try {
      await setStreakCurrent(pendingStreak);
      await addTokens(pendingTokens);
      await setLastCheckinDate(todayUtcString());
      if (isStreakMilestone(pendingStreak)) {
        hapticSuccess();
      } else {
        hapticReward();
      }
      // Check streak badges after the new streak is committed.
      const now = Date.now();
      const badgeDefs = GAME_CONFIG.badges;
      let justEarned: { def: BadgeDef; achievedAt: number } | null = null;
      if (pendingStreak >= 30 && !justEarned) {
        const newlyAchieved = await markBadgeAchieved('streak_30', now);
        if (newlyAchieved) {
          const def = badgeDefs.find((b) => b.id === 'streak_30');
          if (def) { await addTokens(def.tokenReward); justEarned = { def, achievedAt: now }; }
        }
      }
      if (pendingStreak >= 7 && !justEarned) {
        const newlyAchieved = await markBadgeAchieved('streak_7', now);
        if (newlyAchieved) {
          const def = badgeDefs.find((b) => b.id === 'streak_7');
          if (def) { await addTokens(def.tokenReward); justEarned = { def, achievedAt: now }; }
        }
      }
      if (justEarned) setEarnedBadge(justEarned);
    } catch {
      // Non-fatal.
    }
  }, [pendingStreak, pendingTokens, setStreakCurrent, addTokens]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerAvatarWrap}
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="View profile"
          >
            <View style={styles.headerAvatar}>
              {clothedPetImage ? (
                <Image
                  source={clothedPetImage}
                  style={styles.headerAvatarImage}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Text style={styles.headerAvatarEmoji}>🐾</Text>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.logoText}>PawStep</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Shop')}
            accessibilityRole="button"
            accessibilityLabel="Open shop"
          >
            <Text style={styles.headerIconEmoji}>🛍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Text style={styles.headerIconEmoji}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroAvatarContainer}>
            {equippedBg ? (
              <ImageBackground
                source={BG_IMAGES[equippedBg]!}
                style={styles.heroAvatar}
                imageStyle={{ borderRadius: 116 }}
                resizeMode="cover"
              >
                {activePet ? (
                  <PetStateDisplay
                    species={activePet.species}
                    displayMood={displayMood}
                    size={240}
                    showBadge={false}
                  />
                ) : (
                  <View style={styles.heroAvatarEmpty}>
                    <Text style={{ fontSize: 80 }}>🐾</Text>
                  </View>
                )}
              </ImageBackground>
            ) : (
              <View style={styles.heroAvatar}>
                {activePet ? (
                  <PetStateDisplay
                    species={activePet.species}
                    displayMood={displayMood}
                    size={240}
                    showBadge={false}
                  />
                ) : (
                  <View style={styles.heroAvatarEmpty}>
                    <Text style={{ fontSize: 80 }}>🐾</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.bestBuddyBadge}>
              <Text style={styles.bestBuddyText}>Best Buddy!</Text>
            </View>
          </View>

          {/* Name button */}
          {activePet && (
            <TouchableOpacity
              style={styles.nameButton}
              onPress={() => setRenameVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`Pet name: ${activePet.name}. Tap to rename.`}
            >
              <Text style={styles.nameButtonText}>{activePet.name}</Text>
              <Text style={styles.nameButtonIcon}>✏️</Text>
            </TouchableOpacity>
          )}

          {/* Pet picker */}
          <View style={styles.pickerRow}>
            {PET_SPECIES.map((sp) => {
              const active = activePet?.species === sp;
              return (
                <TouchableOpacity
                  key={sp}
                  style={[styles.pickerCard, active && styles.pickerCardActive]}
                  onPress={() => void handleSwitchSpecies(sp)}
                  accessibilityRole="button"
                  accessibilityLabel={`Choose ${SPECIES_LABEL[sp]}`}
                  accessibilityState={{ selected: active }}
                >
                  <Image
                    source={active && clothedPetImage ? clothedPetImage : PET_IMAGES[sp]!}
                    style={styles.pickerImage}
                    resizeMode="contain"
                    accessibilityIgnoresInvertColors
                  />
                  <Text style={[styles.pickerLabel, active && styles.pickerLabelActive]}>
                    {SPECIES_LABEL[sp]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.heroTitle}>Ready to Play?</Text>
          <Text style={styles.heroSubtitle}>
            Time to stretch those paws and hit the trail with your best friend.
          </Text>

          <TouchableOpacity
            style={styles.goButton}
            onPress={() => navigation.navigate('Walks')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Start walk"
          >
            <Text style={styles.goButtonIcon}>🐾</Text>
            <Text style={styles.goButtonText}>Go!</Text>
          </TouchableOpacity>
        </View>

        {/* Bento Grid */}
        <View style={styles.bentoGrid}>
          {/* Steps Widget — taps through to the Walks tab */}
          <TouchableOpacity
            style={styles.widgetCard}
            onPress={() => navigation.navigate('Walks')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="View daily progress and walks"
          >
            <View style={styles.widgetHeader}>
              <View>
                <Text style={styles.widgetLabel}>Daily Progress</Text>
                <Text style={styles.widgetTitleSteps}>Steps</Text>
              </View>
              <View style={[styles.widgetIconBadge, { backgroundColor: colors.tertiaryContainer }]}>
                <Text style={styles.widgetIconEmoji}>🏃</Text>
              </View>
            </View>
            <View style={styles.stepsRow}>
              <Text style={styles.stepsCount}>{steps.toLocaleString()}</Text>
              <Text style={styles.stepsGoal}>/ {goal.toLocaleString()}</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
          </TouchableOpacity>

          {/* Pet Mood Widget */}
          <TouchableOpacity
            style={styles.widgetCard}
            onPress={() => navigation.navigate('StatusCheck')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Open status check"
          >
            <View style={styles.widgetHeader}>
              <View>
                <Text style={styles.widgetLabel}>Status Check</Text>
                <Text style={styles.widgetTitleMood}>Pet Mood</Text>
              </View>
              <View style={[styles.widgetIconBadge, { backgroundColor: colors.secondaryContainer, transform: [{ rotate: '-12deg' }] }]}>
                <Text style={styles.widgetIconEmoji}>❤️</Text>
              </View>
            </View>
            <View style={styles.moodStatusContainer}>
              <View style={styles.moodEmojiCircle}>
                {clothedPetImage ? (
                  <Image
                    source={clothedPetImage}
                    style={{ width: 44, height: 44 }}
                    resizeMode="contain"
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <Text style={styles.moodEmojiText}>🐾</Text>
                )}
              </View>
              <View style={styles.moodTextBlock}>
                <Text style={styles.moodStatusLabel}>{moodLabel}</Text>
                <Text style={styles.moodStatusDescription} numberOfLines={2}>
                  {t.statusCheck.moodMessage[displayMood](activePet?.name ?? 'Your pet')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Today's Goal Widget */}
          <View style={[styles.widgetCard, styles.goalWidgetCard]}>
            <Text style={styles.goalWidgetTitle}>Today's Goal</Text>
            <Text style={styles.goalWidgetBody}>
              {goalReached
                ? `${activePet?.name ?? 'Your pet'} is so proud — daily goal reached!`
                : `${stepsToGo.toLocaleString()} more steps to keep ${activePet?.name ?? 'your pet'} happy and healthy!`}
            </Text>
            <TouchableOpacity
              style={styles.goalWidgetButton}
              onPress={() => navigation.navigate('Goals')}
              accessibilityRole="button"
            >
              <Text style={styles.goalWidgetButtonText}>View Goals</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!isAvailable && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{t.home.petSensor}</Text>
          </View>
        )}
      </ScrollView>

      <RenameModal
        visible={renameVisible}
        currentName={activePet?.name ?? ''}
        isFree={isFreeRename}
        tokenBalance={tokens}
        onConfirm={handleRename}
        onCancel={() => setRenameVisible(false)}
      />

      <DailyCheckinModal
        visible={checkinVisible}
        streakDay={pendingStreak}
        tokensEarned={pendingTokens}
        onClaim={handleClaim}
      />

      <BadgeCelebrationModal
        visible={earnedBadge !== null}
        badgeId={earnedBadge?.def.id ?? null}
        achievedAt={earnedBadge?.achievedAt ?? 0}
        onDismiss={() => setEarnedBadge(null)}
      />
    </SafeAreaView>
  );
}

const STICKER_SHADOW = {
  shadowColor: colors.onBackground,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── TopAppBar ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerAvatarWrap: {
    ...STICKER_SHADOW,
    elevation: 2,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondaryContainer,
    borderWidth: 2,
    borderColor: colors.outlineVariant + '66',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerAvatarImage: {
    width: 32,
    height: 32,
  },
  headerAvatarEmoji: {
    fontSize: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIconButton: {
    padding: spacing.xs,
  },
  headerIconEmoji: {
    fontSize: 26,
  },
  headerDivider: {
    height: 4,
    backgroundColor: colors.surfaceContainer,
  },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: {
    paddingBottom: spacing.xxl,
  },

  // ── Hero Section ───────────────────────────────────────────────────────────
  heroSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  heroAvatarContainer: {
    position: 'relative',
    marginBottom: spacing.xl,
  },
  heroAvatar: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '3deg' }],
    ...STICKER_SHADOW,
    elevation: 8,
  },
  heroAvatarEmpty: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestBuddyBadge: {
    position: 'absolute',
    bottom: -10,
    right: -5,
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-6deg' }],
    ...STICKER_SHADOW,
    elevation: 4,
  },
  bestBuddyText: {
    ...typography.labelSmall,
    color: colors.onSecondaryContainer,
  },
  nameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.lg,
    ...STICKER_SHADOW,
    elevation: 2,
  },
  nameButtonText: {
    ...typography.heading3,
    color: colors.onBackground,
    fontWeight: '800',
  },
  nameButtonIcon: {
    fontSize: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  pickerCard: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    minWidth: 84,
    ...STICKER_SHADOW,
    elevation: 2,
  },
  pickerCardActive: {
    borderColor: colors.primary,
    borderWidth: 3,
    backgroundColor: colors.primaryContainer,
  },
  pickerImage: {
    width: 60,
    height: 60,
  },
  pickerLabel: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  pickerLabelActive: {
    color: colors.onPrimaryContainer,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 56,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: spacing.xl,
  },
  goButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: colors.primaryDim,
    gap: spacing.md,
    ...STICKER_SHADOW,
    elevation: 4,
  },
  goButtonIcon: {
    fontSize: 32,
  },
  goButtonText: {
    ...typography.heading2,
    color: colors.onPrimaryContainer,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Bento Grid ─────────────────────────────────────────────────────────────
  bentoGrid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  widgetCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.outlineVariant + '4D',
    ...STICKER_SHADOW,
    elevation: 2,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  widgetLabel: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  widgetTitleSteps: {
    ...typography.heading2,
    color: colors.primary,
    fontWeight: '900',
  },
  widgetTitleMood: {
    ...typography.heading2,
    color: colors.secondary,
    fontWeight: '900',
  },
  widgetIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
    ...STICKER_SHADOW,
    elevation: 2,
  },
  widgetIconEmoji: {
    fontSize: 28,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  stepsCount: {
    fontSize: 60,
    fontWeight: '900',
    color: colors.onBackground,
    lineHeight: 68,
  },
  stepsGoal: {
    ...typography.bodyBold,
    color: colors.onSurfaceVariant,
  },
  progressBarTrack: {
    width: '100%',
    height: 24,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.surfaceDim,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.tertiary,
    borderRadius: 12,
  },
  moodStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer + '80',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.outlineVariant + '66',
    borderStyle: 'dashed',
    gap: spacing.md,
  },
  moodEmojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmojiText: {
    fontSize: 32,
  },
  moodTextBlock: {
    flex: 1,
  },
  moodStatusLabel: {
    ...typography.heading3,
    color: colors.onBackground,
    fontWeight: '800',
  },
  moodStatusDescription: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  goalWidgetCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryFixed + '4D',
    borderWidth: 4,
  },
  goalWidgetTitle: {
    ...typography.heading3,
    color: colors.onPrimary,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  goalWidgetBody: {
    ...typography.body,
    color: colors.onPrimary + 'CC',
    marginBottom: spacing.lg,
  },
  goalWidgetButton: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  goalWidgetButtonText: {
    ...typography.label,
    color: colors.onPrimaryContainer,
  },

  // ── Warning ────────────────────────────────────────────────────────────────
  warningBanner: {
    margin: spacing.lg,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
  },
  warningText: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});


