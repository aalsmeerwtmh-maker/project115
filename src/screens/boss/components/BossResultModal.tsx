import { View, Text, Modal, StyleSheet } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { en } from '@/i18n/en';

interface BossResultModalProps {
  visible: boolean;
  won: boolean;
  tokensEarned: number;
  dialogueLine: string;
  onClose: () => void;
}

export function BossResultModal({
  visible,
  won,
  tokensEarned,
  dialogueLine,
  onClose,
}: BossResultModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={[styles.title, won ? styles.winTitle : styles.lossTitle]}>
            {won ? en.boss.winTitle : en.boss.lossTitle}
          </Text>

          {won ? (
            <>
              <Text style={styles.tokensEarned}>{en.boss.tokensEarned(tokensEarned)}</Text>
              {dialogueLine.length > 0 && <Text style={styles.dialogue}>{dialogueLine}</Text>}
            </>
          ) : (
            <Text style={styles.lossMessage}>{en.boss.lossMessage}</Text>
          )}

          <View style={styles.buttonWrapper}>
            <PrimaryButton label={en.boss.closeButton} onPress={onClose} />
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
  title: {
    ...typography.heading1,
    marginBottom: spacing.md,
  },
  winTitle: {
    color: colors.success,
  },
  lossTitle: {
    color: colors.error,
  },
  tokensEarned: {
    ...typography.heading2,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  dialogue: {
    ...typography.body,
    color: colors.textPrimary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  lossMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  buttonWrapper: {
    marginTop: spacing.sm,
    width: '100%',
  },
});
