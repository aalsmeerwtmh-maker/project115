import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { RootNavigator } from '@/navigation/RootNavigator';
import { initDb } from '@/db/client';
import { getProgress } from '@/db/repositories/progress';
import { usePetStore } from '@/stores/petStore';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { initIAP, teardownIAP, setupPurchaseListeners } from '@/services/iap';
import { scheduleDailyWalkReminder } from '@/services/notifications';
import { OfflineBanner } from '@/components/OfflineBanner';

export default function App() {
  const hydratePet = usePetStore((s) => s.hydrate);
  const hydrateProgress = useProgressStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  // 'loading' until bootstrap completes; then 'onboarding' or 'main'.
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Main' | null>(null);

  useEffect(() => {
    async function bootstrap() {
      await initDb();
      await Promise.all([hydratePet(), hydrateProgress(), hydrateSettings()]);

      // Detect whether onboarding has been completed.
      const onboardingComplete = await getProgress<boolean>('onboarding_complete');
      const route: 'Onboarding' | 'Main' = onboardingComplete === true ? 'Main' : 'Onboarding';
      setInitialRoute(route);

      // Schedule daily walk reminder after settings are hydrated.
      const { notificationsEnabled, quietHoursStart, quietHoursEnd } = useSettingsStore.getState();
      if (notificationsEnabled) {
        scheduleDailyWalkReminder(quietHoursStart, quietHoursEnd).catch(() => {});
      }
    }
    bootstrap().catch((err) => console.error('App bootstrap failed:', err));
  }, [hydratePet, hydrateProgress, hydrateSettings]);

  useEffect(() => {
    let cleanupListeners: (() => void) | null = null;

    initIAP()
      .then(() => {
        cleanupListeners = setupPurchaseListeners();
      })
      .catch((err) => console.warn('IAP init failed (expected in dev):', err));

    return () => {
      cleanupListeners?.();
      teardownIAP().catch(() => {});
    };
  }, []);

  // Do not render navigation until bootstrap is complete to avoid flash of wrong screen.
  if (initialRoute === null) {
    return <View style={styles.root} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <RootNavigator initialRoute={initialRoute} />
      <OfflineBanner />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
