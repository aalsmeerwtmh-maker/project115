import { create } from 'zustand';
import { getProgress, setProgress } from '@/db/repositories/progress';

const STREAK_KEY = 'streak_current';
const TOKENS_KEY = 'tokens';
const TIME_IN_APP_TODAY_KEY = 'time_in_app_tokens_today';

interface ProgressState {
  streakCurrent: number;
  tokens: number;
  timeInAppTokensToday: number;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setStreakCurrent: (days: number) => Promise<void>;
  incrementTokens: (amount: number) => Promise<void>;
  addTokens: (amount: number) => Promise<void>;
  spendTokens: (amount: number) => Promise<void>;
  resetTimeInAppTokens: () => Promise<void>;
}

export const useProgressStore = create<ProgressState>()((set, get) => ({
  streakCurrent: 0,
  tokens: 0,
  timeInAppTokensToday: 0,
  hydrated: false,

  hydrate: async () => {
    const [streak, tokens, timeInApp] = await Promise.all([
      getProgress<number>(STREAK_KEY),
      getProgress<number>(TOKENS_KEY),
      getProgress<number>(TIME_IN_APP_TODAY_KEY),
    ]);
    set({
      streakCurrent: streak ?? 0,
      tokens: tokens ?? 0,
      timeInAppTokensToday: timeInApp ?? 0,
      hydrated: true,
    });
  },

  setStreakCurrent: async (days) => {
    set({ streakCurrent: days });
    await setProgress(STREAK_KEY, days);
  },

  incrementTokens: async (amount) => {
    const next = get().tokens + amount;
    set({ tokens: next });
    await setProgress(TOKENS_KEY, next);
  },

  addTokens: async (amount) => {
    const next = get().tokens + amount;
    set({ tokens: next });
    await setProgress(TOKENS_KEY, next);
  },

  spendTokens: async (amount) => {
    const current = get().tokens;
    if (current < amount) {
      throw new Error(`Insufficient tokens: have ${current}, need ${amount}`);
    }
    const next = current - amount;
    set({ tokens: next });
    await setProgress(TOKENS_KEY, next);
  },

  resetTimeInAppTokens: async () => {
    set({ timeInAppTokensToday: 0 });
    await setProgress(TIME_IN_APP_TODAY_KEY, 0);
  },
}));
