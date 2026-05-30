import { View, Text, StyleSheet } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

interface ErrorStateProps {
  heading?: string;
  body?: string;
  onRetry?: () => void;
}

export function ErrorState({ heading, body, onRetry }: ErrorStateProps) {
  const headingText = heading ?? t.common.errorGeneric;
  return (
    <View style={styles.container}>
      <Text style={styles.icon} accessibilityElementsHidden>
        ⚠️
      </Text>
      <Text style={styles.heading} allowFontScaling>
        {headingText}
      </Text>
      {body != null && (
        <Text style={styles.body} allowFontScaling>
          {body}
        </Text>
      )}
      {onRetry != null && (
        <View style={styles.buttonWrapper}>
          <PrimaryButton label={t.common.retry} onPress={onRetry} />
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
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  buttonWrapper: {
    marginTop: spacing.sm,
  },
});
