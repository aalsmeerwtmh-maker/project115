import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getStepDaysFrom } from '@/db/repositories/steps';
import type { StepDay } from '@/db/schema';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

type GoalsNav = NativeStackNavigationProp<RootStackParamList>;

// Returns 'YYYY-MM-DD' for a date that is `offsetDays` before today (0 = today).
function dateOffset(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

// Short weekday labels Mon–Sun
const WEEKDAY_SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function weekdayShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return WEEKDAY_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1] ?? '';
}

// Next goal thresholds milestone display
const GOAL_MILESTONES = [5000, 8000, 10000, 15000, 20000];

function nextMilestone(dailyGoal: number): number {
  return GOAL_MILESTONES.find((m) => m > dailyGoal) ?? dailyGoal;
}

export function GoalsScreen() {
  const navigation = useNavigation<GoalsNav>();
  const streakCurrent = useProgressStore((s) => s.streakCurrent);
  const dailyGoal = useSettingsStore((s) => s.dailyGoal);
  const [weekDays, setWeekDays] = useState<StepDay[]>([]);

  useEffect(() => {
    const fromDate = dateOffset(6);
    getStepDaysFrom(fromDate)
      .then(setWeekDays)
      .catch(() => setWeekDays([]));
  }, []);

  const last7Dates = Array.from({ length: 7 }, (_, i) => dateOffset(6 - i));

  const dayMap = new Map(weekDays.map((d) => [d.date, d]));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{t.goals.title}</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.goals.streakSectionTitle}</Text>

          <View style={styles.calendarRow}>
            {last7Dates.map((date) => {
              const row = dayMap.get(date);
              const reached = row != null && row.goalReachedAt != null;
              const isToday = date === dateOffset(0);
              return (
                <View key={date} style={styles.dayCell}>
                  <Text style={styles.dayLabel}>{weekdayShort(date)}</Text>
                  <View
                    style={[
                      styles.dayDot,
                      reached && styles.dayDotFilled,
                      isToday && !reached && styles.dayDotToday,
                    ]}
                  >
                    {reached && <Text style={styles.dayDotCheck}>✓</Text>}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.streakRow}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{t.goals.currentStreak(streakCurrent)}</Text>
          </View>

          <View style={styles.bossButtonWrapper}>
            <PrimaryButton label={t.boss.title} onPress={() => navigation.navigate('Boss')} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Next goal</Text>
          <Text style={styles.nextGoalText}>{t.goals.nextGoal(nextMilestone(dailyGoal))}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.goals.badgesTitle}</Text>
          <View style={styles.badgeRail}>
            {['7-Day Streak', '30-Day Streak', '100K Steps', 'First Walk'].map((badge) => (
              <View key={badge} style={styles.badgePlaceholder}>
                <Text style={styles.badgeEmoji}>🏅</Text>
                <Text style={styles.badgeLabel}>{badge}</Text>
                <Text style={styles.badgeComingSoon}>{t.goals.badgePlaceholder}</Text>
              </View>
            ))}
          </View>
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
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dayCell: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  dayDotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayDotToday: {
    borderColor: colors.primaryDark,
    borderWidth: 2,
  },
  dayDotCheck: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bossButtonWrapper: {
    marginTop: spacing.md,
  },
  streakEmoji: {
    fontSize: 22,
    marginRight: spacing.xs,
  },
  streakText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  nextGoalText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  badgeRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgePlaceholder: {
    width: '46%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
    opacity: 0.4,
  },
  badgeLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  badgeComingSoon: {
    ...typography.caption,
    color: colors.textDisabled,
    marginTop: 2,
  },
});
