import { create } from 'zustand';
import { getProgress, setProgress } from '@/db/repositories/progress';

const STREAK_KEY = 'streak_current';
const TOKENS_KEY = 'tokens';

interface ProgressState {
  streakCurrent: number;
  tokens: number;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setStreakCurrent: (days: number) => Promise<void>;
  incrementTokens: (amount: number) => Promise<void>;
  addTokens: (amount: number) => Promise<void>;
}

export const useProgressStore = create<ProgressState>()((set, get) => ({
  streakCurrent: 0,
  tokens: 0,
  hydrated: false,

  hydrate: async () => {
    const [streak, tokens] = await Promise.all([
      getProgress<number>(STREAK_KEY),
      getProgress<number>(TOKENS_KEY),
    ]);
    set({
      streakCurrent: streak ?? 0,
      tokens: tokens ?? 0,
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
}));
