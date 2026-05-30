# Architecture

PawStep is a local-first mobile app. The device is the source of truth: all step data, pet state, and progression live in a SQLite database on the user's phone. There is no required network connection during normal use. A backend sync mechanism is planned for Phase 7+ but does not exist yet.

---

## High-level summary

| Concern | Solution |
|---|---|
| Cross-platform mobile | React Native + Expo SDK 56 (managed workflow, custom dev client) |
| Persistence | SQLite via `expo-sqlite` — single file `pawstep.db` |
| In-memory state | Zustand stores (one file per domain) |
| Screen routing | React Navigation 7 (native stack + bottom tabs) |
| Game logic | Pure TypeScript in `src/game/` — no React, no native modules |
| AR | `@reactvision/react-viro` over ARKit (iOS) / ARCore (Android) |
| Step counting | `expo-sensors Pedometer` with accelerometer fallback |
| i18n | Proxy-based `t` object in `src/i18n/index.ts`; locale stored in settingsStore |

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
  — sets isAvailable flag
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

Walk sessions are orchestrated by `useWalkSession` (see [Walk session flow](#walk-session-flow) below).

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
├── services/       External service wrappers (notifications, IAP, analytics, haptics)
├── theme/          Design tokens: colors, spacing, typography
├── i18n/           Locale strings and the t proxy
├── navigation/     Route definitions and param types
└── utils/          Stateless helpers (date formatting, UUID generation)
```

### Layer rules

| Rule |
|---|
| Screens never call `src/db/repositories/` directly. Go through a store or a custom hook. |
| `src/game/` is pure TypeScript only. No React imports, no `expo-sqlite`, no native modules. |
| Zustand stores import repositories but never import navigation or screen components. |
| `src/db/` uses the Drizzle query builder only — no raw SQL strings in repositories. |
| `src/ar/` is only imported by `ARWalkScreen` and `ImageMarkerScene`. Nothing else imports Viro. |
| `src/services/iap.ts` is the only file that imports from `react-native-iap`. |
| `src/services/notifications.ts` is the only file that imports from `expo-notifications`. |
| `src/services/` wrappers are called from hooks or stores, not directly from screens. |

---

## DB schema overview

Five tables. Full column reference in [database.md](database.md).

| Table | Rows | Purpose | Key design note |
|---|---|---|---|
| `pets` | One per pet | Pet identity, stage, stamina, mood, growth | Only one row has `isActive = true` at a time |
| `steps` | One per calendar day | Raw step count, distance, calories, goal | `date` PK is `'YYYY-MM-DD'` in local time |
| `progress` | One per KV key | Cross-cutting state: streak, tokens, boss progress | JSON-encoded values; avoids migrations for frequently-changing counters |
| `events` | One per game event | Exploration, story, boss, check-in events | `resolved` flag; `payload` is JSON; indexed on `(type, triggered_at)` |
| `equipment` | One per owned item | Cosmetics owned by the user | `petId` is null when in inventory; FK with `ON DELETE SET NULL` |

Every table has an `updatedAt` column storing unix milliseconds for future sync conflict resolution.

---

## Navigation structure

```
RootStack  (createNativeStackNavigator)
├── Onboarding          — first-launch flow; replaced with Main once complete
├── Main                — mounts BottomTabs
│   ├── Home            — pet avatar, step ring, mood indicator, daily check-in
│   ├── Walks           — walk session, map, AR launch button
│   ├── Goals           — streak calendar, boss challenge entry point
│   └── Profile         — pet roster, settings (goal, notifications, language)
├── ARWalk              — full-screen modal (presentation: 'fullScreenModal')
│                         receives { sessionId: string } linking AR session to walk record
├── Boss                — full-screen boss challenge list and result modal
├── Shop                — equipment shop (tokens + IAP bundles)
└── ExplorationMap      — full-screen map of all discovered grid cells
```

`ARWalk` is a `fullScreenModal` so it covers the entire screen including the tab bar. The Viro scene is only instantiated inside this screen — nothing in the tab navigator imports AR code.

Route param types live in `src/navigation/types.ts`. Always import `RootStackParamList` or `MainTabParamList` from there when writing `navigation.navigate()` calls or `useRoute()`.

---

## State management

Three places hold state:

| Where | When to use |
|---|---|
| **Zustand store** (`src/stores/`) | Data that multiple screens need simultaneously, or that persists across navigation events. Examples: active pet, today's step count, token balance, user settings. |
| **Local React state** (`useState`) | UI-only state that no other component cares about. Examples: whether a modal is open, an input field value. |
| **SQLite directly** | The authoritative record. Write to SQLite whenever you write to a Zustand store. Read from SQLite on cold start to hydrate the stores. |

### Store responsibilities

| Store | Owns |
|---|---|
| `petStore` | `activePet: Pet | null`, `hydrated` flag. Hydrates from `pets` repository. Exposes `updateActivePet()` which writes through to DB. |
| `stepStore` | `today: StepDay | null`, `isAvailable` (sensor present on device). Populated by `useStepCounter`. No DB writes — steps repository is called directly by the hook. |
| `progressStore` | `streakCurrent`, `tokens`, `timeInAppTokensToday`. Hydrates from `progress` KV table. All mutations write through via `setProgress()`. |
| `settingsStore` | `notificationsEnabled`, `dailyGoal`, `quietHoursStart`, `quietHoursEnd`, `locale`. All settings are persisted in the `progress` KV table under prefixed keys. |

Zustand stores are the bridge: they mirror the SQLite state in memory so screens can read synchronously without an async DB call on every render. On app start, each store's `hydrate()` method reads from the matching repository.

---

## AR architecture

The AR subsystem is deliberately isolated from the rest of the app.

```
ARWalkScreen.tsx
    │
    ├── ViroARSceneNavigator
    │       └── PetARScene.tsx    — pet on ground plane
    │
    └── ImageMarkerScene.tsx      — runs via a separate ViroARSceneNavigator
                                     when the user presses the marker scan button

arResources.ts
    — ViroAnimations.registerAnimations()    (called at module load time)
    — ViroMaterials.createMaterials()         (placeholder orange sphere material)
    — ViroARTrackingTargets.createTargets()   (three image marker targets)
```

**Why isolation?** ARKit and ARCore have heavy initialization cost. Instantiating a `ViroARSceneNavigator` outside the AR screen would consume camera resources and battery while the user is on any tab. The import-only-in-ARWalkScreen rule enforces this.

**Placeholder pet model:** `assets/ar/pet.glb` does not exist yet. `PetARScene.tsx` renders a `ViroSphere` as a stand-in. See [docs/assets.md](assets.md) for how to wire up the real model when it is delivered.

**Known Viro bugs worked around in this codebase:**
- `ViroARPlaneSelector` requires `alignment="Horizontal"` not `"HorizontalUpward"`.
- `ViroAnimatedComponent` has a `this`-binding bug after plane selection. The `animation` prop is applied directly on `ViroSphere` instead of wrapping with `ViroAnimatedComponent`.

---

## Walk session flow

`useWalkSession` (`src/hooks/useWalkSession.ts`) orchestrates everything that happens during a walk:

```
user taps "Start Walk"
        │
        ▼
useWalkSession.start(stepBaseline)
  — records baseline step count
  — starts elapsed timer (1 s interval)
  — starts time-in-app token timer (60 s interval, capped at TIME_IN_APP_DAILY_CAP)
  — starts walk event timer (GAME_CONFIG.walkEvents.intervalMinutes interval)
  — calls useLocation.startTracking(handleNewCoords)
        │
        ▼
handleNewCoords fires on each GPS update
  — appends coord to polyline
  — recalculates haversine distance
  — quantises coord to ~50 m grid cell (0.0005° buckets)
  — if new cell: awards tokens, writes checkin event to DB, calls onNewCell callback
        │
        ▼
user taps "Stop Walk"
        │
        ▼
useWalkSession.stop(liveStepCount)
  — clears all timers
  — calculates final distance and duration
  — writes an exploration event to DB with polyline, distance, duration, step count
  — sets isActive = false
```

---

## IAP architecture

`src/services/iap.ts` is the single boundary between the app and `react-native-iap`. No other file imports from `react-native-iap`.

```
App.tsx
  └── initIAP()           — called on mount
  └── setupPurchaseListeners()  — wires purchaseUpdatedListener
                                    on purchase: looks up bundle in GAME_CONFIG
                                                 credits tokens via progressStore
                                                 calls finishTransaction

ShopScreen
  └── fetchIapProducts()  — fetches live product info from the store
  └── purchaseTokenBundle(productId)  — initiates the purchase flow
```

Token bundle definitions (`productId`, `tokenAmount`, `displayPrice`) live in `GAME_CONFIG.iapBundles` in `src/game/config.ts`.

---

## Backend sync model

The app is currently local-first with no backend. All data lives in the device's `pawstep.db`.

A manual, user-triggered sync mechanism is planned for Phase 7+. The schema is ready:
- Every table row has an `updatedAt` column storing unix milliseconds.
- Conflict resolution strategy: last-write-wins, using `updatedAt` as the tiebreaker.

No sync code exists yet. Do not design features that depend on a backend being present.

---

## Key architectural decisions

### New Architecture (`newArchEnabled: true`)

Expo's New Architecture (JSI/Fabric) is enabled. Three dependencies include hard Gradle guards that reject Old Architecture builds:
- `react-native-reanimated` 4.x
- `react-native-worklets` 0.8.3
- `react-native-iap` 15 (NitroModules/JSI bridge layer)

`patches/@reactvision+react-viro+2.55.0.patch` removes Viro's AGP 4.1.1 downgrade, which conflicts with New Architecture tooling. This patch must remain in place.

### Lazy DB initialization

`src/db/client.ts` exports a `Proxy`-backed `db` constant. The proxy delegates to a private `_db` that is null until `initDb()` is called. This allows `import { db }` at the top of any repository without the module throwing at evaluation time. `initDb()` must be awaited in `App.tsx` before any repository function runs.

### migrations.ts bundle pattern

Metro cannot bundle `.sql` files natively. `babel-plugin-inline-import` (in `devDependencies`) does not work correctly with Metro's module system. The actual solution: `npm run db:generate` runs Drizzle Kit and then `scripts/bundle-migrations.mjs`, which writes each migration's SQL content as a TypeScript string export in `src/db/migrations.ts`. `client.ts` imports from `migrations.ts` using the key format `m0000`, `m0001`, etc.

### `src/game/` purity constraint

Game logic is pure TypeScript — no React, no `expo-sqlite`, no native modules. This allows running unit tests with plain Jest in Node without a device, simulator, or React Native bridge.

### Managed workflow — no committed native folders

We do not run `expo prebuild` and commit the resulting `ios/` or `android/` folders. EAS runs prebuild during cloud builds. This avoids manual maintenance of Podfiles, Gradle files, and Xcode project configurations as Expo SDK versions advance.
