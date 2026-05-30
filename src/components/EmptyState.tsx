import { View, Text, StyleSheet } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface EmptyStateProps {
  icon?: string;
  heading: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = '📭', heading, body, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon} accessibilityElementsHidden>
        {icon}
      </Text>
      <Text style={styles.heading} allowFontScaling>
        {heading}
      </Text>
      {body != null && (
        <Text style={styles.body} allowFontScaling>
          {body}
        </Text>
      )}
      {actionLabel != null && onAction != null && (
        <View style={styles.buttonWrapper}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    borderRadius: radius.lg,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.heading3,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textDisabled,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  buttonWrapper: {
    marginTop: spacing.sm,
  },
});
