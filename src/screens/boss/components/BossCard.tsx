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

interface BossCardProps {
  boss: BossDefinition;
  pet: Pet;
  streakDays: number;
  defeated: boolean;
  onChallenge: () => void;
  loading?: boolean;
}

export function BossCard({
  boss,
  pet,
  streakDays,
  defeated,
  onChallenge,
  loading = false,
}: BossCardProps) {
  const requirements = buildRequirements(boss, pet, streakDays);
  const eligible = canChallengeBoss(boss, pet, streakDays);
  const challengeDisabled = !eligible || defeated || loading;

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
});
