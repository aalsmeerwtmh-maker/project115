import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polygon } from 'react-native-maps';
import { getCheckinEvents } from '@/db/repositories/events';
import type { CheckinPayload } from '@/db/repositories/events';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

// Cell size in degrees — matches cellKey() in useWalkSession (~0.0005° ≈ 55 m).
const CELL_SIZE = 0.0005;

interface CellBounds {
  key: string;
  coords: Array<{ latitude: number; longitude: number }>;
}

/** Converts a cellKey like "lat_bucket:lng_bucket" to a polygon covering that cell. */
function cellKeyToBounds(key: string): CellBounds | null {
  const parts = key.split(':');
  if (parts.length !== 2) return null;
  const latBucket = Number(parts[0]);
  const lngBucket = Number(parts[1]);
  if (isNaN(latBucket) || isNaN(lngBucket)) return null;

  const minLat = latBucket * CELL_SIZE;
  const minLng = lngBucket * CELL_SIZE;
  const maxLat = minLat + CELL_SIZE;
  const maxLng = minLng + CELL_SIZE;

  return {
    key,
    coords: [
      { latitude: minLat, longitude: minLng },
      { latitude: maxLat, longitude: minLng },
      { latitude: maxLat, longitude: maxLng },
      { latitude: minLat, longitude: maxLng },
    ],
  };
}

export function ExplorationMapScreen() {
  const [cells, setCells] = useState<CellBounds[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadCells = useCallback(async () => {
    try {
      const rows = await getCheckinEvents();
      const seen = new Set<string>();
      const bounds: CellBounds[] = [];
      for (const row of rows) {
        try {
          const payload = JSON.parse(row.payload) as CheckinPayload;
          if (seen.has(payload.cellKey)) continue;
          seen.add(payload.cellKey);
          const b = cellKeyToBounds(payload.cellKey);
          if (b) bounds.push(b);
        } catch {
          // Skip malformed rows.
        }
      }
      setCells(bounds);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCells();
  }, [loadCells]);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>{t.walks.explorationMapTitle}</Text>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!loading && error && (
        <ErrorState
          heading={t.common.errorGeneric}
          body="Couldn't load map data."
          onRetry={loadCells}
        />
      )}

      {!loading && !error && cells.length === 0 && (
        <EmptyState heading="No areas discovered yet." />
      )}

      {!loading && !error && cells.length > 0 && (
        <MapView style={styles.map} showsUserLocation>
          {cells.map((cell) => (
            <Polygon
              key={cell.key}
              coordinates={cell.coords}
              fillColor={colors.info + '55'}
              strokeColor={colors.info}
              strokeWidth={1}
            />
          ))}
        </MapView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heading: {
    ...typography.heading1,
    color: colors.primary,
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
