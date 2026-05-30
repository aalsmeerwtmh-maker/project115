import { View, Text, Modal, StyleSheet } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

interface DailyCheckinModalProps {
  visible: boolean;
  streakDay: number;
  tokensEarned: number;
  onClaim: () => void;
}

export function DailyCheckinModal({
  visible,
  streakDay,
  tokensEarned,
  onClaim,
}: DailyCheckinModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClaim}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🎁</Text>
          <Text style={styles.title}>{t.checkin.dailyCheckinTitle}</Text>
          <Text style={styles.streakDay}>{t.checkin.streakDay(streakDay)}</Text>
          <Text style={styles.reward}>{t.checkin.rewardEarned(tokensEarned)}</Text>
          <View style={styles.buttonWrapper}>
            <PrimaryButton label={t.checkin.claimButton} onPress={onClaim} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  streakDay: {
    ...typography.bodyBold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  reward: {
    ...typography.heading2,
    color: colors.success,
    marginBottom: spacing.lg,
  },
  buttonWrapper: {
    width: '100%',
  },
});
