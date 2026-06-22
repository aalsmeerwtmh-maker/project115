import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { getProgress, setProgress } from '@/db/repositories/progress';
import { TIME_IN_APP_DAILY_CAP, timeInAppTokenAmount } from '@/game/tokens';

const STREAK_KEY = 'streak_current';
const TOKENS_KEY = 'tokens';
const TIME_IN_APP_TODAY_KEY = 'time_in_app_tokens_today';
const TIME_IN_APP_DATE_KEY = 'time_in_app_date';
const FEED_EXPIRES_AT_KEY = 'feed_expires_at';
const MANUAL_BOSS_COUNT_KEY = 'manual_boss_count_today';
const MANUAL_BOSS_DATE_KEY = 'manual_boss_date';
const MANUAL_BOSS_LAST_AT_KEY = 'manual_boss_last_at';

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface ProgressState {
  streakCurrent: number;
  tokens: number;
  timeInAppTokensToday: number;
  timeInAppDate: string;
  feedExpiresAt: number | null;
  manualBossCountToday: number;
  manualBossDate: string;
  manualBossLastAt: number;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setStreakCurrent: (days: number) => Promise<void>;
  incrementTokens: (amount: number) => Promise<void>;
  addTokens: (amount: number) => Promise<void>;
  spendTokens: (amount: number) => Promise<void>;
  /** Awards one minute's time-in-app token if under the daily cap. Persists count + day. */
  awardTimeInAppToken: () => Promise<void>;
  resetTimeInAppTokens: () => Promise<void>;
  setFeedExpiry: (expiresAt: number) => Promise<void>;
  recordManualBossFight: () => Promise<void>;
}

export const useProgressStore = create<ProgressState>()((set, get) => ({
  streakCurrent: 0,
  tokens: 0,
  timeInAppTokensToday: 0,
  timeInAppDate: '',
  feedExpiresAt: null,
  manualBossCountToday: 0,
  manualBossDate: '',
  manualBossLastAt: 0,
  hydrated: false,

  hydrate: async () => {
    const [
      streak,
      tokens,
      timeInApp,
      timeInAppDate,
      feedExpiresAt,
      manualCount,
      manualDate,
      manualLastAt,
    ] = await Promise.all([
      getProgress<number>(STREAK_KEY),
      getProgress<number>(TOKENS_KEY),
      getProgress<number>(TIME_IN_APP_TODAY_KEY),
      getProgress<string>(TIME_IN_APP_DATE_KEY),
      getProgress<number>(FEED_EXPIRES_AT_KEY),
      getProgress<number>(MANUAL_BOSS_COUNT_KEY),
      getProgress<string>(MANUAL_BOSS_DATE_KEY),
      getProgress<number>(MANUAL_BOSS_LAST_AT_KEY),
    ]);
    const today = todayString();
    const isNewBossDay = manualDate !== today;
    const isNewTimeInAppDay = timeInAppDate !== today;
    const writes: Promise<void>[] = [];
    if (isNewBossDay) {
      writes.push(setProgress(MANUAL_BOSS_COUNT_KEY, 0), setProgress(MANUAL_BOSS_DATE_KEY, today));
    }
    if (isNewTimeInAppDay) {
      writes.push(setProgress(TIME_IN_APP_TODAY_KEY, 0), setProgress(TIME_IN_APP_DATE_KEY, today));
    }
    if (writes.length > 0) await Promise.all(writes);
    set({
      streakCurrent: streak ?? 0,
      tokens: tokens ?? 0,
      timeInAppTokensToday: isNewTimeInAppDay ? 0 : (timeInApp ?? 0),
      timeInAppDate: today,
      feedExpiresAt: feedExpiresAt && feedExpiresAt > Date.now() ? feedExpiresAt : null,
      manualBossCountToday: isNewBossDay ? 0 : (manualCount ?? 0),
      manualBossDate: today,
      manualBossLastAt: manualLastAt ?? 0,
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

  awardTimeInAppToken: async () => {
    const today = todayString();
    // Roll the counter over at local midnight so a session spanning days resets.
    const count = get().timeInAppDate === today ? get().timeInAppTokensToday : 0;
    if (count >= TIME_IN_APP_DAILY_CAP) {
      if (get().timeInAppDate !== today) {
        set({ timeInAppTokensToday: 0, timeInAppDate: today });
        await Promise.all([
          setProgress(TIME_IN_APP_TODAY_KEY, 0),
          setProgress(TIME_IN_APP_DATE_KEY, today),
        ]);
      }
      return;
    }
    const amount = timeInAppTokenAmount();
    const nextCount = count + amount;
    const nextTokens = get().tokens + amount;
    set({ tokens: nextTokens, timeInAppTokensToday: nextCount, timeInAppDate: today });
    await Promise.all([
      setProgress(TOKENS_KEY, nextTokens),
      setProgress(TIME_IN_APP_TODAY_KEY, nextCount),
      setProgress(TIME_IN_APP_DATE_KEY, today),
    ]);
  },

  resetTimeInAppTokens: async () => {
    set({ timeInAppTokensToday: 0, timeInAppDate: todayString() });
    await Promise.all([
      setProgress(TIME_IN_APP_TODAY_KEY, 0),
      setProgress(TIME_IN_APP_DATE_KEY, todayString()),
    ]);
  },

  setFeedExpiry: async (expiresAt) => {
    set({ feedExpiresAt: expiresAt });
    await setProgress(FEED_EXPIRES_AT_KEY, expiresAt);
  },

  recordManualBossFight: async () => {
    const today = todayString();
    const currentDate = get().manualBossDate;
    const currentCount = currentDate === today ? get().manualBossCountToday : 0;
    const nextCount = currentCount + 1;
    const now = Date.now();
    set({ manualBossCountToday: nextCount, manualBossDate: today, manualBossLastAt: now });
    await Promise.all([
      setProgress(MANUAL_BOSS_COUNT_KEY, nextCount),
      setProgress(MANUAL_BOSS_DATE_KEY, today),
      setProgress(MANUAL_BOSS_LAST_AT_KEY, now),
    ]);
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
