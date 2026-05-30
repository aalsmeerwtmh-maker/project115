import { View, Text, StyleSheet } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';
import type { BossDefinition } from '@/game/config';
import type { Pet } from '@/db/schema';
import { canChallengeBoss } from '@/game/bosses';

interface Requirement {
  label: string;
  met: boolean;
}

function buildRequirements(boss: BossDefinition, pet: Pet, streakDays: number): Requirement[] {
  const stageOrder: Pet['stage'][] = ['baby', 'child', 'adult', 'elder'];
  return [
    {
      label: t.boss.reqStreak(boss.requiredStreakDays),
      met: streakDays >= boss.requiredStreakDays,
    },
    {
      label: t.boss.reqGrowth(boss.requiredGrowthValue),
      met: pet.growthValue >= boss.requiredGrowthValue,
    },
    {
      label: t.boss.reqStage(boss.requiredStage),
      met: stageOrder.indexOf(pet.stage) >= stageOrder.indexOf(boss.requiredStage),
    },
    {
      label: t.boss.reqStamina(boss.requiredStamina),
      met: pet.stamina >= boss.requiredStamina,
    },
  ];
}

function buildCooldownLabel(retryUntilMs: number, nowMs: number): string {
  const remainMs = Math.max(0, retryUntilMs - nowMs);
  const totalMinutes = Math.floor(remainMs / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return t.boss.retryCountdown(h, m);
}

interface BossCardProps {
  boss: BossDefinition;
  pet: Pet;
  streakDays: number;
  defeated: boolean;
  retryUntilMs: number | null; // null = no active cooldown
  nowMs: number; // current timestamp, supplied by parent to keep this component pure
  onChallenge: () => void;
  loading?: boolean;
}

export function BossCard({
  boss,
  pet,
  streakDays,
  defeated,
  retryUntilMs,
  nowMs,
  onChallenge,
  loading = false,
}: BossCardProps) {
  const requirements = buildRequirements(boss, pet, streakDays);
  const eligible = canChallengeBoss(boss, pet, streakDays);
  const inCooldown = retryUntilMs !== null && retryUntilMs > nowMs;
  const challengeDisabled = !eligible || defeated || inCooldown || loading;

  return (
    <View style={styles.card}>
      <Text style={styles.bossName}>{boss.name}</Text>
      <Text style={styles.villainLine}>{boss.villainLine}</Text>

      <View style={styles.requirementsList}>
        {requirements.map((req) => (
          <View
            key={req.label}
            style={styles.requirementRow}
            accessibilityLabel={`${req.label}: ${req.met ? 'met' : 'not met'}`}
          >
            <Text style={[styles.reqIcon, req.met ? styles.reqMet : styles.reqUnmet]}>
              {req.met ? '✓' : '✗'}
            </Text>
            <Text style={[styles.reqLabel, req.met ? styles.reqMetText : styles.reqUnmetText]}>
              {req.label}
            </Text>
          </View>
        ))}
      </View>

      {defeated ? (
        <View style={styles.defeatedBadge}>
          <Text style={styles.defeatedText}>{t.boss.defeatedBadge}</Text>
        </View>
      ) : inCooldown ? (
        <View style={styles.cooldownBadge}>
          <Text style={styles.cooldownText}>{buildCooldownLabel(retryUntilMs!, nowMs)}</Text>
        </View>
      ) : (
        <PrimaryButton
          label={t.boss.challengeButton}
          onPress={onChallenge}
          disabled={challengeDisabled}
          loading={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bossName: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  villainLine: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  requirementsList: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reqIcon: {
    fontSize: 14,
    fontWeight: '700',
    width: 18,
  },
  reqMet: {
    color: colors.success,
  },
  reqUnmet: {
    color: colors.error,
  },
  reqLabel: {
    ...typography.label,
  },
  reqMetText: {
    color: colors.textPrimary,
  },
  reqUnmetText: {
    color: colors.textSecondary,
  },
  defeatedBadge: {
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  defeatedText: {
    ...typography.bodyBold,
    color: colors.surface,
  },
  cooldownBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cooldownText: {
    ...typography.label,
    color: colors.textSecondary,
  },
});
