import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface PetAvatarProps {
  species: string;
  name: string;
  mood?: 'happy' | 'normal' | 'sad' | 'excited';
  size?: number;
}

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐶',
  cat: '🐱',
  fox: '🦊',
};

export function PetAvatar({ species, name, mood = 'normal', size = 120 }: PetAvatarProps) {
  const emoji = SPECIES_EMOJI[species] ?? '🐾';
  const emojiSize = size * 0.5;

  // Shared animation values.
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotateZ = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotateZ.value}deg` },
    ],
  }));

  useEffect(() => {
    // Cancel any running animations before starting a new one.
    cancelAnimation(translateY);
    cancelAnimation(scale);
    cancelAnimation(rotateZ);

    // eslint-disable-next-line react-hooks/immutability
    translateY.value = 0;
    // eslint-disable-next-line react-hooks/immutability
    scale.value = 1;
    // eslint-disable-next-line react-hooks/immutability
    rotateZ.value = 0;

    switch (mood) {
      case 'normal':
        // Gentle vertical float ±4 dp over 2 s, loops forever.
        translateY.value = withRepeat(
          withTiming(-4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        );
        break;

      case 'happy':
        // Scale 1 → 1.12 → 1 over 0.4 s, repeat 3×, then idle.
        scale.value = withSequence(
          withRepeat(
            withSequence(
              withTiming(1.12, { duration: 200, easing: Easing.out(Easing.ease) }),
              withTiming(1, { duration: 200, easing: Easing.in(Easing.ease) }),
            ),
            3,
            false,
          ),
          // After 3 bounces, settle into a gentle float.
          withRepeat(
            withTiming(1.04, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true,
          ),
        );
        break;

      case 'excited':
        // rotateZ ±5° over 0.15 s, repeat 6×, then idle.
        rotateZ.value = withSequence(
          withRepeat(
            withSequence(
              withTiming(5, { duration: 75, easing: Easing.linear }),
              withTiming(-5, { duration: 75, easing: Easing.linear }),
            ),
            6,
            false,
          ),
          withTiming(0, { duration: 100 }),
        );
        break;

      case 'sad':
        // Slow translateY +6 dp over 1.5 s, hold, back, repeat.
        translateY.value = withRepeat(
          withSequence(
            withTiming(6, { duration: 1500, easing: Easing.out(Easing.ease) }),
            withTiming(6, { duration: 500 }),
            withTiming(0, { duration: 1500, easing: Easing.in(Easing.ease) }),
            withTiming(0, { duration: 500 }),
          ),
          -1,
          false,
        );
        break;

      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood]);

  return (
    <View
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityLabel={`${name} the ${species}, feeling ${mood}`}
    >
      <Animated.View style={animatedStyle}>
        <Text style={[styles.emoji, { fontSize: emojiSize }]} allowFontScaling>
          {emoji}
        </Text>
      </Animated.View>
      <Text style={styles.name} numberOfLines={1} allowFontScaling>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emoji: {
    lineHeight: undefined,
  },
  name: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
