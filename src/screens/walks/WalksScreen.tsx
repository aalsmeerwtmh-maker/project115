import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useWalkSession, formatElapsed } from '@/hooks/useWalkSession';
import { useStepStore } from '@/stores/stepStore';
import { getRecentWalkSessions } from '@/db/repositories/events';
import type { Event } from '@/db/schema';
import type { WalkPayload } from '@/db/repositories/events';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { en } from '@/i18n/en';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

function PastWalkItem({ event }: { event: Event }) {
  let payload: WalkPayload | null = null;
  try {
    payload = JSON.parse(event.payload) as WalkPayload;
  } catch {
    payload = null;
  }

  const distKm = payload ? payload.distanceM / 1000 : 0;
  const steps = payload?.stepCount ?? 0;

  return (
    <View style={styles.pastWalkRow}>
      <Text style={styles.pastWalkDate}>{en.walks.walkDate(event.triggeredAt)}</Text>
      <Text style={styles.pastWalkSummary}>{en.walks.walkSummary(distKm, steps)}</Text>
    </View>
  );
}

export function WalksScreen() {
  const navigation = useNavigation<RootNav>();
  const session = useWalkSession();
  const today = useStepStore((s) => s.today);
  const liveSteps = today?.stepCount ?? 0;

  const [pastWalks, setPastWalks] = useState<Event[]>([]);
  const [isStopping, setIsStopping] = useState(false);
  const sessionIdRef = useRef<string>('');

  const { isActive, elapsedSeconds, distanceM, currentSteps, polyline, locationPermissionStatus } =
    session;

  const mapPolyline = polyline.map((c) => ({ latitude: c.lat, longitude: c.lng }));
  const distKm = distanceM / 1000;

  useEffect(() => {
    session.notifySteps(liveSteps);
  }, [liveSteps, session]);

  useEffect(() => {
    if (!isActive) {
      getRecentWalkSessions(5)
        .then(setPastWalks)
        .catch(() => undefined);
    }
  }, [isActive]);

  async function handleStartStop() {
    if (isActive) {
      setIsStopping(true);
      await session.stop(liveSteps);
      setIsStopping(false);
    } else {
      sessionIdRef.current = String(Date.now());
      await session.start(liveSteps);
    }
  }

  function handleEnterAR() {
    navigation.navigate('ARWalk', { sessionId: sessionIdRef.current });
  }

  const mapRegion =
    polyline.length > 0
      ? {
          latitude: polyline[polyline.length - 1]!.lat,
          longitude: polyline[polyline.length - 1]!.lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }
      : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{en.walks.title}</Text>

        <MapView style={styles.map} region={mapRegion} showsUserLocation={isActive}>
          {mapPolyline.length > 1 && (
            <Polyline coordinates={mapPolyline} strokeColor={colors.primary} strokeWidth={4} />
          )}
        </MapView>

        {isActive && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{en.walks.steps}</Text>
              <Text style={styles.statValue}>{currentSteps.toLocaleString()}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{en.walks.elapsed}</Text>
              <Text style={styles.statValue}>{formatElapsed(elapsedSeconds)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{en.walks.distance(0).split(' ')[1]}</Text>
              <Text style={styles.statValue}>{distKm.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {locationPermissionStatus === 'denied' && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{en.walks.locationDenied}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <PrimaryButton
            label={isActive ? en.walks.stopWalk : en.walks.startWalk}
            onPress={handleStartStop}
            loading={isStopping}
          />
          {isActive && (
            <View style={styles.arButtonWrapper}>
              <PrimaryButton label={en.walks.enterAR} onPress={handleEnterAR} />
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>{en.walks.pastWalksTitle}</Text>

        {pastWalks.length === 0 ? (
          <Text style={styles.emptyText}>{en.walks.noPastWalks}</Text>
        ) : (
          <FlatList
            data={pastWalks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PastWalkItem event={item} />}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heading: {
    ...typography.heading1,
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  map: {
    width: '100%',
    height: 260,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.heading3,
    color: colors.textPrimary,
  },
  buttonRow: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  arButtonWrapper: {
    marginTop: spacing.sm,
  },
  warningBanner: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  pastWalkRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pastWalkDate: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  pastWalkSummary: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  separator: {
    height: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
