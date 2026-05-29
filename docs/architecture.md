# Architecture

PawStep is a local-first mobile app. The device is the source of truth: all step data, pet state, and progression live in a SQLite database on the user's phone. There is no required network connection during normal use. A backend sync mechanism is planned for Phase 5+ but does not exist yet.

---

## High-level summary

| Concern               | Solution                                                         |
| --------------------- | ---------------------------------------------------------------- |
| Cross-platform mobile | React Native + Expo SDK 56 (managed workflow, custom dev client) |
| Persistence           | SQLite via `expo-sqlite` — single file `pawstep.db`              |
| In-memory state       | Zustand stores (one file per domain)                             |
| Screen routing        | React Navigation 7 (native stack + bottom tabs)                  |
| Game logic            | Pure TypeScript in `src/game/` — no React, no native modules     |
| AR                    | `@reactvision/react-viro` over ARKit (iOS) / ARCore (Android)    |
| Step counting         | `expo-sensors Pedometer` with accelerometer fallback             |

---

## Data flow

Steps enter the system from a hardware sensor and propagate through layers until they reach SQLite:

```
Hardware step-counter chip
        │
        ▼
expo-sensors Pedometer  (native module subscription)
        │
        ▼
useStepCounter hook  (src/hooks/useStepCounter.ts)
  — subscribes to step deltas
  — applies anti-cheat cap on per-minute deltas
        │
        ▼
stepStore  (src/stores/stepStore.ts)  ← Zustand, in-memory
  — accumulates today's total
  — triggers growthFormula recalculation
        │
        ├──► growthFormula  (src/game/growthFormula.ts)
        │     — pure function: steps → food_earned → growth_value
        │
        ▼
steps repository  (src/db/repositories/steps.ts)
  — db.insert().into(steps)... via Drizzle query builder
        │
        ▼
SQLite  (pawstep.db — steps table, one row per calendar day)
```

Pet state follows the same pattern: `usePet` hook → `petStore` → `pets` repository → SQLite.

---

## Layer overview

```
src/
├── screens/        UI layer
├── components/     Shared UI pieces
├── hooks/          Bridge: native APIs → React state
├── stores/         Zustand: shared in-memory state
├── db/             Persistence: SQLite client + migrations + repositories
├── game/           Pure game logic — no React, no native, fully unit-testable
├── ar/             AR scenes (Viro) — isolated so the app builds without instantiating AR
├── services/       External service wrappers (notifications, IAP, analytics)
├── theme/          Design tokens: colors, spacing, typography
├── navigation/     Route definitions and param types
└── utils/          Stateless helpers (date formatting, UUID generation)
```

### Layer rules

These rules exist to keep each layer independently testable and to prevent circular dependencies:

| Rule                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------- |
| Screens never call `src/db/repositories/` directly. Go through a store or a custom hook.                                                |
| `src/game/` is pure TypeScript only. No React imports, no `expo-sqlite`, no native modules.                                             |
| Zustand stores import repositories but never import navigation or screen components.                                                     |
| `src/db/` uses the Drizzle query builder (`db.select().from(...)`, `db.insert().into(...)`, etc.) — no raw SQL strings in repositories.  |
| `src/ar/` is only imported by AR-related screens (`ARWalkScreen`). Nothing else imports Viro.                                            |
| `src/services/` wraps third-party SDKs; call services from hooks or stores, not from screens.                                           |

---

## Navigation structure

```
RootStack  (createNativeStackNavigator)
├── Onboarding          — first-launch flow; replaced with Main once complete
├── Main                — mounts BottomTabs
│   ├── Home            — pet avatar, step ring, mood indicator
│   ├── Walks           — walk session, map, AR launch button
│   ├── Goals           — streak calendar, boss challenges
│   └── Profile         — pet roster, settings
└── ARWalk              — full-screen modal; launched from Walks tab
                          receives { sessionId: string } linking the AR session
                          back to the walk record in the DB
```

`ARWalk` is a full-screen modal (`presentation: 'fullScreenModal'`) so it overlays the entire screen, including the tab bar. The Viro scene is only instantiated inside this screen — nothing in the tab navigator imports AR code.

Route param types live in `src/navigation/types.ts`. Always import `RootStackParamList` or `MainTabParamList` from there when writing `navigation.navigate()` calls or `useRoute()`.

---

## State management

Three places hold state. Choosing the right one keeps things predictable:

| Where                              | When to use                                                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Zustand store** (`src/stores/`)  | Data that multiple screens need simultaneously, or that persists across navigation events. Example: the active pet, today's step count, token balance. |
| **Local React state** (`useState`) | UI-only state that no other component cares about. Example: whether a modal is open, an input field value.                                             |
| **SQLite directly**                | The authoritative record. Write to SQLite whenever you write to a Zustand store. Read from SQLite on cold start to hydrate the stores.                 |

Zustand stores are the bridge: they mirror the SQLite state in memory so screens can read without async DB calls on every render. On app start, each store reads its initial data from the matching repository and populates itself.

---

## Backend sync model

The app is currently local-first with no backend. All data lives in the device's `pawstep.db`.

A manual, user-triggered sync mechanism to a remote backend is planned for **Phase 5+**. The schema is designed for it:

- Every table row has an `updated_at` column storing unix milliseconds.
- Conflict resolution strategy: last-write-wins, using `updated_at` as the tiebreaker.

No sync code exists yet. Do not design features that depend on a backend being present.

---

## Key architectural decisions

### New Architecture (`newArchEnabled: true`)

Expo's New Architecture (JSI/Fabric) is enabled. The migration was forced simultaneously by three dependencies that include hard Gradle guards rejecting Old Architecture builds:

- `react-native-reanimated` 4.x
- `react-native-worklets` 0.8.3
- `react-native-iap` 15 (which uses NitroModules as its JSI bridge layer)

All three must run together; there was no path to satisfy all three while staying on Old Arch. This flag is set in `app.config.ts`.

`@reactvision/react-viro` ships a config plugin that attempts to downgrade AGP to 4.1.1, which conflicts with the AGP version required by New Architecture tooling. This is neutralized by a `patch-package` patch at `patches/@reactvision+react-viro+2.55.0.patch`, which removes the downgrade without altering any Viro runtime behavior.

### Custom dev client, not Expo Go

Three native modules ship code that Expo Go does not include:

- `@reactvision/react-viro` — ARKit/ARCore frameworks
- `expo-sensors Pedometer` — foreground service (Android) + Motion permission (iOS)
- `react-native-iap` — StoreKit / Google Play Billing

`expo-dev-client` provides the same QR code + live reload experience as Expo Go, but with our native modules baked in. Any time a new native module is added, the dev client must be rebuilt via `eas build --profile development`.

### `legacy-peer-deps` (if applicable)

Some React Native community packages have peer dependency declarations that don't account for Expo SDK's custom React Native fork version. If `npm install` fails with peer dependency errors, `--legacy-peer-deps` is the documented workaround. This is noted as a known friction point, not a bug.

### Managed workflow — no committed `ios/` or `android/` folders

We do not run `expo prebuild` and commit the resulting native folders. EAS runs prebuild during cloud builds. This avoids the overhead of manually maintaining Podfiles, Gradle files, and Xcode project configurations as Expo SDK versions advance.

### `src/game/` purity constraint

Game logic (step→growth math, streak calculations, token rules, boss definitions) is pure TypeScript. This is a deliberate constraint: it allows running unit tests with plain Jest in Node without a device, simulator, or React Native bridge. The constraint is enforced by code review and by the ESLint rule that blocks React imports in that folder.
