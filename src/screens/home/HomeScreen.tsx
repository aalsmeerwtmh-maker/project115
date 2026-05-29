import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { usePetStore } from '@/stores/petStore';
import { useStepStore } from '@/stores/stepStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useStepCounter } from '@/hooks/useStepCounter';
import { PetAvatar } from '@/components/PetAvatar';
import { StepRing } from '@/components/StepRing';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { en } from '@/i18n/en';

type HomeNav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const activePet = usePetStore((s) => s.activePet);
  const today = useStepStore((s) => s.today);
  const { isAvailable } = useStepCounter();
  const dailyGoal = useSettingsStore((s) => s.dailyGoal);

  const steps = today?.stepCount ?? 0;
  const goal = today?.goal ?? dailyGoal;
  const goalReached = steps >= goal;
  const stepsToGo = Math.max(goal - steps, 0);

  const moodLabel = activePet ? en.mood[activePet.mood] : en.mood.normal;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={styles.heading}>PawStep</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Shop')}
            accessibilityLabel="Open Shop"
          >
            <Text style={styles.shopButtonText}>🛍</Text>
          </TouchableOpacity>
        </View>

        {activePet ? (
          <View style={styles.petSection}>
            <PetAvatar species={activePet.species} name={activePet.name} size={120} />
            <View style={styles.moodRow}>
              <Text style={styles.moodLabel}>{en.home.moodLabel}: </Text>
              <Text style={styles.moodValue}>{moodLabel}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.petSection}>
            <View style={styles.petPlaceholder}>
              <Text style={styles.petPlaceholderText}>🐾</Text>
            </View>
          </View>
        )}

        <View style={styles.ringSection}>
          <StepRing steps={steps} goal={goal} size={220} strokeWidth={16} />
        </View>

        <View style={styles.countdownCard}>
          {goalReached ? (
            <Text style={styles.goalReached}>{en.home.goalReached}</Text>
          ) : (
            <Text style={styles.stepsToGo}>{en.home.stepsToGo(stepsToGo)}</Text>
          )}
        </View>

        {!isAvailable && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{en.home.petSensor}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.heading1,
    color: colors.primary,
  },
  shopButton: {
    padding: spacing.sm,
  },
  shopButtonText: {
    fontSize: 24,
  },
  petSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  petPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petPlaceholderText: {
    fontSize: 48,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  moodLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  moodValue: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  ringSection: {
    marginVertical: spacing.lg,
  },
  countdownCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  stepsToGo: {
    ...typography.heading3,
    color: colors.textPrimary,
  },
  goalReached: {
    ...typography.heading3,
    color: colors.success,
  },
  warningBanner: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
