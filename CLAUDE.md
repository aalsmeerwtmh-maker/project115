# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

---

## Project state

Phases 0–6 are complete. Phase 7 (release prep, store submission, analytics provider choice) is **not yet started**.

What exists and works end-to-end:
- Full navigation skeleton (root native stack + four-tab bottom navigator)
- SQLite database with Drizzle ORM — schema, migrations, and typed repositories for all five tables
- Zustand stores for pet, steps, progress, and settings — all hydrated from DB on startup
- Step counter via `expo-sensors` Pedometer, wired into `useStepCounter` hook
- Walk session (`useWalkSession`) with GPS tracking, polyline, haversine distance, and geofence cell discovery
- Exploration events, story events, and check-in events written to the `events` table during walks
- Token economy (earn via walk time, check-ins, boss victories; spend in shop)
- Boss challenge system with five bosses defined in `src/game/config.ts`
- Equipment shop with seven items, token purchases, and IAP bundles
- AR walk screen using `@reactvision/react-viro` (pet is a placeholder sphere until art delivers `pet.glb`)
- Image marker AR scene (placeholder PNGs; real markers pending)
- Onboarding flow, daily check-in modal, offline banner, haptics, notifications
- i18n for English and Traditional Chinese

---

## Folder map

```
App.tsx                        — entry point; mounts providers and calls initDb()
app.config.ts                  — Expo config, permissions, EAS project ID
eas.json                       — build profiles: development / preview / production
assets/                        — static assets (see docs/assets.md)
patches/                       — patch-package patches (Viro AGP fix)
scripts/bundle-migrations.mjs  — run by db:generate; bundles .sql files into migrations.ts
src/
  navigation/                  — route definitions and param types
  screens/                     — one folder per screen; screen-local components inside screens/*/components/
  components/                  — shared UI components used across screens
  stores/                      — Zustand stores (petStore, stepStore, progressStore, settingsStore)
  hooks/                       — native API wrappers (useStepCounter, useLocation, useWalkSession, usePet)
  db/                          — SQLite client, schema, migrations.ts, repositories/
  game/                        — pure TypeScript game logic (no React, no native modules)
  ar/                          — Viro AR scenes and arResources.ts (isolated from everything else)
  services/                    — iap.ts, notifications.ts, haptics.ts, analytics.ts
  theme/                       — colors.ts, spacing.ts, typography.ts
  i18n/                        — en.ts, zh-TW.ts, index.ts (t proxy)
  utils/                       — date.ts, id.ts
```

---

## Starting Metro (WSL2 + Tailscale)

The dev machine runs WSL2. The Tailscale IP (`100.69.13.58`) must be passed so Metro advertises an address the physical Android device can reach over the Tailscale VPN. The `npm start` script already encodes this:

```bash
npm start
# expands to:
REACT_NATIVE_PACKAGER_HOSTNAME=100.69.13.58 expo start --dev-client
```

To also clear the Metro cache (required after changing native modules or `babel.config.js`):

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=100.69.13.58 npx expo start -c --dev-client
```

---

## Key architectural decisions

### New Architecture is non-negotiable (`newArchEnabled: true`)

Three dependencies include hard Gradle guards that reject Old Architecture builds:
- `react-native-reanimated` 4.x
- `react-native-worklets` 0.8.3
- `react-native-iap` 15 (NitroModules/JSI-based)

`patches/@reactvision+react-viro+2.55.0.patch` neutralizes Viro's AGP 4.1.1 downgrade, which conflicts with New Architecture tooling. Never remove this patch.

### Lazy DB initialization pattern

`src/db/client.ts` exports a `Proxy`-backed `db` constant that delegates to a private `_db` variable that is null until `initDb()` is called. This lets the module be imported at the top of any file without throwing. `initDb()` must be awaited in `App.tsx` before any repository function runs.

Do not write `openDatabaseSync` directly — always import `db` from `@/db/client`.

### migrations.ts bundle pattern (not babel-plugin-inline-import)

Metro cannot bundle `.sql` files natively. `babel-plugin-inline-import` is in `devDependencies` but **does not work with Metro** (the plugin runs in Node during Babel transform, but the transformed module is not re-evaluated correctly in Metro's module system).

The actual solution: `npm run db:generate` runs `drizzle-kit generate` and then `scripts/bundle-migrations.mjs`, which reads each generated `.sql` file and writes its content as a TypeScript string export to `src/db/migrations.ts`. `client.ts` imports from `migrations.ts`, not from the `.sql` files directly. The migration key format must be `m0000`, `m0001`, etc. — not the Drizzle-generated tag name (e.g., `'0000_third_brother_voodoo'`).

### AR isolation

Nothing outside `src/ar/` and `src/screens/walks/ARWalkScreen.tsx` imports from `@reactvision/react-viro`. This keeps the app bootable even if ARCore/ARKit fails to initialize, and prevents accidental AR scene instantiation in non-AR screens.

### IAP isolation

Nothing outside `src/services/iap.ts` imports from `react-native-iap`. All call sites use the functions exported by `iap.ts`.

---

## Conventions to always follow

- **No magic numbers outside `src/game/config.ts`.** All token rates, boss requirements, shop prices, IAP bundle amounts, and walk event intervals live there. If you need to add a tuneable number, add it to `GAME_CONFIG` first.
- **All user-visible strings in i18n.** Add to both `src/i18n/en.ts` and `src/i18n/zh-TW.ts`, then access via `t.namespace.key` (the `t` proxy in `src/i18n/index.ts`). Never put raw English strings in JSX.
- **No business logic in JSX returns.** Derive values before the return statement; the return contains only layout and event handlers.
- **All art is human-authored.** Do not generate, synthesize, or source art assets from any tool. The team's art director provides all sprites, 3D models, and marker images.
- **Screens never import from `src/db/repositories/` directly.** Go through a Zustand store or a custom hook.
- **`src/game/` is pure TypeScript.** No React, no `expo-sqlite`, no native module imports. This keeps game logic unit-testable in plain Node.

---

## DB migration workflow

```bash
# 1. Edit src/db/schema.ts
# 2. Generate + bundle:
npm run db:generate
# This runs drizzle-kit generate, then scripts/bundle-migrations.mjs,
# which rewrites src/db/migrations.ts automatically.
# 3. Import the new export in src/db/client.ts:
#    import { m0001 } from './migrations';
#    migrationFiles = { m0000, m0001 };
```

Never edit `src/db/drizzle/` files by hand. Never modify or delete an existing migration.

---

## Known gotchas

| Symptom | Cause | Fix |
|---|---|---|
| `migrate()` throws "migration not found: 0000_third_brother_voodoo" | `migrationFiles` key must be `m0000`, not the Drizzle tag name | Key format is `m0000`, `m0001`, etc. |
| AR scene shows blank / pet does not appear on plane | `ViroARPlaneSelector` alignment must be `"Horizontal"`, not `"HorizontalUpward"` | Use `alignment="Horizontal"` |
| Pet animation breaks after plane selection | `ViroAnimatedComponent` has a `this`-binding bug when the component re-renders after plane selection | Apply `animation` prop directly on the geometry node (e.g. `<ViroSphere animation={...} />`) instead of wrapping in `ViroAnimatedComponent` |
| App crashes before JS error boundary renders on Android walk screen | `react-native-maps` triggers a native crash before JS is ready when Maps API key is missing or invalid | Set `GOOGLE_MAPS_ANDROID_KEY` in EAS secrets (or `.env` locally) before running on Android |
| White screen after QR scan | Device is not connected to the Metro server | Ensure Tailscale is active on both machines; use the `-c` flag to clear cache |
| `babel-plugin-inline-import` has no effect on `.sql` imports | The plugin runs in Babel but Metro's module resolution doesn't re-evaluate the transformed output correctly | Use `migrations.ts` pattern instead — see "migrations.ts bundle pattern" above |

---

## Git configuration

- Line endings: LF normalization via `.gitattributes` (`* text=auto`). Keep in place.
- Remote: `https://github.com/aalsmeerwtmh-maker/project115.git`
