import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { RootNavigator } from '@/navigation/RootNavigator';
import { initDb } from '@/db/client';
import { usePetStore } from '@/stores/petStore';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { initIAP, teardownIAP, setupPurchaseListeners } from '@/services/iap';

export default function App() {
  const hydratePet = usePetStore((s) => s.hydrate);
  const hydrateProgress = useProgressStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    async function bootstrap() {
      await initDb();
      await Promise.all([hydratePet(), hydrateProgress(), hydrateSettings()]);
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

  return (
    <GestureHandlerRootView style={styles.root}>
      <RootNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
