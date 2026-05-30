import { useEffect } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { hapticSuccess } from '@/services/haptics';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

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
  useEffect(() => {
    if (visible && won) {
      hapticSuccess();
    }
  }, [visible, won]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={[styles.title, won ? styles.winTitle : styles.lossTitle]}>
            {won ? t.boss.winTitle : t.boss.lossTitle}
          </Text>

          {won ? (
            <>
              <Text style={styles.tokensEarned}>{t.boss.tokensEarned(tokensEarned)}</Text>
              {dialogueLine.length > 0 && <Text style={styles.dialogue}>{dialogueLine}</Text>}
            </>
          ) : (
            <Text style={styles.lossMessage}>{t.boss.lossMessage}</Text>
          )}

          <View style={styles.buttonWrapper}>
            <PrimaryButton label={t.boss.closeButton} onPress={onClose} />
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
