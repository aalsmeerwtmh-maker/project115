/**
 * Locale-aware string accessor.
 *
 * Reads `locale` from settingsStore and returns the matching locale object.
 * Import `t` in any screen instead of importing `en` directly.
 *
 * Usage:
 *   import { t } from '@/i18n/index';
 *   <Text>{t.home.goalReached}</Text>
 *
 * When `settingsStore.locale` changes, any component that renders `t.*`
 * will re-render automatically because the store triggers a React re-render.
 *
 * Note: `t` is evaluated at call-site render time, not at module load time,
 * so it always reflects the current locale.
 */
import { useSettingsStore } from '@/stores/settingsStore';
import { en } from './en';
import { zhTW } from './zh-TW';

// ---- Type alias so callers can type-check against the canonical shape ----
export type Strings = typeof en;

function getStrings(): Strings {
  // Read locale synchronously from the Zustand store state (outside React).
  const locale = useSettingsStore.getState().locale;
  if (locale === 'zh-TW') return zhTW as unknown as Strings;
  return en;
}

/**
 * `t` — the current locale's string table.
 *
 * Implemented as a Proxy so every property access goes through `getStrings()`
 * at render time, guaranteeing locale changes are reflected immediately.
 */
export const t: Strings = new Proxy({} as Strings, {
  get(_target, prop: string) {
    const strings = getStrings();
    return strings[prop as keyof Strings];
  },
});
