import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { usePetStore } from '@/stores/petStore';
import { useStepStore } from '@/stores/stepStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProgressStore } from '@/stores/progressStore';
import { useStepCounter } from '@/hooks/useStepCounter';
import { PetAvatar } from '@/components/PetAvatar';
import { StepRing } from '@/components/StepRing';
import { DailyCheckinModal } from './components/DailyCheckinModal';
import { getLastCheckinDate, setLastCheckinDate } from '@/db/repositories/progress';
import { computeStreak } from '@/game/streaks';
import { isStreakMilestone, calcStreakBonus, checkinTokenAmount } from '@/game/tokens';
import { hapticReward, hapticSuccess } from '@/services/haptics';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

type HomeNav = NativeStackNavigationProp<RootStackParamList>;

// Returns 'YYYY-MM-DD' in UTC for today.
function todayUtcString(): string {
  const d = new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const activePet = usePetStore((s) => s.activePet);
  const today = useStepStore((s) => s.today);
  const { isAvailable } = useStepCounter();
  const dailyGoal = useSettingsStore((s) => s.dailyGoal);
  const streakCurrent = useProgressStore((s) => s.streakCurrent);
  const setStreakCurrent = useProgressStore((s) => s.setStreakCurrent);
  const addTokens = useProgressStore((s) => s.addTokens);

  const steps = today?.stepCount ?? 0;
  const goal = today?.goal ?? dailyGoal;
  const goalReached = steps >= goal;
  const stepsToGo = Math.max(goal - steps, 0);

  const moodLabel = activePet ? t.mood[activePet.mood] : t.mood.normal;

  const [checkinVisible, setCheckinVisible] = useState(false);
  const [pendingStreak, setPendingStreak] = useState(0);
  const [pendingTokens, setPendingTokens] = useState(0);

  // Check on mount whether today's check-in has already been claimed.
  useEffect(() => {
    async function checkCheckin() {
      try {
        const lastDate = await getLastCheckinDate();
        const todayStr = todayUtcString();
        if (lastDate !== todayStr) {
          // Not yet checked in today — compute what will be shown.
          const newStreak = computeStreak(lastDate, streakCurrent);
          const isMilestone = isStreakMilestone(newStreak);
          const tokens = isMilestone ? calcStreakBonus() : checkinTokenAmount();
          setPendingStreak(newStreak);
          setPendingTokens(tokens);
          setCheckinVisible(true);
        }
      } catch {
        // If the DB isn't ready yet, skip silently.
      }
    }
    checkCheckin();
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
    } catch {
      // Non-fatal.
    }
  }, [pendingStreak, pendingTokens, setStreakCurrent, addTokens]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={styles.heading}>PawStep</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Shop')}
            accessibilityRole="button"
            accessibilityLabel="Open Shop"
          >
            <Text style={styles.shopButtonText}>🛍</Text>
          </TouchableOpacity>
        </View>

        {activePet ? (
          <View style={styles.petSection}>
            <PetAvatar
              species={activePet.species}
              name={activePet.name}
              mood={activePet.mood}
              size={120}
            />
            <View style={styles.moodRow}>
              <Text style={styles.moodLabel}>{t.home.moodLabel}: </Text>
              <Text style={styles.moodValue}>{moodLabel}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.petSection}>
            <View style={styles.petPlaceholder}>
              <Text style={styles.petPlaceholderText}>🐾</Text>
            </View>
          </View>
        )}

        <View style={styles.ringSection}>
          <StepRing steps={steps} goal={goal} size={220} strokeWidth={16} />
        </View>

        <View style={styles.countdownCard}>
          {goalReached ? (
            <Text style={styles.goalReached}>{t.home.goalReached}</Text>
          ) : (
            <Text style={styles.stepsToGo}>{t.home.stepsToGo(stepsToGo)}</Text>
          )}
        </View>

        {!isAvailable && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{t.home.petSensor}</Text>
          </View>
        )}
      </ScrollView>

      <DailyCheckinModal
        visible={checkinVisible}
        streakDay={pendingStreak}
        tokensEarned={pendingTokens}
        onClaim={handleClaim}
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
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.heading1,
    color: colors.primary,
  },
  shopButton: {
    padding: spacing.sm,
  },
  shopButtonText: {
    fontSize: 24,
  },
  petSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  petPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petPlaceholderText: {
    fontSize: 48,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  moodLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  moodValue: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  ringSection: {
    marginVertical: spacing.lg,
  },
  countdownCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  stepsToGo: {
    ...typography.heading3,
    color: colors.textPrimary,
  },
  goalReached: {
    ...typography.heading3,
    color: colors.success,
  },
  warningBanner: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
