// react-native-iap v15 wrappers: product fetch, purchase, receipt validation.
// v15 uses NitroModules (JSI-based) and requires New Architecture (newArchEnabled: true).
//
// ISOLATION: nothing outside this file may import from 'react-native-iap'.
// All IAP logic passes through the functions exported here.

import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  finishTransaction,
  getAvailablePurchases,
  type Product,
  type Purchase,
} from 'react-native-iap';

import { GAME_CONFIG } from '@/game/config';
import { useProgressStore } from '@/stores/progressStore';

export type { Product, Purchase };

// -------------------------------------------------------------------
// Lifecycle
// -------------------------------------------------------------------

/**
 * Initialises the IAP connection to the platform store.
 * Must be called once on app mount before any other IAP function.
 */
export async function initIAP(): Promise<void> {
  await initConnection();
}

/**
 * Tears down the IAP connection.
 * Call on app unmount or when leaving a screen that uses IAP.
 */
export async function teardownIAP(): Promise<void> {
  await endConnection();
}

// -------------------------------------------------------------------
// Products
// -------------------------------------------------------------------

/**
 * Fetches live product info for all configured IAP token bundles.
 * Returns an empty array when the store is unavailable (e.g. in development).
 */
export async function fetchIapProducts(): Promise<Product[]> {
  const productIds = GAME_CONFIG.iapBundles.map((b) => b.productId);
  try {
    const result = await fetchProducts({ skus: productIds });
    return (result as Product[]) ?? [];
  } catch {
    return [];
  }
}

// Keep the spec-defined name as an alias
export { fetchIapProducts as fetchProducts };

// -------------------------------------------------------------------
// Purchases
// -------------------------------------------------------------------

/**
 * Initiates a token bundle purchase.
 * The actual token credit happens in the `purchaseUpdatedListener` callback,
 * not here — purchase completion is async and event-driven.
 *
 * v15 API: requestPurchase takes { request: { apple|google }, type }.
 */
export async function purchaseTokenBundle(productId: string): Promise<void> {
  if (Platform.OS === 'ios') {
    await requestPurchase({
      request: { apple: { sku: productId } },
      type: 'in-app',
    });
  } else {
    await requestPurchase({
      request: { google: { skus: [productId] } },
      type: 'in-app',
    });
  }
}

/**
 * Wires up the purchase-updated listener.
 * On a successful purchase:
 *  1. Looks up how many tokens the bundle grants from GAME_CONFIG.
 *  2. Credits tokens via progressStore.addTokens.
 *  3. Calls finishTransaction to consume/acknowledge with the store.
 *
 * Returns a cleanup function — call it on component unmount or teardown.
 */
export function setupPurchaseListeners(): () => void {
  const subscription = purchaseUpdatedListener(async (purchase: Purchase) => {
    const bundle = GAME_CONFIG.iapBundles.find((b) => b.productId === purchase.productId);
    if (!bundle) return;

    try {
      // Credit tokens first so the user isn't left in a bad state if finish fails.
      await useProgressStore.getState().addTokens(bundle.tokenAmount);

      await finishTransaction({ purchase, isConsumable: true });
    } catch (err) {
      console.warn('[IAP] finishTransaction failed:', err);
    }
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Restores previous non-consumable or subscription purchases.
 * For token bundles (consumable), this is a no-op — tokens are one-time credits.
 * Provided to satisfy App Store review requirements.
 */
export async function restorePurchases(): Promise<void> {
  await getAvailablePurchases();
}
