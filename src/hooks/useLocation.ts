import { useState, useRef, useCallback } from 'react';
import * as Location from 'expo-location';

export type Coords = { lat: number; lng: number };

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface LocationState {
  coords: Coords | null;
  isTracking: boolean;
  permissionStatus: PermissionStatus;
}

interface UseLocationReturn extends LocationState {
  startTracking: (onUpdate: (coords: Coords) => void) => Promise<void>;
  stopTracking: () => void;
}

function toPermissionStatus(status: Location.PermissionStatus): PermissionStatus {
  if (status === Location.PermissionStatus.GRANTED) return 'granted';
  if (status === Location.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

export function useLocation(): UseLocationReturn {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async (onUpdate: (coords: Coords) => void) => {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(toPermissionStatus(fg));
    if (fg !== Location.PermissionStatus.GRANTED) return;

    // Request background permission when a walk starts — best-effort; walk still
    // works if denied (foreground tracking only).
    await Location.requestBackgroundPermissionsAsync().catch(() => undefined);

    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 5,
        timeInterval: 3000,
      },
      (loc) => {
        const c: Coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setCoords(c);
        onUpdate(c);
      },
    );

    setIsTracking(true);
  }, []);

  const stopTracking = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setIsTracking(false);
  }, []);

  return { coords, isTracking, permissionStatus, startTracking, stopTracking };
}
