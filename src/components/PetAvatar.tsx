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
import { useEquipmentStore } from '@/stores/equipmentStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface PetAvatarProps {
  species: string;
  name: string;
  mood?: 'happy' | 'normal' | 'sad' | 'excited';
  size?: number;
}

// Default (standing) image per species — used by PetAvatar, species picker,
// header thumbnail, onboarding, and profile.
export const PET_IMAGES: Record<string, ImageSourcePropType> = {
  dog:  require('../../assets/pet_dog_stand.png'),
  cat:  require('../../assets/pet_cat_stand.png'),
  bird: require('../../assets/pet_bird_stand.png'),
};

// Mood-specific image registry.
// walk / excited are 3-slot tuples for frame-cycling in PetStateDisplay.
// Dog walk_3 repeats walk_1 (only 2 walk frames available).
// Bird fly_3 repeats fly_1; bird jump_3 repeats jump_1.
// Bird has no sleeping image — falls back to stand.
// Dog has no specific happy image — falls back to stand.
export const PET_STATE_IMAGES: Record<
  string,
  {
    stand:    ImageSourcePropType;
    eating:   ImageSourcePropType;
    sleeping: ImageSourcePropType;
    walk:     readonly [ImageSourcePropType, ImageSourcePropType, ImageSourcePropType];
    excited:  readonly [ImageSourcePropType, ImageSourcePropType, ImageSourcePropType];
    happy:    ImageSourcePropType;
  }
> = {
  dog: {
    stand:    require('../../assets/pet_dog_stand.png'),
    eating:   require('../../assets/pet_dog_eating.png'),
    sleeping: require('../../assets/pet_dog_sleeping.png'),
    walk: [
      require('../../assets/pet_dog_walk_1.png'),
      require('../../assets/pet_dog_walk_2.png'),
      require('../../assets/pet_dog_walk_1.png'), // no walk_3 — mirror walk_1
    ],
    excited: [
      require('../../assets/pet_dog_run_1.png'),
      require('../../assets/pet_dog_run_2.png'),
      require('../../assets/pet_dog_run_3.png'),
    ],
    happy: require('../../assets/pet_dog_stand.png'), // no dedicated happy pose
  },
  cat: {
    stand:    require('../../assets/pet_cat_stand.png'),
    eating:   require('../../assets/pet_cat_eating.png'),
    sleeping: require('../../assets/pet_cat_sleeping.png'),
    walk: [
      require('../../assets/pet_cat_walk_1.png'),
      require('../../assets/pet_cat_walk_2.png'),
      require('../../assets/pet_cat_walk_3.png'),
    ],
    excited: [
      require('../../assets/pet_cat_excited.png'),
      require('../../assets/pet_cat_excited.png'),
      require('../../assets/pet_cat_excited.png'),
    ],
    happy: require('../../assets/pet_cat_happy.png'), // licking paw
  },
  bird: {
    stand:    require('../../assets/pet_bird_stand.png'),
    eating:   require('../../assets/pet_bird_eating.png'), // pecking seeds
    sleeping: require('../../assets/pet_bird_sleeping.png'),
    walk: [
      require('../../assets/pet_bird_fly_1.png'), // wings down
      require('../../assets/pet_bird_fly_2.png'), // wings up
      require('../../assets/pet_bird_fly_1.png'), // cycle back
    ],
    excited: [
      require('../../assets/pet_bird_jump_1.png'),
      require('../../assets/pet_bird_jump_2.png'),
      require('../../assets/pet_bird_jump_1.png'),
    ],
    happy: require('../../assets/pet_bird_jump_1.png'), // wings spread = happy
  },
};

// Clothes stand-pose variants — art director replaces placeholder PNGs in assets/clothes/
const CLOTHES_STAND_IMAGES: Record<string, {
  hat:     ImageSourcePropType;
  suit:    ImageSourcePropType;
  hat_suit: ImageSourcePropType;
}> = {
  dog: {
    hat:      require('../../assets/clothes/pet_dog_hat.png'),
    suit:     require('../../assets/clothes/pet_dog_suit.png'),
    hat_suit: require('../../assets/clothes/pet_dog_hat_suit.png'),
  },
  cat: {
    hat:      require('../../assets/clothes/pet_cat_hat.png'),
    suit:     require('../../assets/clothes/pet_cat_suit.png'),
    hat_suit: require('../../assets/clothes/pet_cat_hat_suit.png'),
  },
  bird: {
    hat:      require('../../assets/clothes/pet_bird_hat.png'),
    suit:     require('../../assets/clothes/pet_bird_suit.png'),
    hat_suit: require('../../assets/clothes/pet_bird_hat_suit.png'),
  },
};

export function resolvePetStandImage(
  species: string,
  hasHat: boolean,
  hasSuit: boolean,
): ImageSourcePropType {
  const base = PET_IMAGES[species] ?? PET_IMAGES.dog!;
  if (!hasHat && !hasSuit) return base;
  const clothes = CLOTHES_STAND_IMAGES[species] ?? CLOTHES_STAND_IMAGES.dog!;
  if (hasHat && hasSuit) return clothes.hat_suit;
  if (hasHat) return clothes.hat;
  return clothes.suit;
}

export function PetAvatar({ species, name, mood = 'normal', size = 120 }: PetAvatarProps) {
  const equipped = useEquipmentStore((s) => s.equipped);
  const imageSource = resolvePetStandImage(
    species,
    equipped.includes('hat_cozy'),
    equipped.includes('suit_formal'),
  );
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
    <View style={styles.wrapper} accessibilityLabel={`${name} the ${species}, feeling ${mood}`}>
      <View
        style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
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
      </View>
      <Text style={styles.name} numberOfLines={1} allowFontScaling>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
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
    marginTop: 4,
  },
});
