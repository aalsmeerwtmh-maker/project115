import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';
import type { IapBundle } from '@/game/config';

interface IapBundleRowProps {
  bundle: IapBundle;
  livePrice?: string | null; // from fetchProducts; falls back to displayPrice
  onBuy: () => void;
  loading?: boolean;
}

export function IapBundleRow({ bundle, livePrice, onBuy, loading = false }: IapBundleRowProps) {
  const priceLabel = livePrice ?? bundle.displayPrice;

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.tokenAmount}>🪙 {bundle.tokenAmount}</Text>
        <Text style={styles.price}>{priceLabel}</Text>
      </View>

      <TouchableOpacity
        style={[styles.buyButton, loading && styles.buyButtonDisabled]}
        onPress={onBuy}
        disabled={loading}
        activeOpacity={0.75}
      >
        {loading ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.buyLabel}>{t.shop.iapBuyButton}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {
    gap: spacing.xs,
  },
  tokenAmount: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  price: {
    ...typography.label,
    color: colors.textSecondary,
  },
  buyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyLabel: {
    ...typography.bodyBold,
    color: colors.surface,
  },
});
