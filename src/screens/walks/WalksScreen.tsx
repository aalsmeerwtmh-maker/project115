import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline } from 'react-native-maps';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useWalkSession, formatElapsed } from '@/hooks/useWalkSession';
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
import type { BossFightSnapshot } from './components/BossChallengeModal';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';
import { GAME_CONFIG } from '@/game/config';

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
  const addTokens       = useProgressStore((s) => s.addTokens);

  const [pastWalks, setPastWalks] = useState<Event[]>([]);
  const [isStopping, setIsStopping] = useState(false);
  const [pastWalksError, setPastWalksError] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTokens, setToastTokens] = useState(0);
  const [walkEventDialogue, setWalkEventDialogue] = useState<string | null>(null);
  const [bossVisible, setBossVisible]       = useState(false);
  const [fightCount, setFightCount]         = useState(0);
  // Continuation state — preserved when the user goes to Shop mid-fight.
  const [continueBossHp, setContinueBossHp]       = useState<number | undefined>(undefined);
  const [continueBossMaxHp, setContinueBossMaxHp] = useState<number | undefined>(undefined);
  const [continuePetHp, setContinuePetHp]         = useState<number | undefined>(undefined);
  const sessionIdRef       = useRef<string>('');
  const bossStepTierRef    = useRef(0);
  const bossTimeTierRef    = useRef(0);
  // Saved when navigating to Shop so we know how much HP the food restored.
  const bossResumeRef       = useRef<BossFightSnapshot | null>(null);
  const staminaBeforeShopRef = useRef(activePet?.stamina ?? 20);

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
    }
  }, [isActive, loadPastWalks]);

  // Load persisted fight count once on mount
  useEffect(() => {
    void getProgress<number>('boss_fight_count').then(n => setFightCount(n ?? 0));
  }, []);

  // When returning from the Shop screen, resume the fight with healed pet HP.
  useFocusEffect(useCallback(() => {
    const resume = bossResumeRef.current;
    if (resume === null) return;
    bossResumeRef.current = null;  // consume once
    const oldStamina = staminaBeforeShopRef.current;
    const newStamina = activePet?.stamina ?? 20;
    // HP restored = increase in max-HP (food raises stamina → raises max HP).
    const healedHp = Math.max(0, (newStamina - oldStamina) * 100);
    setContinueBossHp(resume.bossHp);
    setContinueBossMaxHp(resume.bossMaxHp);
    setContinuePetHp(Math.max(1, healedHp));
    setBossVisible(true);
  }, [activePet?.stamina]));

  // Auto-trigger boss every 200 steps or 5 minutes during an active walk
  useEffect(() => {
    if (!isActive || bossVisible) return;
    const cfg = GAME_CONFIG.walkBossFight;
    const stepTier = Math.floor(currentSteps / cfg.stepTrigger);
    const timeTier = Math.floor(elapsedSeconds / cfg.timeTriggerSecs);
    if (stepTier > 0 && stepTier > bossStepTierRef.current) {
      bossStepTierRef.current = stepTier;
      bossTimeTierRef.current = timeTier;
      handleShowBossChallenge();
    } else if (timeTier > 0 && timeTier > bossTimeTierRef.current) {
      bossTimeTierRef.current = timeTier;
      bossStepTierRef.current = stepTier;
      handleShowBossChallenge();
    }
  }, [currentSteps, elapsedSeconds, isActive, bossVisible]);

  async function handleStartStop() {
    if (isActive) {
      setIsStopping(true);
      await session.stop(liveSteps);
      setIsStopping(false);
    } else {
      sessionIdRef.current = String(Date.now());
      await session.start(liveSteps);
    }
  }

  async function handleBossWin(tokensEarned: number) {
    // Clear any leftover continuation state from a previous Shop visit.
    setContinueBossHp(undefined);
    setContinueBossMaxHp(undefined);
    setContinuePetHp(undefined);
    const next = fightCount + 1;
    setFightCount(next);
    await setProgress('boss_fight_count', next);
    await addTokens(tokensEarned);
    setBossVisible(false);
  }

  async function handleBossGiveUp() {
    // Clear continuation state — fight is abandoned, starts fresh next time.
    setContinueBossHp(undefined);
    setContinueBossMaxHp(undefined);
    setContinuePetHp(undefined);
    const next = fightCount + 1;
    setFightCount(next);
    await setProgress('boss_fight_count', next);
    setBossVisible(false);
  }

  function handleShowBossChallenge() {
    // Drain stamina each time a new boss encounter starts (floored at 20).
    const pet = activePet;
    if (pet) {
      const newStamina = Math.max(20, pet.stamina - GAME_CONFIG.walkBossFight.bossStaminaCost);
      if (newStamina !== pet.stamina) {
        void updateActivePet({ stamina: newStamina });
      }
    }
    setBossVisible(true);
  }

  function handleBossShop(snapshot: BossFightSnapshot) {
    // Save the current boss HP so the fight can resume after the user returns.
    bossResumeRef.current = snapshot;
    staminaBeforeShopRef.current = activePet?.stamina ?? 20;
    setBossVisible(false);
    navigation.navigate('Shop');
  }

  function handleEnterAR() {
    navigation.navigate('ARWalk', { sessionId: sessionIdRef.current });
  }

  function handleExplorationMap() {
    navigation.navigate('ExplorationMap');
  }

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
                onPress={handleShowBossChallenge}
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
        onDismiss={() => setWalkEventDialogue(null)}
      />

      {/* Boss challenge modal — triggered by steps/time or manually */}
      <BossChallengeModal
        visible={bossVisible}
        species={activePet?.species ?? 'dog'}
        petName={activePet?.name ?? ''}
        stamina={activePet?.stamina ?? 20}
        affection={activePet?.affection ?? 0}
        fightCount={fightCount}
        continueBossHp={continueBossHp}
        continueBossMaxHp={continueBossMaxHp}
        continuePetHp={continuePetHp}
        onWin={(tokens) => { void handleBossWin(tokens); }}
        onGiveUp={() => { void handleBossGiveUp(); }}
        onShopPress={handleBossShop}
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
