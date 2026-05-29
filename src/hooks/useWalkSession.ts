import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, type Coords } from '@/hooks/useLocation';
import { useProgressStore } from '@/stores/progressStore';
import { insertExplorationEvent, insertCheckinEvent } from '@/db/repositories/events';
import { generateId } from '@/utils/id';

const CHECKIN_TOKENS = 5;

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

export interface UseWalkSessionReturn {
  isActive: boolean;
  elapsedSeconds: number;
  distanceM: number;
  currentSteps: number;
  polyline: Coords[];
  locationPermissionStatus: 'undetermined' | 'granted' | 'denied';
  start: (stepBaseline: number) => Promise<void>;
  stop: (liveStepCount: number) => Promise<void>;
  notifySteps: (liveStepCount: number) => void;
}

export function useWalkSession(): UseWalkSessionReturn {
  const { startTracking, stopTracking, permissionStatus } = useLocation();
  const addTokens = useProgressStore((s) => s.addTokens);

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

  const handleNewCoords = useCallback(
    async (coords: Coords) => {
      polylineRef.current = [...polylineRef.current, coords];
      setPolyline([...polylineRef.current]);
      setDistanceM(totalPolylineDistance(polylineRef.current));

      const key = cellKey(coords);
      if (!visitedCellsRef.current.has(key)) {
        visitedCellsRef.current.add(key);
        const id = generateId();
        await insertCheckinEvent(id, coords.lat, coords.lng, {
          cellKey: key,
          tokensAwarded: CHECKIN_TOKENS,
        });
        await addTokens(CHECKIN_TOKENS);
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

      await startTracking(handleNewCoords);
    },
    [startTracking, handleNewCoords],
  );

  const stop = useCallback(
    async (liveStepCount: number) => {
      stopTracking();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
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
    },
    [stopTracking],
  );

  const notifySteps = useCallback((liveStepCount: number) => {
    setCurrentSteps(Math.max(0, liveStepCount - stepBaselineRef.current));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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
