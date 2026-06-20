import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgressStore } from '@/stores/progressStore';
import { usePetStore } from '@/stores/petStore';
import { useEquipmentStore } from '@/stores/equipmentStore';
import {
  getOwnedEquipment,
  purchaseEquipment,
  equipItem,
  unequipItem,
} from '@/db/repositories/equipment';
import {
  fetchProducts as fetchIapProducts,
  purchaseTokenBundle,
  restorePurchases,
} from '@/services/iap';
import { GAME_CONFIG } from '@/game/config';
import { generateId } from '@/utils/id';
import { TokenBalanceBadge } from './components/TokenBalanceBadge';
import { ShopItemCard } from './components/ShopItemCard';
import { IapBundleRow } from './components/IapBundleRow';
import { ErrorState } from '@/components/ErrorState';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';
import type { Equipment } from '@/db/schema';
import type { Product } from '@/services/iap';
import type { ItemDisplayState } from './components/ShopItemCard';

export function ShopScreen() {
  const tokens        = useProgressStore((s) => s.tokens);
  const spendTokens   = useProgressStore((s) => s.spendTokens);
  const setFeedExpiry = useProgressStore((s) => s.setFeedExpiry);
  const activePet       = usePetStore((s) => s.activePet);
  const updateActivePet = usePetStore((s) => s.updateActivePet);

  const [loadingFoodId, setLoadingFoodId] = useState<string | null>(null);
  const [ownedItems, setOwnedItems] = useState<Equipment[]>([]);
  const [iapProducts, setIapProducts] = useState<Product[]>([]);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [loadingIapId, setLoadingIapId] = useState<string | null>(null);
  const [restoringPurchases, setRestoringPurchases] = useState(false);
  const [iapLoading, setIapLoading] = useState(true);
  const [iapError, setIapError] = useState(false);

  const refreshOwned = useCallback(async () => {
    try {
      const rows = await getOwnedEquipment();
      setOwnedItems(rows);
    } catch {
      setOwnedItems([]);
    }
  }, []);

  const loadStore = useCallback(async () => {
    try {
      const [owned, products] = await Promise.allSettled([getOwnedEquipment(), fetchIapProducts()]);
      if (owned.status === 'fulfilled') setOwnedItems(owned.value);
      if (products.status === 'fulfilled') {
        setIapProducts(products.value);
        setIapError(false);
      } else {
        setIapError(true);
      }
    } catch {
      setIapError(true);
    } finally {
      setIapLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStore();
  }, [loadStore]);

  function getLivePrice(productId: string): string | null {
    // react-native-iap v15: Product uses `id` (not `productId`) and `displayPrice`
    const product = iapProducts.find((p) => p.id === productId);
    if (!product) return null;
    return product.displayPrice ?? null;
  }

  function getDisplayState(catalogId: string): ItemDisplayState {
    const owned = ownedItems.find((e) => e.catalogId === catalogId);
    if (!owned) return 'buy';
    if (owned.petId !== null) return 'unequip';
    return 'equip';
  }

  async function handleBuy(catalogId: string, tokenCost: number): Promise<void> {
    const alreadyOwned = ownedItems.some((e) => e.catalogId === catalogId);
    if (alreadyOwned || tokens < tokenCost) return;

    setLoadingItemId(catalogId);
    try {
      await spendTokens(tokenCost);
      await purchaseEquipment(catalogId, 'token', generateId());
      await refreshOwned();
      if (activePet) {
        useEquipmentStore.getState().refresh(activePet.id).catch(() => {});
      }
    } catch (err) {
      Alert.alert('Purchase failed', String(err));
    } finally {
      setLoadingItemId(null);
    }
  }

  async function handleEquip(catalogId: string): Promise<void> {
    if (!activePet) return;
    const owned = ownedItems.find((e) => e.catalogId === catalogId);
    if (!owned) return;

    const catalogItem = catalogItems.find((c) => c.id === catalogId);

    setLoadingItemId(catalogId);
    try {
      // Background items: only one can be equipped at a time — unequip the other background first.
      if (catalogItem?.category === 'background') {
        for (const row of ownedItems) {
          if (row.petId !== null && row.catalogId !== catalogId) {
            const rowCatalog = catalogItems.find((c) => c.id === row.catalogId);
            if (rowCatalog?.category === 'background') {
              await unequipItem(row.id);
            }
          }
        }
      }
      await equipItem(owned.id, activePet.id);
      await refreshOwned();
      useEquipmentStore.getState().refresh(activePet.id).catch(() => {});
    } finally {
      setLoadingItemId(null);
    }
  }

  async function handleUnequip(catalogId: string): Promise<void> {
    const owned = ownedItems.find((e) => e.catalogId === catalogId);
    if (!owned) return;

    setLoadingItemId(catalogId);
    try {
      await unequipItem(owned.id);
      await refreshOwned();
      if (activePet) {
        useEquipmentStore.getState().refresh(activePet.id).catch(() => {});
      }
    } finally {
      setLoadingItemId(null);
    }
  }

  async function handleIapBuy(productId: string): Promise<void> {
    setLoadingIapId(productId);
    try {
      await purchaseTokenBundle(productId);
      // Token credit happens via setupPurchaseListeners in App.tsx — no manual update needed here
    } catch (err) {
      Alert.alert('Purchase failed', String(err));
    } finally {
      setLoadingIapId(null);
    }
  }

  async function handleRestorePurchases(): Promise<void> {
    setRestoringPurchases(true);
    try {
      await restorePurchases();
    } finally {
      setRestoringPurchases(false);
    }
  }

  function getFoodDisplayName(id: string): string {
    const sc = t.statusCheck;
    if (id === 'food_bread') return sc.foodBread;
    if (id === 'food_milk') return sc.foodMilk;
    return sc.foodFeeds;
  }

  async function handleFeedFood(foodId: string): Promise<void> {
    const food = GAME_CONFIG.food.find((f) => f.id === foodId);
    if (!food || !activePet || tokens < food.tokenCost) return;
    setLoadingFoodId(foodId);
    try {
      await spendTokens(food.tokenCost);
      const newStamina   = Math.min(100, activePet.stamina + food.staminaBoost);
      const newAffection = Math.min(100, activePet.affection + food.affectionBoost);
      await updateActivePet({ stamina: newStamina, affection: newAffection });
      await setFeedExpiry(Date.now() + GAME_CONFIG.foodMoodDurationMs);
    } catch {
      Alert.alert(t.shop.insufficientTokens);
    } finally {
      setLoadingFoodId(null);
    }
  }

  const catalogItems = GAME_CONFIG.equipment;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={catalogItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.heading}>{t.shop.title}</Text>
              <TokenBalanceBadge tokens={tokens} />
            </View>

            <Text style={styles.sectionTitle}>{t.shop.earnSection}</Text>

            {iapLoading && <ActivityIndicator color={colors.primary} style={styles.iapLoader} />}
            {iapError && !iapLoading && (
              <ErrorState heading="Couldn't connect to store." onRetry={loadStore} />
            )}
            {!iapLoading &&
              !iapError &&
              GAME_CONFIG.iapBundles.map((bundle) => (
                <IapBundleRow
                  key={bundle.productId}
                  bundle={bundle}
                  livePrice={getLivePrice(bundle.productId)}
                  onBuy={() => {
                    void handleIapBuy(bundle.productId);
                  }}
                  loading={loadingIapId === bundle.productId}
                />
              ))}

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={() => void handleRestorePurchases()}
              disabled={restoringPurchases}
            >
              <Text style={styles.restoreText}>{t.shop.restorePurchases}</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>{t.shop.foodSection}</Text>
            {GAME_CONFIG.food.map((food) => {
              const canAfford = tokens >= food.tokenCost;
              return (
                <View key={food.id} style={styles.foodCard}>
                  <Text style={styles.foodEmoji}>{food.emoji}</Text>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{getFoodDisplayName(food.id)}</Text>
                    <Text style={styles.foodStats}>
                      {t.statusCheck.foodStats(food.staminaBoost, food.affectionBoost)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.feedBtn, !canAfford && styles.feedBtnDisabled]}
                    onPress={() => void handleFeedFood(food.id)}
                    disabled={!canAfford || loadingFoodId !== null}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.feedBtnText, !canAfford && styles.feedBtnTextDisabled]}>
                      {t.statusCheck.feedButton}
                    </Text>
                    <Text style={[styles.feedBtnCost, !canAfford && styles.feedBtnTextDisabled]}>
                      {food.tokenCost} 🪙
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            <Text style={styles.sectionTitle}>{t.shop.equipmentSection}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ShopItemCard
            item={item}
            displayState={getDisplayState(item.id)}
            userTokens={tokens}
            onBuy={() => {
              void handleBuy(item.id, item.tokenCost);
            }}
            onEquip={() => {
              void handleEquip(item.id);
            }}
            onUnequip={() => {
              void handleUnequip(item.id);
            }}
            loading={loadingItemId === item.id}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.heading1,
    color: colors.primary,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  restoreButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: radius.md,
  },
  restoreText: {
    ...typography.label,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  iapLoader: {
    marginVertical: spacing.md,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  foodEmoji: { fontSize: 32 },
  foodInfo: { flex: 1 },
  foodName: { ...typography.bodyBold, color: colors.textPrimary },
  foodStats: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  feedBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minWidth: 64,
  },
  feedBtnDisabled: { backgroundColor: colors.border },
  feedBtnText: { ...typography.label, color: '#FFFFFF' },
  feedBtnCost: { ...typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  feedBtnTextDisabled: { color: colors.textSecondary },
});
