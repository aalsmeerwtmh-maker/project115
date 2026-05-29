import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePetStore } from '@/stores/petStore';
import { useSettingsStore, DAILY_GOAL_STOPS } from '@/stores/settingsStore';
import type { DailyGoal } from '@/stores/settingsStore';
import { PetAvatar } from '@/components/PetAvatar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { en } from '@/i18n/en';

export function ProfileScreen() {
  const activePet = usePetStore((s) => s.activePet);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const dailyGoal = useSettingsStore((s) => s.dailyGoal);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const setDailyGoal = useSettingsStore((s) => s.setDailyGoal);

  const currentGoalIndex = DAILY_GOAL_STOPS.indexOf(dailyGoal as DailyGoal);

  function decreaseGoal() {
    const prev = DAILY_GOAL_STOPS[currentGoalIndex - 1];
    if (prev !== undefined) setDailyGoal(prev);
  }

  function increaseGoal() {
    const next = DAILY_GOAL_STOPS[currentGoalIndex + 1];
    if (next !== undefined) setDailyGoal(next);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{en.profile.title}</Text>

        {/* Pet roster */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{en.profile.petsSection}</Text>
          {activePet ? (
            <View style={styles.petRow}>
              <PetAvatar species={activePet.species} name={activePet.name} size={72} />
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{activePet.name}</Text>
                <Text style={styles.petMeta}>
                  {activePet.species.charAt(0).toUpperCase() + activePet.species.slice(1)}
                  {'  ·  '}
                  {en.profile.petStage(activePet.stage)}
                </Text>
                <Text style={styles.petGrowth}>
                  Growth: {activePet.growthValue.toFixed(1)} / 100
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>No pet yet.</Text>
          )}
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{en.profile.settingsSection}</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{en.profile.notificationsLabel}</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={(v) => setNotificationsEnabled(v)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{en.profile.dailyGoalLabel}</Text>
            <Text style={styles.goalValue}>{dailyGoal.toLocaleString()}</Text>
          </View>

          <View style={styles.goalSliderRow}>
            <PrimaryButton label="-" onPress={decreaseGoal} disabled={currentGoalIndex <= 0} />
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
              onPress={increaseGoal}
              disabled={currentGoalIndex >= DAILY_GOAL_STOPS.length - 1}
            />
          </View>

          <Text style={styles.goalRange}>
            {DAILY_GOAL_STOPS[0]?.toLocaleString()} –{' '}
            {DAILY_GOAL_STOPS[DAILY_GOAL_STOPS.length - 1]?.toLocaleString()} steps
          </Text>
        </View>

        {/* About */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{en.profile.aboutSection}</Text>
          <Text style={styles.aboutName}>{en.profile.appName}</Text>
          <Text style={styles.aboutVersion}>Version {en.profile.appVersion}</Text>
        </View>
      </ScrollView>
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
  heading: {
    ...typography.heading1,
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  petMeta: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: 2,
  },
  petGrowth: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    ...typography.body,
    color: colors.textDisabled,
  },
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
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
  aboutName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  aboutVersion: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
