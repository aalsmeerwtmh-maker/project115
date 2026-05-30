import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePetStore } from '@/stores/petStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Locale } from '@/stores/settingsStore';
import { PetAvatar } from '@/components/PetAvatar';
import { GoalStepper, useGoalStepperHandlers } from '@/components/GoalStepper';
import { scheduleDailyWalkReminder, cancelDailyWalkReminder } from '@/services/notifications';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';
import type { RootStackParamList } from '@/navigation/types';

// Hours 0–23 for the quiet-hours stepper.
const HOUR_MIN = 0;
const HOUR_MAX = 23;

type ProfileNav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const activePet = usePetStore((s) => s.activePet);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const quietHoursStart = useSettingsStore((s) => s.quietHoursStart);
  const quietHoursEnd = useSettingsStore((s) => s.quietHoursEnd);
  const locale = useSettingsStore((s) => s.locale);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const setQuietHoursStart = useSettingsStore((s) => s.setQuietHoursStart);
  const setQuietHoursEnd = useSettingsStore((s) => s.setQuietHoursEnd);
  const setLocale = useSettingsStore((s) => s.setLocale);

  const { dailyGoal, decreaseGoal, increaseGoal } = useGoalStepperHandlers();

  async function handleNotificationsToggle(enabled: boolean) {
    await setNotificationsEnabled(enabled);
    if (enabled) {
      await scheduleDailyWalkReminder(quietHoursStart, quietHoursEnd);
    } else {
      await cancelDailyWalkReminder();
    }
  }

  async function handleQuietStartDecrease() {
    const next = Math.max(HOUR_MIN, quietHoursStart - 1);
    await setQuietHoursStart(next);
    if (notificationsEnabled) {
      await scheduleDailyWalkReminder(next, quietHoursEnd);
    }
  }

  async function handleQuietStartIncrease() {
    const next = Math.min(HOUR_MAX, quietHoursStart + 1);
    await setQuietHoursStart(next);
    if (notificationsEnabled) {
      await scheduleDailyWalkReminder(next, quietHoursEnd);
    }
  }

  async function handleQuietEndDecrease() {
    const next = Math.max(HOUR_MIN, quietHoursEnd - 1);
    await setQuietHoursEnd(next);
    if (notificationsEnabled) {
      await scheduleDailyWalkReminder(quietHoursStart, next);
    }
  }

  async function handleQuietEndIncrease() {
    const next = Math.min(HOUR_MAX, quietHoursEnd + 1);
    await setQuietHoursEnd(next);
    if (notificationsEnabled) {
      await scheduleDailyWalkReminder(quietHoursStart, next);
    }
  }

  function formatHour(h: number): string {
    return `${String(h).padStart(2, '0')}:00`;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{t.profile.title}</Text>

        {/* Pet roster */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.profile.petsSection}</Text>
          {activePet ? (
            <View style={styles.petRow}>
              <PetAvatar
                species={activePet.species}
                name={activePet.name}
                mood={activePet.mood}
                size={72}
              />
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{activePet.name}</Text>
                <Text style={styles.petMeta}>
                  {activePet.species.charAt(0).toUpperCase() + activePet.species.slice(1)}
                  {'  ·  '}
                  {t.profile.petStage(activePet.stage)}
                </Text>
                <Text style={styles.petGrowth}>
                  Growth: {activePet.growthValue.toFixed(1)} / 100
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>No pet yet.</Text>
          )}
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.profile.settingsSection}</Text>

          {/* Notifications toggle */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.profile.notificationsLabel}</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={(v) => void handleNotificationsToggle(v)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              accessibilityLabel={t.profile.notificationsLabel}
              accessibilityRole="switch"
            />
          </View>

          {/* Quiet hours */}
          <View style={styles.divider} />
          <Text style={styles.settingLabel}>{t.profile.quietHoursLabel}</Text>
          <View style={styles.quietHoursRow}>
            <Text style={styles.quietHoursSubLabel}>{t.profile.quietHoursStart}</Text>
            <TouchableOpacity
              style={styles.hourButton}
              onPress={() => void handleQuietStartDecrease()}
              accessibilityLabel="Decrease quiet hours start"
            >
              <Text style={styles.hourButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.hourValue}>{formatHour(quietHoursStart)}</Text>
            <TouchableOpacity
              style={styles.hourButton}
              onPress={() => void handleQuietStartIncrease()}
              accessibilityLabel="Increase quiet hours start"
            >
              <Text style={styles.hourButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quietHoursRow}>
            <Text style={styles.quietHoursSubLabel}>{t.profile.quietHoursEnd}</Text>
            <TouchableOpacity
              style={styles.hourButton}
              onPress={() => void handleQuietEndDecrease()}
              accessibilityLabel="Decrease quiet hours end"
            >
              <Text style={styles.hourButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.hourValue}>{formatHour(quietHoursEnd)}</Text>
            <TouchableOpacity
              style={styles.hourButton}
              onPress={() => void handleQuietEndIncrease()}
              accessibilityLabel="Increase quiet hours end"
            >
              <Text style={styles.hourButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Daily goal */}
          <View style={styles.divider} />
          <GoalStepper dailyGoal={dailyGoal} onDecrease={decreaseGoal} onIncrease={increaseGoal} />

          {/* Language */}
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.profile.localeLabel}</Text>
            <View style={styles.localeRow}>
              <TouchableOpacity
                style={[styles.localeButton, locale === 'en' && styles.localeButtonActive]}
                onPress={() => void setLocale('en' as Locale)}
                accessibilityLabel="Switch to English"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.localeButtonText,
                    locale === 'en' && styles.localeButtonTextActive,
                  ]}
                >
                  {t.profile.localeEn}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.localeButton, locale === 'zh-TW' && styles.localeButtonActive]}
                onPress={() => void setLocale('zh-TW' as Locale)}
                accessibilityLabel="Switch to Traditional Chinese"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.localeButtonText,
                    locale === 'zh-TW' && styles.localeButtonTextActive,
                  ]}
                >
                  {t.profile.localeZhTw}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.profile.aboutSection}</Text>
          <Text style={styles.aboutName}>{t.profile.appName}</Text>
          <Text style={styles.aboutVersion}>Version {t.profile.appVersion}</Text>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => navigation.navigate('PrivacyPolicy')}
            accessibilityRole="button"
            accessibilityLabel={t.profile.privacyPolicy}
          >
            <Text style={styles.legalLinkText}>{t.profile.privacyPolicy}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => navigation.navigate('Terms')}
            accessibilityRole="button"
            accessibilityLabel={t.profile.termsOfUse}
          >
            <Text style={styles.legalLinkText}>{t.profile.termsOfUse}</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heading: {
    ...typography.heading1,
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  petMeta: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: 2,
  },
  petGrowth: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    ...typography.body,
    color: colors.textDisabled,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  quietHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  quietHoursSubLabel: {
    ...typography.label,
    color: colors.textSecondary,
    width: 40,
  },
  hourButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  hourButtonText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  hourValue: {
    ...typography.bodyBold,
    color: colors.primary,
    minWidth: 56,
    textAlign: 'center',
  },
  localeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  localeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  localeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  localeButtonText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  localeButtonTextActive: {
    color: colors.surface,
    fontWeight: '600',
  },
  aboutName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  aboutVersion: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  legalLink: {
    paddingVertical: spacing.sm,
  },
  legalLinkText: {
    ...typography.body,
    color: colors.primary,
  },
});
