import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, type Coords } from '@/hooks/useLocation';
import { useProgressStore } from '@/stores/progressStore';
import {
  insertExplorationEvent,
  insertCheckinEvent,
  insertStoryEvent,
} from '@/db/repositories/events';
import { generateId } from '@/utils/id';
import { checkinTokenAmount, timeInAppTokenAmount, TIME_IN_APP_DAILY_CAP } from '@/game/tokens';
import { GAME_CONFIG } from '@/game/config';

function haversineM(a: Coords, b: Coords): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const ac = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.atan2(Math.sqrt(ac), Math.sqrt(1 - ac));
}

// Quantise a coordinate to a ~50 m grid cell key using 0.0005° buckets (~55 m).
function cellKey(coords: Coords): string {
  const cellLat = Math.floor(coords.lat / 0.0005);
  const cellLng = Math.floor(coords.lng / 0.0005);
  return `${cellLat}:${cellLng}`;
}

function totalPolylineDistance(polyline: Coords[]): number {
  let dist = 0;
  for (let i = 1; i < polyline.length; i++) {
    const prev = polyline[i - 1];
    const curr = polyline[i];
    if (prev && curr) dist += haversineM(prev, curr);
  }
  return dist;
}

function padTwo(n: number): string {
  return String(Math.floor(n)).padStart(2, '0');
}

export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${padTwo(m)}:${padTwo(s)}`;
}

function pickRandomDialogue(): string {
  const dialogues = GAME_CONFIG.walkEvents.dialogues;
  const idx = Math.floor(Math.random() * dialogues.length);
  return dialogues[idx] ?? dialogues[0] ?? '';
}

export interface WalkSessionStats {
  durationSeconds: number;
  distanceM: number;
  stepCount: number;
}

export interface UseWalkSessionReturn {
  isActive: boolean;
  elapsedSeconds: number;
  distanceM: number;
  currentSteps: number;
  polyline: Coords[];
  locationPermissionStatus: 'undetermined' | 'granted' | 'denied';
  start: (stepBaseline: number) => Promise<void>;
  stop: (liveStepCount: number) => Promise<WalkSessionStats>;
  notifySteps: (liveStepCount: number) => void;
  /** Called each time the user enters a new geofence cell, with the tokens awarded. */
  onNewCell?: (tokensAwarded: number) => void;
  /** Called when a random walk event fires, with the dialogue string. */
  onWalkEvent?: (dialogue: string) => void;
}

export interface UseWalkSessionOptions {
  onNewCell?: (tokensAwarded: number) => void;
  onWalkEvent?: (dialogue: string) => void;
}

export function useWalkSession(options?: UseWalkSessionOptions): UseWalkSessionReturn {
  const { startTracking, stopTracking, permissionStatus } = useLocation();
  const addTokens = useProgressStore((s) => s.addTokens);
  const timeInAppTokensToday = useProgressStore((s) => s.timeInAppTokensToday);

  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceM, setDistanceM] = useState(0);
  const [currentSteps, setCurrentSteps] = useState(0);
  const [polyline, setPolyline] = useState<Coords[]>([]);

  const polylineRef = useRef<Coords[]>([]);
  const startTimeRef = useRef<number>(0);
  const stepBaselineRef = useRef<number>(0);
  const visitedCellsRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minuteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const walkEventTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable refs for callbacks so the timers always see the latest values.
  const onNewCellRef = useRef<((tokensAwarded: number) => void) | undefined>(options?.onNewCell);
  const onWalkEventRef = useRef<((dialogue: string) => void) | undefined>(options?.onWalkEvent);
  useEffect(() => {
    onNewCellRef.current = options?.onNewCell;
    onWalkEventRef.current = options?.onWalkEvent;
  });

  // Keep a ref to the current daily token count so the minute timer callback
  // always sees the up-to-date value without needing it in the dependency array.
  const timeInAppTodayRef = useRef<number>(timeInAppTokensToday);
  useEffect(() => {
    timeInAppTodayRef.current = timeInAppTokensToday;
  }, [timeInAppTokensToday]);

  const handleNewCoords = useCallback(
    async (coords: Coords) => {
      polylineRef.current = [...polylineRef.current, coords];
      setPolyline([...polylineRef.current]);
      setDistanceM(totalPolylineDistance(polylineRef.current));

      const key = cellKey(coords);
      if (!visitedCellsRef.current.has(key)) {
        visitedCellsRef.current.add(key);
        const checkinTokens = checkinTokenAmount();
        const id = generateId();
        await insertCheckinEvent(id, coords.lat, coords.lng, {
          cellKey: key,
          tokensAwarded: checkinTokens,
        });
        await addTokens(checkinTokens);
        // Notify the walk screen so it can show the discovery toast.
        onNewCellRef.current?.(checkinTokens);
      }
    },
    [addTokens],
  );

  const start = useCallback(
    async (stepBaseline: number) => {
      polylineRef.current = [];
      visitedCellsRef.current = new Set();
      stepBaselineRef.current = stepBaseline;
      startTimeRef.current = Date.now();

      setPolyline([]);
      setDistanceM(0);
      setCurrentSteps(0);
      setElapsedSeconds(0);
      setIsActive(true);

      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Award 1 token per minute of active walk session, capped at TIME_IN_APP_DAILY_CAP.
      minuteTimerRef.current = setInterval(() => {
        if (timeInAppTodayRef.current < TIME_IN_APP_DAILY_CAP) {
          const amount = timeInAppTokenAmount();
          timeInAppTodayRef.current += amount;
          // Fire-and-forget: addTokens also persists timeInAppTokensToday via store
          addTokens(amount).catch((err) => {
            console.warn('[useWalkSession] time-in-app token award failed:', err);
          });
          // Update the persisted daily total through the store
          useProgressStore.setState((prev) => ({
            timeInAppTokensToday: prev.timeInAppTokensToday + amount,
          }));
        }
      }, 60_000);

      // Fire a random walk event every intervalMinutes minutes.
      const intervalMs = GAME_CONFIG.walkEvents.intervalMinutes * 60_000;
      walkEventTimerRef.current = setInterval(() => {
        const dialogue = pickRandomDialogue();
        onWalkEventRef.current?.(dialogue);
        // Insert a story event for the random walk encounter.
        const id = generateId();
        insertStoryEvent(id, {
          bossId: '',
          dialogueLine: dialogue,
          source: 'random_walk',
        }).catch((err) => {
          console.warn('[useWalkSession] walk event insert failed:', err);
        });
      }, intervalMs);

      await startTracking(handleNewCoords);
    },
    [startTracking, handleNewCoords, addTokens],
  );

  const stop = useCallback(
    async (liveStepCount: number): Promise<WalkSessionStats> => {
      stopTracking();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (minuteTimerRef.current) {
        clearInterval(minuteTimerRef.current);
        minuteTimerRef.current = null;
      }

      if (walkEventTimerRef.current) {
        clearInterval(walkEventTimerRef.current);
        walkEventTimerRef.current = null;
      }

      const poly = polylineRef.current;
      const distFinal = totalPolylineDistance(poly);
      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const steps = Math.max(0, liveStepCount - stepBaselineRef.current);

      if (poly.length > 0) {
        const first = poly[0]!;
        const id = generateId();
        await insertExplorationEvent(
          id,
          {
            polyline: poly,
            distanceM: distFinal,
            durationSeconds,
            stepCount: steps,
          },
          first.lat,
          first.lng,
        );
      }

      setIsActive(false);
      return { durationSeconds, distanceM: distFinal, stepCount: steps };
    },
    [stopTracking],
  );

  const notifySteps = useCallback((liveStepCount: number) => {
    setCurrentSteps(Math.max(0, liveStepCount - stepBaselineRef.current));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (minuteTimerRef.current) clearInterval(minuteTimerRef.current);
      if (walkEventTimerRef.current) clearInterval(walkEventTimerRef.current);
    };
  }, []);

  return {
    isActive,
    elapsedSeconds,
    distanceM,
    currentSteps,
    polyline,
    locationPermissionStatus: permissionStatus,
    start,
    stop,
    notifySteps,
  };
}
