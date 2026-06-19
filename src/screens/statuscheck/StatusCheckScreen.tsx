import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePetStore } from '@/stores/petStore';
import { useProgressStore, useFeedActive } from '@/stores/progressStore';
import { PetStateDisplay } from '@/components/PetStateDisplay';
import { resolveDisplayMood, getTimeGreeting, type DisplayMood } from '@/game/petMood';
import { GAME_CONFIG, type FoodItem } from '@/game/config';
import { hapticReward } from '@/services/haptics';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SPECIES_BG: Record<string, string> = {
  dog: '#FFF3E0',
  cat: '#F3E5F5',
  bird: '#E3F2FD',
};

function getFoodDisplayName(id: string): string {
  const sc = t.statusCheck;
  if (id === 'food_bread') return sc.foodBread;
  if (id === 'food_milk') return sc.foodMilk;
  return sc.foodFeeds;
}

export function StatusCheckScreen() {
  const navigation = useNavigation<Nav>();
  const activePet = usePetStore((s) => s.activePet);
  const updateActivePet = usePetStore((s) => s.updateActivePet);
  const tokens = useProgressStore((s) => s.tokens);
  const spendTokens = useProgressStore((s) => s.spendTokens);
  const setFeedExpiry = useProgressStore((s) => s.setFeedExpiry);
  const feedActive = useFeedActive();

  const hour = useMemo(() => new Date().getHours(), []);
  const displayMood = useMemo<DisplayMood>(() => {
    if (!activePet) return 'normal';
    if (feedActive) return 'eating';
    return resolveDisplayMood(activePet.mood, hour);
  }, [activePet, hour, feedActive]);
  const greeting = useMemo(() => getTimeGreeting(hour), [hour]);

  const [toast, setToast] = useState<string | null>(null);
  const [feedingId, setFeedingId] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const handleFeed = useCallback(
    async (food: FoodItem) => {
      if (!activePet || feedingId) return;
      if (tokens < food.tokenCost) {
        showToast(t.statusCheck.insufficientTokens);
        return;
      }
      setFeedingId(food.id);
      try {
        await spendTokens(food.tokenCost);
        const newStamina = Math.min(100, activePet.stamina + food.staminaBoost);
        const newAffection = Math.min(100, activePet.affection + food.affectionBoost);
        await updateActivePet({ stamina: newStamina, affection: newAffection });
        await setFeedExpiry(Date.now() + GAME_CONFIG.foodMoodDurationMs);
        showToast(t.statusCheck.fedToast(activePet.name, getFoodDisplayName(food.id)));
        hapticReward();
      } catch {
        showToast(t.statusCheck.insufficientTokens);
      } finally {
        setFeedingId(null);
      }
    },
    [activePet, feedingId, tokens, spendTokens, updateActivePet, setFeedExpiry, showToast],
  );

  const petName = activePet?.name ?? 'Your pet';
  const sc = t.statusCheck;
  const speciesBg = SPECIES_BG[activePet?.species ?? ''] ?? '#FFF8E1';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{sc.title}</Text>
        <View style={styles.tokenChip}>
          <Text style={styles.tokenChipText}>🪙 {sc.tokenBalance(tokens)}</Text>
        </View>
      </View>
      <View style={styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>{sc.greeting[greeting]}</Text>

        {/* Pet state display — circle with species tint + animated pet + badge */}
        {activePet && (
          <View style={[styles.petCircle, { backgroundColor: speciesBg }]}>
            <PetStateDisplay
              species={activePet.species}
              displayMood={displayMood}
              size={200}
              showBadge
            />
          </View>
        )}

        {/* Mood message + stats */}
        <View style={styles.moodCard}>
          <Text style={styles.moodMessage}>{sc.moodMessage[displayMood](petName)}</Text>
          {activePet && (
            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Text style={styles.statLabel}>❤️ {sc.stamina}</Text>
                <Text style={styles.statValue}>{activePet.stamina}</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statLabel}>✨ {sc.affection}</Text>
                <Text style={styles.statValue}>{activePet.affection}</Text>
              </View>
            </View>
          )}
        </View>

        {toast !== null && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>{sc.feedSection(petName)}</Text>

        {GAME_CONFIG.food.map((food) => {
          const canAfford = tokens >= food.tokenCost;
          const isFeeding = feedingId === food.id;
          return (
            <View key={food.id} style={styles.foodCard}>
              <Text style={styles.foodEmoji}>{food.emoji}</Text>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{getFoodDisplayName(food.id)}</Text>
                <Text style={styles.foodStats}>
                  {sc.foodStats(food.staminaBoost, food.affectionBoost)}
                </Text>
              </View>
              <View style={styles.foodRight}>
                <Text style={styles.foodPrice}>🪙 {food.tokenCost}</Text>
                <TouchableOpacity
                  style={[styles.feedBtn, (!canAfford || isFeeding) && styles.feedBtnDisabled]}
                  onPress={() => void handleFeed(food)}
                  disabled={!canAfford || !!feedingId}
                  accessibilityRole="button"
                  accessibilityLabel={`${sc.feedButton} ${getFoodDisplayName(food.id)} for ${food.tokenCost} tokens`}
                >
                  <Text style={[styles.feedBtnText, !canAfford && styles.feedBtnTextDisabled]}>
                    {sc.feedButton}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate('Shop')}
          accessibilityRole="button"
          accessibilityLabel="Visit Shop"
        >
          <Text style={styles.shopBtnText}>{sc.visitShop} →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_SHADOW = {
  shadowColor: colors.onBackground,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.07,
  shadowRadius: 10,
  elevation: 3,
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    ...typography.heading3,
    color: colors.onBackground,
    fontWeight: '900',
  },
  tokenChip: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  tokenChipText: {
    ...typography.label,
    color: colors.onPrimaryContainer,
  },
  headerDivider: {
    height: 4,
    backgroundColor: colors.surfaceContainer,
  },

  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },

  greeting: {
    ...typography.heading2,
    color: colors.primary,
    fontWeight: '900',
    textAlign: 'center',
  },

  petCircle: {
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    ...CARD_SHADOW,
    elevation: 6,
  },

  moodCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.outlineVariant + '4D',
    ...CARD_SHADOW,
  },
  moodMessage: {
    ...typography.heading3,
    color: colors.onBackground,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statChip: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  statLabel: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  statValue: {
    ...typography.bodyBold,
    color: colors.onBackground,
  },

  toast: {
    backgroundColor: colors.onBackground,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignSelf: 'center',
  },
  toastText: {
    ...typography.label,
    color: colors.background,
    textAlign: 'center',
  },

  sectionTitle: {
    ...typography.label,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: -spacing.xs,
  },

  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.outlineVariant + '4D',
    gap: spacing.md,
    ...CARD_SHADOW,
  },
  foodEmoji: {
    fontSize: 36,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    ...typography.bodyBold,
    color: colors.onBackground,
    marginBottom: 2,
  },
  foodStats: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  foodRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  foodPrice: {
    ...typography.label,
    color: colors.primary,
  },
  feedBtn: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryDim,
  },
  feedBtnDisabled: {
    backgroundColor: colors.surfaceContainerHigh,
    borderBottomColor: colors.outlineVariant,
  },
  feedBtnText: {
    ...typography.label,
    color: colors.onPrimaryContainer,
  },
  feedBtnTextDisabled: {
    color: colors.textDisabled,
  },

  shopBtn: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.outlineVariant + '4D',
    borderBottomWidth: 4,
    borderBottomColor: colors.secondaryDim,
    marginTop: spacing.sm,
    ...CARD_SHADOW,
  },
  shopBtnText: {
    ...typography.bodyBold,
    color: colors.onSecondaryContainer,
  },
});

