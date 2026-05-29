import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

interface StepRingProps {
  steps: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

const ANIMATION_DURATION = 800;

export function StepRing({ steps, goal, size = 200, strokeWidth = 14 }: StepRingProps) {
  const progress = Math.min(steps / Math.max(goal, 1), 1);
  const innerSize = size - strokeWidth * 2;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedProgress, progress]);

  // The ring is built from two half-circle clips.
  // Left half shows 0–50%, right half shows 50–100%.
  const rightFillStyle = useAnimatedStyle(() => {
    const deg = Math.min(animatedProgress.value * 360, 180);
    return { transform: [{ rotate: `${deg}deg` }] };
  });

  const leftFillStyle = useAnimatedStyle(() => {
    const leftProgress = Math.max(animatedProgress.value - 0.5, 0);
    const deg = leftProgress * 360;
    return { transform: [{ rotate: `${deg}deg` }] };
  });

  const goalReached = steps >= goal;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* Track circle */}
      <View
        style={[
          styles.track,
          { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth },
        ]}
      />

      {/* Right half fill (0–180 deg) */}
      <View
        style={[styles.halfContainer, styles.rightClip, { width: size / 2, height: size }]}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            styles.halfFill,
            rightFillStyle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: goalReached ? colors.success : colors.primary,
            },
          ]}
        />
      </View>

      {/* Left half fill (180–360 deg) */}
      <View
        style={[styles.halfContainer, styles.leftClip, { width: size / 2, height: size }]}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            styles.halfFill,
            styles.leftHalf,
            leftFillStyle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: goalReached ? colors.success : colors.primary,
            },
          ]}
        />
      </View>

      {/* Centre label */}
      <View
        style={[
          styles.center,
          { width: innerSize, height: innerSize, borderRadius: innerSize / 2 },
        ]}
      >
        <Text style={[styles.stepCount, { fontSize: size * 0.175 }]}>{steps.toLocaleString()}</Text>
        <Text style={styles.stepLabel}>steps</Text>
        {goalReached && <Text style={styles.goalBadge}>🎉</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  halfContainer: {
    position: 'absolute',
    overflow: 'hidden',
  },
  rightClip: {
    right: 0,
  },
  leftClip: {
    left: 0,
  },
  halfFill: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  leftHalf: {
    right: 0,
  },
  center: {
    position: 'absolute',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCount: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  goalBadge: {
    fontSize: 18,
    marginTop: spacing.xs / 2,
  },
});
