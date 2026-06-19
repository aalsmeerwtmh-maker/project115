import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';
import { GAME_CONFIG } from '@/game/config';

interface RenameModalProps {
  visible: boolean;
  currentName: string;
  isFree: boolean;
  tokenBalance: number;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

export function RenameModal({
  visible,
  currentName,
  isFree,
  tokenBalance,
  onConfirm,
  onCancel,
}: RenameModalProps) {
  const [name, setName] = useState(currentName);

  // Reset input whenever the modal opens with a (possibly new) current name.
  useEffect(() => {
    if (visible) setName(currentName);
  }, [visible, currentName]);

  const cost = GAME_CONFIG.petRenameCost;
  const canAfford = isFree || tokenBalance >= cost;
  const canSave = name.trim().length > 0 && canAfford;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />

        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.title}>{t.rename.title}</Text>

          {/* Name input */}
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t.rename.placeholder}
            placeholderTextColor={colors.outlineVariant}
            maxLength={20}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={() => canSave && onConfirm(name.trim())}
          />

          {/* Cost badge */}
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>{t.rename.costLabel}</Text>
            <View style={[styles.costBadge, isFree ? styles.costBadgeFree : styles.costBadgePaid]}>
              <Text style={[styles.costText, isFree ? styles.costTextFree : styles.costTextPaid]}>
                {isFree ? t.rename.costFree : t.rename.costTokens(cost)}
              </Text>
            </View>
          </View>

          {/* Insufficient tokens warning */}
          {!isFree && !canAfford && (
            <Text style={styles.errorText}>{t.rename.insufficientTokens}</Text>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} accessibilityRole="button">
              <Text style={styles.cancelText}>{t.rename.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
              onPress={() => canSave && onConfirm(name.trim())}
              disabled={!canSave}
              accessibilityRole="button"
            >
              <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
                {t.rename.save}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(50, 47, 34, 0.55)',
  },
  card: {
    width: '85%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.outlineVariant + '66',
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    ...typography.heading3,
    color: colors.primary,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    color: colors.onBackground,
    backgroundColor: colors.surfaceContainerLow,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  costLabel: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  costBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  costBadgeFree: {
    backgroundColor: colors.tertiaryContainer,
  },
  costBadgePaid: {
    backgroundColor: colors.secondaryContainer,
  },
  costText: {
    ...typography.labelSmall,
  },
  costTextFree: {
    color: colors.onTertiaryContainer,
  },
  costTextPaid: {
    color: colors.onSecondaryContainer,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.primaryContainer,
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryDim,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: colors.surfaceContainerHigh,
    borderBottomColor: colors.outlineVariant,
  },
  saveText: {
    ...typography.label,
    color: colors.onPrimaryContainer,
    fontWeight: '900',
  },
  saveTextDisabled: {
    color: colors.onSurfaceVariant,
  },
});
