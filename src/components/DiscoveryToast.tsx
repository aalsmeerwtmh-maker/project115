import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';
import { hapticSelection } from '@/services/haptics';

interface DiscoveryToastProps {
  visible: boolean;
  tokensAwarded: number;
  onDismiss: () => void;
}

const SLIDE_IN_MS = 300;
const VISIBLE_MS = 3000;
const SLIDE_OUT_MS = 300;
const TOAST_HEIGHT = 56;

/**
 * Reanimated slide-in banner from top.
 * Auto-dismisses after 3 s then slides back up.
 * Calls `hapticSelection` when it first appears.
 */
export function DiscoveryToast({ visible, tokensAwarded, onDismiss }: DiscoveryToastProps) {
  const translateY = useSharedValue(-TOAST_HEIGHT - 20);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    /* eslint-disable react-hooks/immutability */
    if (visible) {
      hapticSelection();
      // Slide in.
      translateY.value = withTiming(0, {
        duration: SLIDE_IN_MS,
        easing: Easing.out(Easing.back(1.2)),
      });
      // Slide back out after VISIBLE_MS and call onDismiss.
      translateY.value = withDelay(
        VISIBLE_MS,
        withTiming(-TOAST_HEIGHT - 20, {
          duration: SLIDE_OUT_MS,
          easing: Easing.in(Easing.ease),
        }),
      );

      const timer = setTimeout(() => {
        onDismiss();
      }, VISIBLE_MS + SLIDE_OUT_MS);

      return () => clearTimeout(timer);
    } else {
      translateY.value = -TOAST_HEIGHT - 20;
    }
    /* eslint-enable react-hooks/immutability */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Animated.View style={[styles.toast, animatedStyle]} pointerEvents="none">
      <Text style={styles.text} allowFontScaling>
        {t.walks.discoveryBanner(tokensAwarded)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    height: TOAST_HEIGHT,
    backgroundColor: colors.info,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 100,
  },
  text: {
    ...typography.bodyBold,
    color: colors.surface,
    textAlign: 'center',
  },
});
