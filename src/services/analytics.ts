/**
 * Analytics service — wraps Sentry breadcrumbs for event tracking and crash reporting.
 *
 * @sentry/react-native is NOT installed by default because it requires a native module
 * and a dev client rebuild. To activate real crash reporting:
 *   1. Run: npx expo install @sentry/react-native
 *   2. Run: eas build --profile development --platform all   (rebuild dev client)
 *   3. Set the SENTRY_DSN EAS secret: eas secret:create --name SENTRY_DSN --value <dsn> --scope project
 *
 * Until then, all analytics calls are safe no-ops. The try/catch import guard ensures
 * the app starts cleanly whether or not @sentry/react-native is installed.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null;

try {
  // Dynamic require so the app does not crash at module load time when the
  // native Sentry module is not linked (i.e. before a dev client rebuild).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Sentry = require('@sentry/react-native');
} catch {
  // @sentry/react-native not installed — analytics will no-op.
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function track(event: string, props?: Record<string, unknown>): void {
  if (!Sentry) return;
  try {
    Sentry.addBreadcrumb({
      category: 'app.event',
      message: event,
      data: props,
      level: 'info',
    });
  } catch {
    // Swallow; analytics must never crash the app.
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function identifyAnonymousUser(anonymousId: string): void {
  if (!Sentry) return;
  try {
    Sentry.setUser({ id: anonymousId });
  } catch {
    // no-op
  }
}

export function trackWalkStarted(params: { sessionId: string }): void {
  track('walk_started', params);
}

export function trackWalkEnded(params: {
  sessionId: string;
  durationMs: number;
  steps: number;
  distanceM: number;
}): void {
  track('walk_ended', params);
}

export function trackBossAttempted(bossId: string, won: boolean): void {
  track('boss_attempted', { bossId, won });
}

export function trackIAPInitiated(productId: string): void {
  track('iap_initiated', { productId });
}

export function trackIAPCompleted(productId: string, tokensAwarded: number): void {
  track('iap_completed', { productId, tokensAwarded });
}

export function trackOnboardingCompleted(): void {
  track('onboarding_completed');
}
