import { create } from 'zustand';
import { getProgress, setProgress } from '@/db/repositories/progress';

const NOTIFICATIONS_KEY = 'settings_notifications_enabled';
const DAILY_GOAL_KEY = 'settings_daily_goal';
const QUIET_HOURS_START_KEY = 'settings_quiet_hours_start';
const QUIET_HOURS_END_KEY = 'settings_quiet_hours_end';
const LOCALE_KEY = 'settings_locale';

// Daily goal stops: 4000, 5000, 6000, 7000, 8000, 9000, 10000
export const DAILY_GOAL_STOPS = [4000, 5000, 6000, 7000, 8000, 9000, 10000] as const;
export type DailyGoal = (typeof DAILY_GOAL_STOPS)[number];

export type Locale = 'en' | 'zh-TW';

const DEFAULT_DAILY_GOAL: DailyGoal = 8000;
const DEFAULT_QUIET_HOURS_START = 22;
const DEFAULT_QUIET_HOURS_END = 7;
const DEFAULT_LOCALE: Locale = 'en';

interface SettingsState {
  notificationsEnabled: boolean;
  dailyGoal: DailyGoal;
  quietHoursStart: number;
  quietHoursEnd: number;
  locale: Locale;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setDailyGoal: (goal: DailyGoal) => Promise<void>;
  setQuietHoursStart: (hour: number) => Promise<void>;
  setQuietHoursEnd: (hour: number) => Promise<void>;
  setLocale: (locale: Locale) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  notificationsEnabled: true,
  dailyGoal: DEFAULT_DAILY_GOAL,
  quietHoursStart: DEFAULT_QUIET_HOURS_START,
  quietHoursEnd: DEFAULT_QUIET_HOURS_END,
  locale: DEFAULT_LOCALE,
  hydrated: false,

  hydrate: async () => {
    const [notifications, goal, quietStart, quietEnd, locale] = await Promise.all([
      getProgress<boolean>(NOTIFICATIONS_KEY),
      getProgress<DailyGoal>(DAILY_GOAL_KEY),
      getProgress<number>(QUIET_HOURS_START_KEY),
      getProgress<number>(QUIET_HOURS_END_KEY),
      getProgress<Locale>(LOCALE_KEY),
    ]);
    set({
      notificationsEnabled: notifications ?? true,
      dailyGoal: goal ?? DEFAULT_DAILY_GOAL,
      quietHoursStart: quietStart ?? DEFAULT_QUIET_HOURS_START,
      quietHoursEnd: quietEnd ?? DEFAULT_QUIET_HOURS_END,
      locale: locale ?? DEFAULT_LOCALE,
      hydrated: true,
    });
  },

  setNotificationsEnabled: async (enabled) => {
    set({ notificationsEnabled: enabled });
    await setProgress(NOTIFICATIONS_KEY, enabled);
  },

  setDailyGoal: async (goal) => {
    set({ dailyGoal: goal });
    await setProgress(DAILY_GOAL_KEY, goal);
  },

  setQuietHoursStart: async (hour) => {
    set({ quietHoursStart: hour });
    await setProgress(QUIET_HOURS_START_KEY, hour);
  },

  setQuietHoursEnd: async (hour) => {
    set({ quietHoursEnd: hour });
    await setProgress(QUIET_HOURS_END_KEY, hour);
  },

  setLocale: async (locale) => {
    set({ locale });
    await setProgress(LOCALE_KEY, locale);
  },
}));
