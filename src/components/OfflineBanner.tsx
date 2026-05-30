/**
 * OfflineBanner — slide-in banner shown when the device has no network connectivity.
 *
 * NATIVE BUILD NOTE: This component requires @react-native-community/netinfo.
 * Install it with `npx expo install @react-native-community/netinfo` and then
 * rebuild the dev client before the offline detection will actually work.
 *
 * Until the package is installed, the import below will fail at runtime.
 * The try/catch wrapper around the import means the banner simply never shows
 * (no crash) — the app continues to function normally offline-first.
 */
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

// ---------------------------------------------------------------------------
// Optional NetInfo import — wrapped so the app doesn't crash if the package
// isn't installed yet (dev client rebuild needed after `npx expo install`).
// ---------------------------------------------------------------------------
let useNetInfoModule: (() => { isConnected: boolean | null }) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const NetInfo = require('@react-native-community/netinfo');
  useNetInfoModule = NetInfo.useNetInfo ?? NetInfo.default?.useNetInfo ?? null;
} catch {
  // Package not installed — offline detection disabled until dev client rebuild.
}

function useIsOffline(): boolean {
  if (useNetInfoModule) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { isConnected } = useNetInfoModule();
    return isConnected === false;
  }
  // Package unavailable — assume online so the banner never appears.
  return false;
}

const BANNER_HEIGHT = 44;

/**
 * Rendered once in App.tsx with absoluteFill + pointerEvents="none".
 * Slides down from off-screen when the device goes offline.
 */
export function OfflineBanner() {
  const isOffline = useIsOffline();
  const translateY = useSharedValue(-BANNER_HEIGHT - 4);

  useEffect(() => {
    translateY.value = withTiming(isOffline ? 0 : -BANNER_HEIGHT - 4, { duration: 300 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.banner, animatedStyle]} pointerEvents="none">
      <Text style={styles.text} allowFontScaling>
        {t.common.offlineBanner}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    zIndex: 9999,
    elevation: 10,
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
  },
  text: {
    ...typography.bodyBold,
    color: colors.surface,
  },
});
