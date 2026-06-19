import { useEffect } from 'react';
import { View, Text, Image, StyleSheet, type ImageSourcePropType } from 'react-native';
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

// Exported so HomeScreen and OnboardingScreen can reuse the same sources.
export const PET_IMAGES: Record<string, ImageSourcePropType> = {
  dog: require('../../assets/pet_dog.png'),
  cat: require('../../assets/pet_cat.png'),
  bird: require('../../assets/pet_bird.png'),
};

export function PetAvatar({ species, name, mood = 'normal', size = 120 }: PetAvatarProps) {
  const imageSource = PET_IMAGES[species];
  const imageSize = size * 0.85;

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
        translateY.value = withRepeat(
          withTiming(-4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        );
        break;

      case 'happy':
        scale.value = withSequence(
          withRepeat(
            withSequence(
              withTiming(1.12, { duration: 200, easing: Easing.out(Easing.ease) }),
              withTiming(1, { duration: 200, easing: Easing.in(Easing.ease) }),
            ),
            3,
            false,
          ),
          withRepeat(
            withTiming(1.04, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true,
          ),
        );
        break;

      case 'excited':
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
        {imageSource ? (
          <Image
            source={imageSource}
            style={{ width: imageSize, height: imageSize }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text style={{ fontSize: imageSize * 0.55 }}>🐾</Text>
        )}
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
  name: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
