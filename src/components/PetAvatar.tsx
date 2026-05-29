import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface PetAvatarProps {
  species: string;
  name: string;
  size?: number;
}

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐶',
  cat: '🐱',
  fox: '🦊',
};

export function PetAvatar({ species, name, size = 120 }: PetAvatarProps) {
  const emoji = SPECIES_EMOJI[species] ?? '🐾';
  const emojiSize = size * 0.5;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.emoji, { fontSize: emojiSize }]}>{emoji}</Text>
      <Text style={styles.name} numberOfLines={1}>
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
