/**
 * NOTE: @sentry/react-native is not installed by default — it requires a native module
 * and a dev client rebuild. The try/catch guard below ensures the app starts cleanly
 * whether or not the package is linked. See src/services/analytics.ts for instructions.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Sentry = require('@sentry/react-native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Constants = require('expo-constants');
  const dsn: string = Constants.default?.expoConfig?.extra?.sentryDsn ?? '';
  if (dsn) {
    Sentry.init({
      dsn,
      enabled: !__DEV__,
      tracesSampleRate: 0.2,
    });
  }
} catch {
  // @sentry/react-native not installed — crash reporting inactive until dev client rebuild.
}

import { Component, useEffect, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { RootNavigator } from '@/navigation/RootNavigator';
import { initDb } from '@/db/client';
import { getProgress, setProgress } from '@/db/repositories/progress';
import { usePetStore } from '@/stores/petStore';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useEquipmentStore } from '@/stores/equipmentStore';
import { initIAP, teardownIAP, setupPurchaseListeners } from '@/services/iap';
import { scheduleDailyWalkReminder } from '@/services/notifications';
import { OfflineBanner } from '@/components/OfflineBanner';
import { identifyAnonymousUser } from '@/services/analytics';

// ---------------------------------------------------------------------------
// Error Boundary — catches JS errors in the render tree and reports to Sentry.
// ---------------------------------------------------------------------------

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (Sentry) {
      try {
        Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
      } catch {
        // Swallow — analytics must never crash the app.
      }
    }
    console.error('AppErrorBoundary caught:', error, info);
  }

  override render(): ReactNode {
    // On unrecoverable error render nothing rather than crashing natively.
    // A more polished fallback UI can be added later.
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ANONYMOUS_USER_ID_KEY = 'anonymous_user_id';

async function getOrCreateAnonymousId(): Promise<string> {
  const existing = await getProgress<string>(ANONYMOUS_USER_ID_KEY);
  if (existing) return existing;
  // Generate a simple UUID-like identifier without external dependencies.
  const id = 'anon-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  await setProgress(ANONYMOUS_USER_ID_KEY, id);
  return id;
}

// ---------------------------------------------------------------------------
// App component
// ---------------------------------------------------------------------------

function App() {
  const hydratePet = usePetStore((s) => s.hydrate);
  const hydrateProgress = useProgressStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateEquipment = useEquipmentStore((s) => s.hydrate);

  // 'loading' until bootstrap completes; then 'onboarding' or 'main'.
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Main' | null>(null);

  useEffect(() => {
    async function bootstrap() {
      await initDb();
      await Promise.all([hydratePet(), hydrateProgress(), hydrateSettings()]);
      const activePet = usePetStore.getState().activePet;
      if (activePet) {
        await hydrateEquipment(activePet.id).catch(() => {});
      }

      // Detect whether onboarding has been completed.
      const onboardingComplete = await getProgress<boolean>('onboarding_complete');
      const route: 'Onboarding' | 'Main' = onboardingComplete === true ? 'Main' : 'Onboarding';
      setInitialRoute(route);

      // Identify the user anonymously for analytics.
      const anonymousId = await getOrCreateAnonymousId();
      identifyAnonymousUser(anonymousId);

      // Defer non-critical work until the JS thread is idle.
      requestIdleCallback(() => {
        const { notificationsEnabled, quietHoursStart, quietHoursEnd } =
          useSettingsStore.getState();
        if (notificationsEnabled) {
          scheduleDailyWalkReminder(quietHoursStart, quietHoursEnd).catch(() => {});
        }
      });
    }
    bootstrap().catch((err) => {
      console.error('App bootstrap failed:', err);
      if (Sentry) {
        try {
          Sentry.captureException(err);
        } catch {
          // no-op
        }
      }
    });
  }, [hydratePet, hydrateProgress, hydrateSettings, hydrateEquipment]);

  useEffect(() => {
    let cleanupListeners: (() => void) | null = null;

    // Defer IAP init until the JS thread is idle to avoid blocking cold start.
    const taskId = requestIdleCallback(() => {
      initIAP()
        .then(() => {
          cleanupListeners = setupPurchaseListeners();
        })
        .catch((err) => console.warn('IAP init failed (expected in dev):', err));
    });

    return () => {
      cancelIdleCallback(taskId);
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
      <AppErrorBoundary>
        <RootNavigator initialRoute={initialRoute} />
        <OfflineBanner />
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

// Wrap with Sentry HOC if available; otherwise export plain component.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WrappedApp: any = Sentry ? Sentry.wrap(App) : App;
export default WrappedApp;
