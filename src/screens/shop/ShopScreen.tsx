import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgressStore } from '@/stores/progressStore';
import { usePetStore } from '@/stores/petStore';
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
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { en } from '@/i18n/en';
import type { Equipment } from '@/db/schema';
import type { Product } from '@/services/iap';
import type { ItemDisplayState } from './components/ShopItemCard';

export function ShopScreen() {
  const tokens = useProgressStore((s) => s.tokens);
  const spendTokens = useProgressStore((s) => s.spendTokens);
  const activePet = usePetStore((s) => s.activePet);

  const [ownedItems, setOwnedItems] = useState<Equipment[]>([]);
  const [iapProducts, setIapProducts] = useState<Product[]>([]);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [loadingIapId, setLoadingIapId] = useState<string | null>(null);
  const [restoringPurchases, setRestoringPurchases] = useState(false);

  const refreshOwned = useCallback(async () => {
    try {
      const rows = await getOwnedEquipment();
      setOwnedItems(rows);
    } catch {
      setOwnedItems([]);
    }
  }, []);

  useEffect(() => {
    getOwnedEquipment()
      .then(setOwnedItems)
      .catch(() => setOwnedItems([]));
    fetchIapProducts()
      .then(setIapProducts)
      .catch(() => setIapProducts([]));
  }, []);

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

    setLoadingItemId(catalogId);
    try {
      await equipItem(owned.id, activePet.id);
      await refreshOwned();
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
              <Text style={styles.heading}>{en.shop.title}</Text>
              <TokenBalanceBadge tokens={tokens} />
            </View>

            <Text style={styles.sectionTitle}>{en.shop.earnSection}</Text>

            {GAME_CONFIG.iapBundles.map((bundle) => (
              <IapBundleRow
                key={bundle.productId}
                bundle={bundle}
                livePrice={getLivePrice(bundle.productId)}
                onBuy={() => {
                  handleIapBuy(bundle.productId);
                }}
                loading={loadingIapId === bundle.productId}
              />
            ))}

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestorePurchases}
              disabled={restoringPurchases}
            >
              <Text style={styles.restoreText}>{en.shop.restorePurchases}</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>{en.shop.equipmentSection}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ShopItemCard
            item={item}
            displayState={getDisplayState(item.id)}
            userTokens={tokens}
            onBuy={() => {
              handleBuy(item.id, item.tokenCost);
            }}
            onEquip={() => {
              handleEquip(item.id);
            }}
            onUnequip={() => {
              handleUnequip(item.id);
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
});
