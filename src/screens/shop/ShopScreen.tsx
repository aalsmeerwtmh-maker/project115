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
  const tokens = useProgressStore((s) => s.tokens);
  const spendTokens = useProgressStore((s) => s.spendTokens);
  const activePet = usePetStore((s) => s.activePet);

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
});
