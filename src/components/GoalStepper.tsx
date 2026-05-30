import { View, Text, StyleSheet } from 'react-native';
import { useSettingsStore, DAILY_GOAL_STOPS } from '@/stores/settingsStore';
import type { DailyGoal } from '@/stores/settingsStore';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

interface GoalStepperProps {
  dailyGoal: DailyGoal;
  onDecrease: () => void;
  onIncrease: () => void;
}

/**
 * Reusable daily-goal stepper used in ProfileScreen and the Onboarding flow.
 * Controlled component: caller owns the `dailyGoal` value and the change handlers.
 */
export function GoalStepper({ dailyGoal, onDecrease, onIncrease }: GoalStepperProps) {
  const currentGoalIndex = DAILY_GOAL_STOPS.indexOf(dailyGoal as DailyGoal);

  return (
    <View>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>{t.profile.dailyGoalLabel}</Text>
        <Text style={styles.goalValue}>{dailyGoal.toLocaleString()}</Text>
      </View>

      <View style={styles.goalSliderRow}>
        <PrimaryButton
          label="-"
          onPress={onDecrease}
          disabled={currentGoalIndex <= 0}
          accessibilityLabel="Decrease daily goal"
        />
        <View style={styles.goalStops}>
          {DAILY_GOAL_STOPS.map((stop) => (
            <View
              key={stop}
              style={[styles.goalStop, stop === dailyGoal && styles.goalStopActive]}
            />
          ))}
        </View>
        <PrimaryButton
          label="+"
          onPress={onIncrease}
          disabled={currentGoalIndex >= DAILY_GOAL_STOPS.length - 1}
          accessibilityLabel="Increase daily goal"
        />
      </View>

      <Text style={styles.goalRange}>
        {DAILY_GOAL_STOPS[0]?.toLocaleString()} –{' '}
        {DAILY_GOAL_STOPS[DAILY_GOAL_STOPS.length - 1]?.toLocaleString()} steps
      </Text>
    </View>
  );
}

// Provide a self-contained hook-based variant for screens that want to wire
// directly to the settings store without managing state externally.
export function useGoalStepperHandlers() {
  const dailyGoal = useSettingsStore((s) => s.dailyGoal);
  const setDailyGoal = useSettingsStore((s) => s.setDailyGoal);
  const currentGoalIndex = DAILY_GOAL_STOPS.indexOf(dailyGoal as DailyGoal);

  function decreaseGoal() {
    const prev = DAILY_GOAL_STOPS[currentGoalIndex - 1];
    if (prev !== undefined) void setDailyGoal(prev);
  }

  function increaseGoal() {
    const next = DAILY_GOAL_STOPS[currentGoalIndex + 1];
    if (next !== undefined) void setDailyGoal(next);
  }

  return { dailyGoal, decreaseGoal, increaseGoal };
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  goalValue: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  goalSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  goalStops: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  goalStop: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  goalStopActive: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.4 }],
  },
  goalRange: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
