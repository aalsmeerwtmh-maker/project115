/**
 * Haptic feedback wrappers.
 * Call sites throughout the app use these named functions instead of importing
 * expo-haptics directly, so haptic behavior can be toggled or changed in one place.
 */
import * as Haptics from 'expo-haptics';

/** Heavy impact — used for reward moments (daily check-in claim, token earn). */
export function hapticReward(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

/** Notification success — used for positive outcome events (boss win, goal reached). */
export function hapticSuccess(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Selection feedback — used for light interactions (new cell discovery, tab switch). */
export function hapticSelection(): void {
  Haptics.selectionAsync().catch(() => {});
}
