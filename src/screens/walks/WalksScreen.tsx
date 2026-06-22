import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useWalkSession, formatElapsed } from '@/hooks/useWalkSession';
import type { WalkSessionStats } from '@/hooks/useWalkSession';
import { useStepStore } from '@/stores/stepStore';
import { usePetStore } from '@/stores/petStore';
import { useProgressStore } from '@/stores/progressStore';
import { getRecentWalkSessions } from '@/db/repositories/events';
import { getProgress, setProgress } from '@/db/repositories/progress';
import type { Event } from '@/db/schema';
import type { WalkPayload } from '@/db/repositories/events';
import { PrimaryButton } from '@/components/PrimaryButton';
import { DiscoveryToast } from '@/components/DiscoveryToast';
import { WalkEventModal } from './components/WalkEventModal';
import { BossChallengeModal } from './components/BossChallengeModal';
import { StageUpModal } from './components/StageUpModal';
import { BadgeCelebrationModal } from '@/components/BadgeCelebrationModal';
import type { BadgeDef } from '@/game/config';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';
import { GAME_CONFIG } from '@/game/config';
import { timeToGrowth, growthToStage } from '@/game/growthFormula';
import { markBadgeAchieved } from '@/db/repositories/badges';
import { getTotalStepCount } from '@/db/repositories/steps';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

function PastWalkItem({ event }: { event: Event }) {
  let payload: WalkPayload | null = null;
  try {
    payload = JSON.parse(event.payload) as WalkPayload;
  } catch {
    payload = null;
  }

  const distKm = payload ? payload.distanceM / 1000 : 0;
  const steps = payload?.stepCount ?? 0;

  return (
    <View style={styles.pastWalkRow}>
      <Text style={styles.pastWalkDate}>{t.walks.walkDate(event.triggeredAt)}</Text>
      <Text style={styles.pastWalkSummary}>{t.walks.walkSummary(distKm, steps)}</Text>
    </View>
  );
}

export function WalksScreen() {
  const navigation = useNavigation<RootNav>();
  const today = useStepStore((s) => s.today);
  const liveSteps = today?.stepCount ?? 0;
  const activePet       = usePetStore((s) => s.activePet);
  const updateActivePet = usePetStore((s) => s.updateActivePet);
  const addTokens             = useProgressStore((s) => s.addTokens);
  const manualBossCountToday  = useProgressStore((s) => s.manualBossCountToday);
  const manualBossLastAt      = useProgressStore((s) => s.manualBossLastAt);
  const recordManualBossFight = useProgressStore((s) => s.recordManualBossFight);

  const [pastWalks, setPastWalks] = useState<Event[]>([]);
  const [isStopping, setIsStopping] = useState(false);
  const [pastWalksError, setPastWalksError] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTokens, setToastTokens] = useState(0);
  const [walkEventDialogue, setWalkEventDialogue] = useState<string | null>(null);
  const [bossVisible, setBossVisible] = useState(false);
  const [systemBossTriggered, setSystemBossTriggered] = useState(false);
  const [fightCount, setFightCount]   = useState(0);
  const [stageUpStage, setStageUpStage] = useState<'child' | 'adult' | 'elder' | null>(null);
  const [earnedBadge, setEarnedBadge] = useState<{ def: BadgeDef; achievedAt: number } | null>(null);
  const sessionIdRef      = useRef<string>('');
  const bossStepTierRef   = useRef(0);
  const bossTimeTierRef   = useRef(0);
  // Queued boss trigger: set to true when a walk event is showing and a boss would have fired.
  const pendingBossRef    = useRef(false);
  // Ref mirror of walkEventDialogue so the boss-trigger effect avoids stale closures.
  const walkEventRef      = useRef<string | null>(null);
  walkEventRef.current    = walkEventDialogue;

  const handleNewCell = useCallback((tokensAwarded: number) => {
    setToastTokens(tokensAwarded);
    setToastVisible(true);
  }, []);

  const handleWalkEvent = useCallback((dialogue: string) => {
    setWalkEventDialogue(dialogue);
  }, []);

  const session = useWalkSession({ onNewCell: handleNewCell, onWalkEvent: handleWalkEvent });

  const { isActive, elapsedSeconds, distanceM, currentSteps, polyline, locationPermissionStatus } =
    session;

  const mapPolyline = polyline.map((c) => ({ latitude: c.lat, longitude: c.lng }));
  const distKm = distanceM / 1000;

  useEffect(() => {
    session.notifySteps(liveSteps);
  }, [liveSteps, session]);

  const loadPastWalks = useCallback(async () => {
    try {
      const walks = await getRecentWalkSessions(5);
      setPastWalks(walks);
      setPastWalksError(false);
    } catch {
      setPastWalksError(true);
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadPastWalks();
      bossStepTierRef.current = 0;
      bossTimeTierRef.current = 0;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSystemBossTriggered(false);
    }
  }, [isActive, loadPastWalks]);

  // Load persisted fight count once on mount
  useEffect(() => {
    void getProgress<number>('boss_fight_count').then(n => setFightCount(n ?? 0));
  }, []);

  // Auto-trigger boss every 200 steps or 5 minutes during an active walk.
  // The "Something Happened" walk-event window always appears first; boss fires after "Got it".
  useEffect(() => {
    if (!isActive) return;
    const cfg = GAME_CONFIG.walkBossFight;
    const stepTier = Math.floor(currentSteps / cfg.stepTrigger);
    const timeTier = Math.floor(elapsedSeconds / cfg.timeTriggerSecs);

    // While a boss fight is in progress, silently advance the tier refs so that finishing
    // the fight never immediately re-triggers the boss due to accumulated time/steps.
    if (bossVisible) {
      bossStepTierRef.current = Math.max(bossStepTierRef.current, stepTier);
      bossTimeTierRef.current = Math.max(bossTimeTierRef.current, timeTier);
      return;
    }

    let shouldTrigger = false;
    const isFirstTrigger = bossStepTierRef.current === 0 && bossTimeTierRef.current === 0;
    if (isFirstTrigger) {
      const bySteps = stepTier > 0;
      const byTime = timeTier > 0 && currentSteps >= cfg.firstTriggerTimeMinSteps;
      if (bySteps || byTime) {
        bossStepTierRef.current = stepTier;
        bossTimeTierRef.current = timeTier;
        shouldTrigger = true;
      }
    } else if (stepTier > 0 && stepTier > bossStepTierRef.current) {
      bossStepTierRef.current = stepTier;
      bossTimeTierRef.current = timeTier;
      shouldTrigger = true;
    } else if (timeTier > 0 && timeTier > bossTimeTierRef.current) {
      bossTimeTierRef.current = timeTier;
      bossStepTierRef.current = stepTier;
      shouldTrigger = true;
    }
    if (!shouldTrigger) return;

    // Always show the "Something Happened" walk-event window before the boss.
    // Queue the boss; it fires in handleWalkEventDismiss after the player taps "Got it".
    setSystemBossTriggered(true);
    pendingBossRef.current = true;
    if (walkEventRef.current === null) {
      const dialogues = GAME_CONFIG.walkEvents.dialogues;
      const dialogue = dialogues[Math.floor(Math.random() * dialogues.length)] ?? dialogues[0] ?? '';
      setWalkEventDialogue(dialogue);
    }
  }, [currentSteps, elapsedSeconds, isActive, bossVisible]);

  async function applyWalkGrowth(stats: WalkSessionStats) {
    const pet = activePet;
    if (!pet) return;
    const gain = timeToGrowth(stats.durationSeconds);
    if (gain === 0) return;
    const oldGrowth = pet.growthValue ?? 0;
    const newGrowth = oldGrowth + gain;
    const oldStage = growthToStage(oldGrowth);
    const newStage = growthToStage(newGrowth);
    await updateActivePet({ growthValue: newGrowth, stage: newStage });
    if (newStage !== oldStage && newStage !== 'baby') {
      setStageUpStage(newStage);
    }
  }

  async function checkWalkBadges() {
    const now = Date.now();
    const badgeDefs = GAME_CONFIG.badges;

    const firstWalkNew = await markBadgeAchieved('first_walk', now);
    if (firstWalkNew) {
      const def = badgeDefs.find((b) => b.id === 'first_walk');
      if (def) {
        await addTokens(def.tokenReward);
        setEarnedBadge({ def, achievedAt: now });
        return;
      }
    }

    const totalSteps = await getTotalStepCount();
    if (totalSteps >= 100_000) {
      const stepsNew = await markBadgeAchieved('steps_100k', now);
      if (stepsNew) {
        const def = badgeDefs.find((b) => b.id === 'steps_100k');
        if (def) {
          await addTokens(def.tokenReward);
          setEarnedBadge({ def, achievedAt: now });
        }
      }
    }
  }

  async function handleStartStop() {
    if (isActive) {
      setIsStopping(true);
      const stats = await session.stop(liveSteps);
      setIsStopping(false);
      await applyWalkGrowth(stats);
      await checkWalkBadges();
    } else {
      sessionIdRef.current = String(Date.now());
      await session.start(liveSteps);
    }
  }

  async function handleBossWin(tokensEarned: number) {
    const next = fightCount + 1;
    setFightCount(next);
    await setProgress('boss_fight_count', next);
    await addTokens(tokensEarned);
    setBossVisible(false);
  }

  async function handleBossGiveUp() {
    const next = fightCount + 1;
    setFightCount(next);
    await setProgress('boss_fight_count', next);
    setBossVisible(false);
  }

  function handleShowBossChallenge(manual = false) {
    const pet = activePet;
    if (pet) {
      const newStamina = Math.max(20, pet.stamina - GAME_CONFIG.walkBossFight.bossStaminaCost);
      if (newStamina !== pet.stamina) {
        void updateActivePet({ stamina: newStamina });
      }
    }
    if (manual) void recordManualBossFight();
    setBossVisible(true);
  }

  function handleWalkEventDismiss() {
    setWalkEventDialogue(null);
    if (pendingBossRef.current) {
      pendingBossRef.current = false;
      handleShowBossChallenge();
    }
  }

  function handleEnterAR() {
    navigation.navigate('ARWalk', { sessionId: sessionIdRef.current });
  }

  function handleExplorationMap() {
    navigation.navigate('ExplorationMap');
  }

  const { manualDailyLimit, manualCooldownMs } = GAME_CONFIG.walkBossFight;
  const canManuallyChallenge =
    manualBossCountToday < manualDailyLimit &&
    (manualBossLastAt === 0 || Date.now() - manualBossLastAt >= manualCooldownMs);

  const mapRegion =
    polyline.length > 0
      ? {
          latitude: polyline[polyline.length - 1]!.lat,
          longitude: polyline[polyline.length - 1]!.lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }
      : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Discovery toast sits above the scroll content */}
      <DiscoveryToast
        visible={toastVisible}
        tokensAwarded={toastTokens}
        onDismiss={() => setToastVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.heading}>{t.walks.title}</Text>
          <TouchableOpacity
            onPress={handleExplorationMap}
            style={styles.mapIconButton}
            accessibilityRole="button"
            accessibilityLabel={t.walks.explorationMapTitle}
          >
            <Text style={styles.mapIconText}>🗺</Text>
          </TouchableOpacity>
        </View>

        <MapView style={styles.map} region={mapRegion} showsUserLocation={isActive}>
          {mapPolyline.length > 1 && (
            <Polyline coordinates={mapPolyline} strokeColor={colors.primary} strokeWidth={4} />
          )}
        </MapView>

        {isActive && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t.walks.steps}</Text>
              <Text style={styles.statValue}>{currentSteps.toLocaleString()}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t.walks.elapsed}</Text>
              <Text style={styles.statValue}>{formatElapsed(elapsedSeconds)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t.walks.distance(0).split(' ')[1]}</Text>
              <Text style={styles.statValue}>{distKm.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {locationPermissionStatus === 'denied' && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{t.walks.locationDenied}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <PrimaryButton
            label={isActive ? t.walks.stopWalk : t.walks.startWalk}
            onPress={() => void handleStartStop()}
            loading={isStopping}
          />
          {isActive && (
            <View style={styles.arButtonWrapper}>
              <PrimaryButton label={t.walks.enterAR} onPress={handleEnterAR} />
            </View>
          )}
          {isActive && (
            <View style={styles.arButtonWrapper}>
              <PrimaryButton
                label={t.walkBoss.challengeBossButton}
                onPress={() => handleShowBossChallenge(true)}
                disabled={!systemBossTriggered || !canManuallyChallenge}
              />
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t.walks.pastWalksTitle}</Text>

        {pastWalksError ? (
          <ErrorState heading="Couldn't load past walks." onRetry={loadPastWalks} />
        ) : pastWalks.length === 0 ? (
          <EmptyState heading={t.walks.noPastWalks} />
        ) : (
          <FlatList
            data={pastWalks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PastWalkItem event={item} />}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </ScrollView>

      {/* Walk event modal — appears during a walk when a random event fires */}
      <WalkEventModal
        visible={walkEventDialogue !== null}
        dialogue={walkEventDialogue ?? ''}
        onDismiss={handleWalkEventDismiss}
      />

      {/* Boss challenge modal — triggered by steps/time or manually */}
      <BossChallengeModal
        visible={bossVisible}
        species={activePet?.species ?? 'dog'}
        petName={activePet?.name ?? ''}
        stamina={activePet?.stamina ?? 20}
        affection={activePet?.affection ?? 0}
        fightCount={fightCount}
        onWin={(tokens) => { void handleBossWin(tokens); }}
        onGiveUp={() => { void handleBossGiveUp(); }}
      />

      {/* Pet stage-up celebration — shown when pet evolves after a walk */}
      <StageUpModal
        visible={stageUpStage !== null}
        newStage={stageUpStage ?? 'child'}
        petName={activePet?.name ?? ''}
        onDismiss={() => setStageUpStage(null)}
      />

      {/* Badge earned celebration */}
      <BadgeCelebrationModal
        visible={earnedBadge !== null}
        badgeId={earnedBadge?.def.id ?? null}
        achievedAt={earnedBadge?.achievedAt ?? 0}
        onDismiss={() => setEarnedBadge(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.heading1,
    color: colors.primary,
  },
  mapIconButton: {
    padding: spacing.sm,
  },
  mapIconText: {
    fontSize: 24,
  },
  map: {
    width: '100%',
    height: 260,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  mapFallback: {
    width: '100%',
    height: 260,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  mapFallbackTitle: {
    ...typography.heading3,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  mapFallbackBody: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  mapFallbackCode: {
    fontFamily: 'monospace',
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.heading3,
    color: colors.textPrimary,
  },
  buttonRow: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  arButtonWrapper: {
    marginTop: spacing.sm,
  },
  warningBanner: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  pastWalkRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pastWalkDate: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  pastWalkSummary: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  separator: {
    height: spacing.sm,
  },
});
