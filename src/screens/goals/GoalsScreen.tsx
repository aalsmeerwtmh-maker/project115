import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getStepDaysFrom } from '@/db/repositories/steps';
import { getAllBadges } from '@/db/repositories/badges';
import type { StepDay, Badge } from '@/db/schema';
import { GAME_CONFIG } from '@/game/config';
import type { BadgeDef } from '@/game/config';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

type GoalsNav = NativeStackNavigationProp<RootStackParamList>;

const WEEKDAY_SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// One cute animal per weekday (Monday → Sunday)
const DAY_ANIMALS = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨'];

// Returns 'YYYY-MM-DD' for today offset by `n` days into the past.
function dateOffset(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

// Returns the 7 ISO dates (Monday … Sunday) of the current calendar week.
function getCurrentWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay(); // 0=Sun 1=Mon … 6=Sat
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const GOAL_MILESTONES = [5000, 8000, 10000, 15000, 20000];

function nextMilestone(dailyGoal: number): number {
  return GOAL_MILESTONES.find((m) => m > dailyGoal) ?? dailyGoal;
}

type BadgeId = BadgeDef['id'];

function badgeTitle(id: BadgeId): string {
  return t.goals[`badge_${id}` as keyof typeof t.goals] as string;
}
function badgeDesc(id: BadgeId): string {
  return t.goals[`badge_${id}_desc` as keyof typeof t.goals] as string;
}

function formatAchievedAt(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface BadgeCardProps {
  def: BadgeDef;
  row: Badge | undefined;
}

function BadgeCard({ def, row }: BadgeCardProps) {
  const achieved = row?.achievedAt != null;

  return (
    <View style={[styles.badgeCard, achieved ? styles.badgeCardAchieved : styles.badgeCardLocked]}>
      <Text style={[styles.badgeCardEmoji, !achieved && styles.badgeCardEmojiLocked]}>
        {def.emoji}
      </Text>
      <View style={styles.badgeCardBody}>
        <Text style={[styles.badgeCardName, !achieved && styles.badgeCardNameLocked]}>
          {badgeTitle(def.id)}
        </Text>
        {achieved ? (
          <>
            <View style={styles.badgeEarnedTag}>
              <Text style={styles.badgeEarnedText}>{t.goals.badgeEarned(def.tokenReward)}</Text>
            </View>
            <Text style={styles.badgeCardDate}>
              {t.goals.badgeAchievedAt(formatAchievedAt(row!.achievedAt!))}
            </Text>
          </>
        ) : (
          <Text style={styles.badgeCardDesc}>{badgeDesc(def.id)}</Text>
        )}
      </View>
      {achieved && <Text style={styles.badgeCheck}>✅</Text>}
    </View>
  );
}

export function GoalsScreen() {
  const navigation   = useNavigation<GoalsNav>();
  const streakCurrent = useProgressStore((s) => s.streakCurrent);
  const dailyGoal     = useSettingsStore((s) => s.dailyGoal);
  const [weekDays, setWeekDays] = useState<StepDay[]>([]);
  const [badgeRows, setBadgeRows] = useState<Badge[]>([]);

  const weekDates = useMemo(() => getCurrentWeekDates(), []);
  const todayStr  = dateOffset(0);

  useEffect(() => {
    getStepDaysFrom(weekDates[0]!)
      .then(setWeekDays)
      .catch(() => setWeekDays([]));
  }, [weekDates]);

  useFocusEffect(
    useCallback(() => {
      getAllBadges().then(setBadgeRows).catch(() => setBadgeRows([]));
    }, []),
  );

  const dayMap = new Map(weekDays.map((d) => [d.date, d]));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{t.goals.title}</Text>

        {/* Weekly streak card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.goals.streakSectionTitle}</Text>

          <View style={styles.calendarRow}>
            {weekDates.map((date, idx) => {
              const row      = dayMap.get(date);
              // Show the animal for any day the user opened the app (step row exists),
              // not just days the step goal was reached — aligns with check-in streak logic.
              const reached  = row != null;
              const isToday  = date === todayStr;
              const isFuture = date > todayStr;

              return (
                <View key={date} style={[styles.dayCell, isFuture && styles.dayCellFuture]}>
                  <View
                    style={[
                      styles.animalCircle,
                      reached ? styles.animalCircleReached : styles.animalCircleEmpty,
                      isToday && !reached && styles.animalCircleToday,
                    ]}
                  >
                    {/* Show animal on reached days and always on today */}
                    {(reached || isToday) && (
                      <Text style={[styles.animalEmoji, isToday && !reached && styles.animalEmojiToday]}>
                        {DAY_ANIMALS[idx]}
                      </Text>
                    )}
                    {reached && <Text style={styles.reachedStar}>⭐</Text>}
                  </View>
                  <Text
                    style={[
                      styles.dayLabel,
                      reached && styles.dayLabelReached,
                      isToday && styles.dayLabelToday,
                    ]}
                  >
                    {WEEKDAY_SHORT[idx]}
                  </Text>
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

        {/* Next goal card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Next goal</Text>
          <Text style={styles.nextGoalText}>{t.goals.nextGoal(nextMilestone(dailyGoal))}</Text>
        </View>

        {/* Badges card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.goals.badgesTitle}</Text>
          <View style={styles.badgeList}>
            {GAME_CONFIG.badges.map((def) => (
              <BadgeCard
                key={def.id}
                def={def}
                row={badgeRows.find((r) => r.id === def.id)}
              />
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

  // ── Animal week row ──
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dayCell: {
    alignItems: 'center',
    flex: 1,
  },
  dayCellFuture: {
    opacity: 0.4,
  },
  animalCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 4,
  },
  animalCircleReached: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
    // Subtle shadow for depth
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  animalCircleEmpty: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.border,
    borderStyle: 'solid',
  },
  animalCircleToday: {
    borderColor: colors.primary,
    borderWidth: 2.5,
  },
  animalEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  animalEmojiToday: {
    opacity: 0.55,
  },
  reachedStar: {
    position: 'absolute',
    top: -6,
    right: -6,
    fontSize: 12,
    lineHeight: 14,
  },
  dayLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dayLabelReached: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayLabelToday: {
    color: colors.primaryDark,
    fontWeight: '700',
  },

  // ── Streak summary ──
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 22,
    marginRight: spacing.xs,
  },
  streakText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  bossButtonWrapper: {
    marginTop: spacing.md,
  },

  // ── Next goal ──
  nextGoalText: {
    ...typography.body,
    color: colors.textPrimary,
  },

  // ── Badges ──
  badgeList: {
    gap: spacing.sm,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    gap: spacing.md,
  },
  badgeCardAchieved: {
    backgroundColor: '#FFFDE7',
    borderColor: '#FFD54F',
    shadowColor: '#F9A825',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeCardLocked: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    opacity: 0.7,
  },
  badgeCardEmoji: {
    fontSize: 36,
  },
  badgeCardEmojiLocked: {
    opacity: 0.35,
  },
  badgeCardBody: {
    flex: 1,
    gap: 4,
  },
  badgeCardName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  badgeCardNameLocked: {
    color: colors.textSecondary,
  },
  badgeCardDesc: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  badgeEarnedTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeEarnedText: {
    ...typography.caption,
    color: '#2E7D32',
    fontWeight: '700',
  },
  badgeCardDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  badgeCheck: {
    fontSize: 20,
  },
});
