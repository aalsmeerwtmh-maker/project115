import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import type { RootStackParamList } from '@/navigation/types';
import { usePetStore } from '@/stores/petStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { DailyGoal } from '@/stores/settingsStore';
import { GoalStepper, useGoalStepperHandlers } from '@/components/GoalStepper';
import { PetAvatar } from '@/components/PetAvatar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { requestNotificationPermission } from '@/services/notifications';
import { setProgress } from '@/db/repositories/progress';
import { insertPet } from '@/db/repositories/pets';
import { generateId } from '@/utils/id';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

type Species = 'dog' | 'cat' | 'bird';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_PAGES = 5;

type OnboardingNav = NativeStackNavigationProp<RootStackParamList>;

const SPECIES_OPTIONS: Species[] = ['dog', 'cat', 'bird'];

function getSpeciesName(species: Species): string {
  if (species === 'dog') return t.onboarding.dogName;
  if (species === 'cat') return t.onboarding.catName;
  return t.onboarding.birdName;
}

export function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNav>();
  const { setActivePet } = usePetStore();
  const dailyGoal = useSettingsStore((s) => s.dailyGoal);

  const [page, setPage] = useState(0);
  const [selectedSpecies, setSelectedSpecies] = useState<Species>('dog');
  const [petName, setPetName] = useState('');
  const [finishing, setFinishing] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const { decreaseGoal, increaseGoal } = useGoalStepperHandlers();

  function scrollToPage(index: number) {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setPage(index);
  }

  function handleNext() {
    if (page < TOTAL_PAGES - 1) {
      scrollToPage(page + 1);
    }
  }

  function handleSkip() {
    scrollToPage(TOTAL_PAGES - 1);
  }

  async function handleAllowNotifications() {
    await requestNotificationPermission();
  }

  async function handleAllowLocation() {
    await Location.requestForegroundPermissionsAsync();
  }

  async function handleAllowMotion() {
    await Pedometer.requestPermissionsAsync();
  }

  const handleFinish = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      const now = Date.now();
      const name = petName.trim() || getSpeciesName(selectedSpecies);
      const id = generateId();
      const pet = await insertPet({
        id,
        name,
        species: selectedSpecies,
        stage: 'baby',
        stamina: 50,
        affection: 0,
        growthValue: 0,
        mood: 'normal',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      setActivePet(pet);
      await setProgress('onboarding_complete', true);
      navigation.replace('Main');
    } catch {
      setFinishing(false);
    }
  }, [finishing, petName, selectedSpecies, setActivePet, navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
      >
        {/* Page 1 — Welcome */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <Text style={styles.bigEmoji}>🐾</Text>
          <Text style={styles.pageTitle}>PawStep</Text>
          <Text style={styles.pageBody}>{t.onboarding.welcome}</Text>
          <View style={styles.navRow}>
            <PrimaryButton label={t.onboarding.next} onPress={handleNext} />
          </View>
        </View>

        {/* Page 2 — Choose pet */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <Text style={styles.pageTitle}>{t.onboarding.chooseSpecies}</Text>
          <View style={styles.speciesRow}>
            {SPECIES_OPTIONS.map((species) => (
              <TouchableOpacity
                key={species}
                style={[
                  styles.speciesCard,
                  selectedSpecies === species && styles.speciesCardActive,
                ]}
                onPress={() => setSelectedSpecies(species)}
                accessibilityRole="button"
                accessibilityLabel={getSpeciesName(species)}
                accessibilityState={{ selected: selectedSpecies === species }}
              >
                <PetAvatar
                  species={species}
                  name={getSpeciesName(species)}
                  mood="happy"
                  size={80}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.nameInput}
            value={petName}
            onChangeText={setPetName}
            placeholder={getSpeciesName(selectedSpecies)}
            placeholderTextColor={colors.textDisabled}
            maxLength={20}
            accessibilityLabel="Pet name"
          />
          <View style={styles.navRow}>
            <PrimaryButton label={t.onboarding.next} onPress={handleNext} />
          </View>
        </View>

        {/* Page 3 — Set daily goal */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <Text style={styles.pageTitle}>{t.onboarding.setGoal}</Text>
          <View style={styles.goalStepperWrapper}>
            <GoalStepper
              dailyGoal={dailyGoal as DailyGoal}
              onDecrease={decreaseGoal}
              onIncrease={increaseGoal}
            />
          </View>
          <View style={styles.navRow}>
            <PrimaryButton label={t.onboarding.next} onPress={handleNext} />
          </View>
        </View>

        {/* Page 4 — Permissions priming */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <Text style={styles.pageTitle}>{t.onboarding.permissionsTitle}</Text>
          <Text style={styles.pageBody}>{t.onboarding.permissionsBody}</Text>
          <View style={styles.permissionsBlock}>
            <PrimaryButton
              label={t.onboarding.allowNotifications}
              onPress={() => void handleAllowNotifications()}
            />
            <PrimaryButton
              label={t.onboarding.allowLocation}
              onPress={() => void handleAllowLocation()}
            />
            <PrimaryButton
              label={t.onboarding.allowMotion}
              onPress={() => void handleAllowMotion()}
            />
          </View>
          <View style={styles.navRow}>
            <TouchableOpacity onPress={handleSkip} accessibilityRole="button">
              <Text style={styles.skipText}>{t.onboarding.skip}</Text>
            </TouchableOpacity>
            <PrimaryButton label={t.onboarding.next} onPress={handleNext} />
          </View>
        </View>

        {/* Page 5 — All set */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <Text style={styles.bigEmoji}>🎉</Text>
          <Text style={styles.pageTitle}>All set!</Text>
          <View style={styles.navRow}>
            <PrimaryButton
              label={t.onboarding.finish}
              onPress={() => void handleFinish()}
              loading={finishing}
            />
          </View>
        </View>
      </ScrollView>

      {/* Page dots indicator */}
      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_PAGES }, (_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  bigEmoji: {
    fontSize: 64,
  },
  pageTitle: {
    ...typography.heading1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  pageBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  speciesRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  speciesCard: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.sm,
    backgroundColor: colors.surface,
  },
  speciesCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  nameInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    textAlign: 'center',
  },
  goalStepperWrapper: {
    width: '100%',
  },
  permissionsBlock: {
    width: '100%',
    gap: spacing.sm,
  },
  navRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  skipText: {
    ...typography.label,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.4 }],
  },
});
