import { View, Text, StyleSheet } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';
import type { EquipmentItem } from '@/game/config';

export type ItemDisplayState = 'buy' | 'equip' | 'unequip' | 'equipped';

interface ShopItemCardProps {
  item: EquipmentItem;
  displayState: ItemDisplayState;
  userTokens: number;
  onBuy: () => void;
  onEquip: () => void;
  onUnequip: () => void;
  loading?: boolean;
}

export function ShopItemCard({
  item,
  displayState,
  userTokens,
  onBuy,
  onEquip,
  onUnequip,
  loading = false,
}: ShopItemCardProps) {
  const canAfford = userTokens >= item.tokenCost;

  function buildActionButton() {
    if (displayState === 'buy') {
      return (
        <PrimaryButton
          label={`${t.shop.buyButton} · ${item.tokenCost}`}
          accessibilityLabel={`Buy ${item.name} for ${item.tokenCost} tokens`}
          onPress={onBuy}
          disabled={!canAfford || loading}
          loading={loading}
        />
      );
    }
    if (displayState === 'equip') {
      return (
        <PrimaryButton
          label={t.shop.equipButton}
          accessibilityLabel={`Equip ${item.name}`}
          onPress={onEquip}
          disabled={loading}
          loading={loading}
        />
      );
    }
    if (displayState === 'unequip' || displayState === 'equipped') {
      return (
        <PrimaryButton
          label={t.shop.unequipButton}
          accessibilityLabel={`Unequip ${item.name}`}
          onPress={onUnequip}
          disabled={loading}
          loading={loading}
        />
      );
    }
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.itemName}>{item.name}</Text>
        {displayState !== 'buy' && (
          <View style={styles.ownedBadge}>
            <Text style={styles.ownedText}>
              {displayState === 'equipped' || displayState === 'unequip'
                ? t.shop.equippedBadge
                : t.shop.ownedBadge}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.category}>{item.category}</Text>

      {displayState === 'buy' && (
        <Text style={[styles.costLabel, !canAfford && styles.costLabelAffordable]}>
          {item.tokenCost} tokens
        </Text>
      )}

      <View style={styles.actionRow}>{buildActionButton()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  itemName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  ownedBadge: {
    backgroundColor: colors.success,
    borderRadius: radius.sm,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
  },
  ownedText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '600',
  },
  category: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: spacing.sm,
  },
  costLabel: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  costLabelAffordable: {
    color: colors.error,
  },
  actionRow: {
    marginTop: spacing.xs,
  },
});
