import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { getProgress, setProgress } from '@/db/repositories/progress';

const STREAK_KEY = 'streak_current';
const TOKENS_KEY = 'tokens';
const TIME_IN_APP_TODAY_KEY = 'time_in_app_tokens_today';
const FEED_EXPIRES_AT_KEY = 'feed_expires_at';

interface ProgressState {
  streakCurrent: number;
  tokens: number;
  timeInAppTokensToday: number;
  feedExpiresAt: number | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setStreakCurrent: (days: number) => Promise<void>;
  incrementTokens: (amount: number) => Promise<void>;
  addTokens: (amount: number) => Promise<void>;
  spendTokens: (amount: number) => Promise<void>;
  resetTimeInAppTokens: () => Promise<void>;
  setFeedExpiry: (expiresAt: number) => Promise<void>;
}

export const useProgressStore = create<ProgressState>()((set, get) => ({
  streakCurrent: 0,
  tokens: 0,
  timeInAppTokensToday: 0,
  feedExpiresAt: null,
  hydrated: false,

  hydrate: async () => {
    const [streak, tokens, timeInApp, feedExpiresAt] = await Promise.all([
      getProgress<number>(STREAK_KEY),
      getProgress<number>(TOKENS_KEY),
      getProgress<number>(TIME_IN_APP_TODAY_KEY),
      getProgress<number>(FEED_EXPIRES_AT_KEY),
    ]);
    set({
      streakCurrent: streak ?? 0,
      tokens: tokens ?? 0,
      timeInAppTokensToday: timeInApp ?? 0,
      // Only restore if the timer hasn't already expired.
      feedExpiresAt: feedExpiresAt && feedExpiresAt > Date.now() ? feedExpiresAt : null,
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

  setFeedExpiry: async (expiresAt) => {
    set({ feedExpiresAt: expiresAt });
    await setProgress(FEED_EXPIRES_AT_KEY, expiresAt);
  },
}));

/**
 * Returns true while the post-feed eating display mood is still active.
 * Automatically flips to false when the timer expires, triggering a re-render.
 */
export function useFeedActive(): boolean {
  const feedExpiresAt = useProgressStore((s) => s.feedExpiresAt);
  const [active, setActive] = useState(() =>
    feedExpiresAt != null && feedExpiresAt > Date.now(),
  );

  useEffect(() => {
    if (!feedExpiresAt || feedExpiresAt <= Date.now()) {
      setActive(false);
      return;
    }
    setActive(true);
    const remaining = feedExpiresAt - Date.now();
    const timer = setTimeout(() => setActive(false), remaining);
    return () => clearTimeout(timer);
  }, [feedExpiresAt]);

  return active;
}
