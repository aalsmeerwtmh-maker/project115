import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PET_STATE_IMAGES, resolvePetStandImage } from '@/components/PetAvatar';
import { useEquipmentStore } from '@/stores/equipmentStore';
import type { DisplayMood } from '@/game/petMood';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

const MOOD_EMOJI: Record<DisplayMood, string> = {
  sleeping: '💤',
  eating:   '🍽️',
  walking:  '🚶',
  happy:    '😊',
  normal:   '😌',
  sad:      '😢',
  excited:  '🎉',
};

// Walk frames cycle at ~4 fps; excited frames cycle faster
const WALK_INTERVAL_MS    = 250;
const EXCITED_INTERVAL_MS = 180;

export interface PetStateDisplayProps {
  species: string;
  displayMood: DisplayMood;
  size?: number;
  /** Show emoji + label badge below the image. */
  showBadge?: boolean;
}

export function PetStateDisplay({
  species,
  displayMood,
  size = 180,
  showBadge = true,
}: PetStateDisplayProps) {
  const si = (PET_STATE_IMAGES[species] ?? PET_STATE_IMAGES['dog'])!;
  const equipped = useEquipmentStore((s) => s.equipped);
  const hasHat  = equipped.includes('hat_cozy');
  const hasSuit = equipped.includes('suit_formal');
  const imageSize = size * 0.85;

  // Frame indices for multi-frame states
  const [walkFrame,    setWalkFrame]    = useState(0);
  const [excitedFrame, setExcitedFrame] = useState(0);

  useEffect(() => {
    if (displayMood !== 'walking') { setWalkFrame(0); return; }
    const id = setInterval(() => setWalkFrame(f => (f + 1) % 3), WALK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [displayMood]);

  useEffect(() => {
    if (displayMood !== 'excited') { setExcitedFrame(0); return; }
    const id = setInterval(() => setExcitedFrame(f => (f + 1) % 3), EXCITED_INTERVAL_MS);
    return () => clearInterval(id);
  }, [displayMood]);

  // Reanimated values
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale      = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  useEffect(() => {
    cancelAnimation(translateY);
    cancelAnimation(translateX);
    cancelAnimation(scale);
    // eslint-disable-next-line react-hooks/immutability
    translateY.value = 0;
    // eslint-disable-next-line react-hooks/immutability
    translateX.value = 0;
    // eslint-disable-next-line react-hooks/immutability
    scale.value = 1;

    switch (displayMood) {
      case 'sleeping':
        // Slow breathing swell + gentle droop
        scale.value = withRepeat(
          withSequence(
            withTiming(1.04, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.0,  { duration: 2200, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        );
        translateY.value = withRepeat(
          withTiming(8, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        );
        break;

      case 'eating':
        // Rhythmic head-dip toward bowl
        translateY.value = withRepeat(
          withSequence(
            withTiming(-12, { duration: 280, easing: Easing.out(Easing.ease) }),
            withTiming(0,   { duration: 280, easing: Easing.in(Easing.ease) }),
            withTiming(0,   { duration: 320 }), // pause between dips
          ),
          -1,
          false,
        );
        break;

      case 'walking':
        // Subtle vertical bounce synced with stride sway
        translateX.value = withRepeat(
          withSequence(
            withTiming(5,  { duration: 220, easing: Easing.inOut(Easing.ease) }),
            withTiming(-5, { duration: 220, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        );
        translateY.value = withRepeat(
          withSequence(
            withTiming(-5, { duration: 220, easing: Easing.out(Easing.ease) }),
            withTiming(0,  { duration: 220, easing: Easing.in(Easing.ease) }),
          ),
          -1,
          false,
        );
        break;

      case 'excited':
        // Fast horizontal dash pulse (dog running / cat playing / bird flapping)
        translateX.value = withRepeat(
          withSequence(
            withTiming(6,  { duration: 160, easing: Easing.inOut(Easing.ease) }),
            withTiming(-6, { duration: 160, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        );
        translateY.value = withRepeat(
          withSequence(
            withTiming(-8, { duration: 160, easing: Easing.out(Easing.ease) }),
            withTiming(0,  { duration: 160, easing: Easing.in(Easing.ease) }),
          ),
          -1,
          false,
        );
        break;

      case 'happy':
        // Gentle satisfied pulse
        scale.value = withRepeat(
          withSequence(
            withTiming(1.08, { duration: 500, easing: Easing.out(Easing.ease) }),
            withTiming(1.0,  { duration: 500, easing: Easing.in(Easing.ease) }),
          ),
          -1,
          true,
        );
        break;

      case 'sad':
        // Slow mournful droop
        translateY.value = withRepeat(
          withSequence(
            withTiming(6,  { duration: 1500, easing: Easing.out(Easing.ease) }),
            withTiming(0,  { duration: 1500, easing: Easing.in(Easing.ease) }),
          ),
          -1,
          true,
        );
        break;

      default: // normal
        translateY.value = withRepeat(
          withTiming(-4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        );
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMood]);

  // Pick the correct image for the current mood + frame.
  // Stand-based moods (normal, sad, happy) use clothed variant when hat/suit is equipped;
  // animation-frame moods (walking, excited, sleeping, eating) use base frames until
  // the art director delivers clothed animation sheets.
  let imageSource: ImageSourcePropType;
  switch (displayMood) {
    case 'sleeping': imageSource = si.sleeping;                                      break;
    case 'eating':   imageSource = si.eating;                                        break;
    case 'walking':  imageSource = si.walk[walkFrame as 0 | 1 | 2]!;               break;
    case 'excited':  imageSource = si.excited[excitedFrame as 0 | 1 | 2]!;         break;
    case 'happy':    imageSource = resolvePetStandImage(species, hasHat, hasSuit); break;
    default:         imageSource = resolvePetStandImage(species, hasHat, hasSuit); break;
  }

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
        <Image
          source={imageSource}
          style={{ width: imageSize, height: imageSize }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>

      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeEmoji}>{MOOD_EMOJI[displayMood]}</Text>
          <Text style={styles.badgeLabel}>{t.mood[displayMood]}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: -4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.onBackground,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeEmoji: {
    fontSize: 13,
  },
  badgeLabel: {
    ...typography.captionBold,
    color: colors.background,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
