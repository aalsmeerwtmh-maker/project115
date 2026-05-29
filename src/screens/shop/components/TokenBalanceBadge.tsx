import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { en } from '@/i18n/en';

interface TokenBalanceBadgeProps {
  tokens: number;
}

export function TokenBalanceBadge({ tokens }: TokenBalanceBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.coinIcon}>🪙</Text>
      <Text style={styles.label}>{en.shop.tokenBalance(tokens)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  coinIcon: {
    fontSize: 16,
  },
  label: {
    ...typography.bodyBold,
    color: colors.primary,
  },
});
