/**
 * OfflineBanner — slide-in banner shown when the device has no network connectivity.
 *
 * NATIVE BUILD NOTE: @react-native-community/netinfo is installed but requires
 * a dev client rebuild before native connectivity detection works on device.
 * Rebuild with: eas build --profile development --platform android
 */
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useNetInfo } from '@react-native-community/netinfo';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

function useIsOffline(): boolean {
  const { isConnected } = useNetInfo();
  return isConnected === false;
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
