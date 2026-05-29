import { useEffect, useRef, useCallback } from 'react';
import * as Pedometer from 'expo-sensors/build/Pedometer';
import { Accelerometer } from 'expo-sensors';
import type { AccelerometerMeasurement } from 'expo-sensors/build/Accelerometer';
import { useStepStore } from '@/stores/stepStore';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { upsertStepDay } from '@/db/repositories/steps';
import { computeDailyGrowth } from '@/game/growthFormula';

// Anti-cheat: ignore a pedometer delta if it would imply more than this many
// steps per minute since the last update.
const MAX_STEPS_PER_MINUTE = 200;

// Accelerometer magnitude above this threshold (in g) indicates the device is
// being shaken or transported (vehicle, pocket toss) — step deltas during these
// windows are discarded.
const NOISE_THRESHOLD_G = 3.0;

// How often to flush accumulated steps to the database (milliseconds).
const SNAPSHOT_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

function todayDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function magnitude(reading: AccelerometerMeasurement): number {
  return Math.sqrt(reading.x ** 2 + reading.y ** 2 + reading.z ** 2);
}

export function useStepCounter() {
  const setToday = useStepStore((s) => s.setToday);
  const setIsAvailable = useStepStore((s) => s.setIsAvailable);
  const streakCurrent = useProgressStore((s) => s.streakCurrent);
  const dailyGoal = useSettingsStore((s) => s.dailyGoal);

  // Mutable refs — never cause re-renders, safe to mutate inside subscriptions.
  const accNoisy = useRef(false);
  const pendingSteps = useRef(0);
  const lastPedometerSteps = useRef<number | null>(null);
  const lastPedometerTime = useRef<number | null>(null);
  const lastSnapshotTime = useRef<number>(0);
  const totalStepsRef = useRef(0);

  const streakRef = useRef(streakCurrent);
  const goalRef = useRef(dailyGoal);

  useEffect(() => {
    streakRef.current = streakCurrent;
  }, [streakCurrent]);

  useEffect(() => {
    goalRef.current = dailyGoal;
  }, [dailyGoal]);

  const flush = useCallback(async () => {
    const date = todayDate();
    const steps = totalStepsRef.current;
    const growth = computeDailyGrowth({
      stepCount: steps,
      dailyGoal: goalRef.current,
      consecutiveStreakDays: streakRef.current,
    });
    const row = await upsertStepDay(date, {
      stepCount: steps,
      foodEarned: growth.foodEarned,
      goal: goalRef.current,
    });
    setToday(row);
  }, [setToday]);

  useEffect(() => {
    let pedometerSub: ReturnType<typeof Pedometer.watchStepCount> | null = null;
    let accSub: ReturnType<typeof Accelerometer.addListener> | null = null;
    let snapshotTimer: ReturnType<typeof setInterval> | null = null;
    let mounted = true;

    async function init() {
      const available = await Pedometer.isAvailableAsync();
      if (!mounted) return;
      setIsAvailable(available);
      if (!available) return;

      const permission = await Pedometer.requestPermissionsAsync();
      if (!mounted || permission.status !== 'granted') return;

      // Subscribe to accelerometer to detect noise windows.
      Accelerometer.setUpdateInterval(500);
      accSub = Accelerometer.addListener((reading: AccelerometerMeasurement) => {
        accNoisy.current = magnitude(reading) > NOISE_THRESHOLD_G;
      });

      // Subscribe to pedometer cumulative step updates.
      pedometerSub = Pedometer.watchStepCount((result) => {
        if (!mounted) return;

        const now = Date.now();
        const incomingSteps = result.steps;

        if (lastPedometerSteps.current === null || lastPedometerTime.current === null) {
          lastPedometerSteps.current = incomingSteps;
          lastPedometerTime.current = now;
          return;
        }

        const delta = incomingSteps - lastPedometerSteps.current;
        const elapsedMs = now - lastPedometerTime.current;

        if (delta <= 0) {
          // Pedometer reset (e.g. midnight rollover) — re-anchor.
          lastPedometerSteps.current = incomingSteps;
          lastPedometerTime.current = now;
          return;
        }

        // Anti-cheat: cap implausible step rate.
        const elapsedMinutes = Math.max(elapsedMs / 60_000, 1 / 60);
        const stepsPerMinute = delta / elapsedMinutes;
        if (stepsPerMinute > MAX_STEPS_PER_MINUTE) {
          lastPedometerSteps.current = incomingSteps;
          lastPedometerTime.current = now;
          return;
        }

        // Anti-cheat: reject during high-noise window.
        if (accNoisy.current) {
          lastPedometerSteps.current = incomingSteps;
          lastPedometerTime.current = now;
          return;
        }

        totalStepsRef.current += delta;
        pendingSteps.current += delta;
        lastPedometerSteps.current = incomingSteps;
        lastPedometerTime.current = now;
      });

      // Hourly snapshot to DB.
      snapshotTimer = setInterval(async () => {
        if (!mounted) return;
        lastSnapshotTime.current = Date.now();
        await flush();
      }, SNAPSHOT_INTERVAL_MS);

      // Load today's existing row so the UI is immediately accurate.
      await flush();
    }

    init().catch(() => {
      /* permissions denied or sensor unavailable — silently degrade */
    });

    return () => {
      mounted = false;
      pedometerSub?.remove();
      accSub?.remove();
      if (snapshotTimer) clearInterval(snapshotTimer);
    };
  }, [flush, setIsAvailable]);

  const today = useStepStore((s) => s.today);
  const isAvailable = useStepStore((s) => s.isAvailable);

  return { today, isAvailable };
}
