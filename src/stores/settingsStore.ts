import { create } from 'zustand';
import { getProgress, setProgress } from '@/db/repositories/progress';

const NOTIFICATIONS_KEY = 'settings_notifications_enabled';
const DAILY_GOAL_KEY = 'settings_daily_goal';

// Daily goal stops: 4000, 5000, 6000, 7000, 8000, 9000, 10000
export const DAILY_GOAL_STOPS = [4000, 5000, 6000, 7000, 8000, 9000, 10000] as const;
export type DailyGoal = (typeof DAILY_GOAL_STOPS)[number];

const DEFAULT_DAILY_GOAL: DailyGoal = 8000;

interface SettingsState {
  notificationsEnabled: boolean;
  dailyGoal: DailyGoal;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setDailyGoal: (goal: DailyGoal) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  notificationsEnabled: true,
  dailyGoal: DEFAULT_DAILY_GOAL,
  hydrated: false,

  hydrate: async () => {
    const [notifications, goal] = await Promise.all([
      getProgress<boolean>(NOTIFICATIONS_KEY),
      getProgress<DailyGoal>(DAILY_GOAL_KEY),
    ]);
    set({
      notificationsEnabled: notifications ?? true,
      dailyGoal: goal ?? DEFAULT_DAILY_GOAL,
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
}));
