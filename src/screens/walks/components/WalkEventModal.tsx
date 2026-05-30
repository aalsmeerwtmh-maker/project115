import { View, Text, Modal, StyleSheet } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

interface WalkEventModalProps {
  visible: boolean;
  dialogue: string;
  onDismiss: () => void;
}

export function WalkEventModal({ visible, dialogue, onDismiss }: WalkEventModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🐾</Text>
          <Text style={styles.title}>{t.walks.randomEventTitle}</Text>
          <Text style={styles.dialogue}>{dialogue}</Text>
          <View style={styles.buttonWrapper}>
            <PrimaryButton label={t.walks.randomEventDismiss} onPress={onDismiss} />
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
    justifyContent: 'flex-end',
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  dialogue: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  buttonWrapper: {
    width: '100%',
  },
});
