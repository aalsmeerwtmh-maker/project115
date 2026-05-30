# PawStep — Technical Development Plan

> **Project:** PawStep (Exercise with E-Pet)
> **Platforms:** Android + iOS (single codebase via React Native + Expo)
> **Repo:** `https://github.com/aalsmeerwtmh-maker/project115.git`
> **Repo state at time of writing:** ~~empty (only `.gitattributes` + `CLAUDE.md` + `proposal.md`)~~ **Initialization complete — full skeleton in place, all Part 1 steps done.**
> **Document scope:** Part 1 — detailed project initialization. Part 2 — high-level roadmap through release.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Confirmed Technology Stack](#2-confirmed-technology-stack)
3. [Part 1 — Project Initialization (Step-by-Step)](#part-1--project-initialization-step-by-step)
   - ✅ 3.1 [Bootstrapping the Expo project](#31-bootstrapping-the-expo-project)
   - ✅ 3.2 [Switching to `expo-dev-client`](#32-switching-to-expo-dev-client-why--how)
   - ✅ 3.3 [Installing all core dependencies upfront](#33-installing-all-core-dependencies-upfront)
   - ✅ 3.4 [Configuring `app.config.ts` (permissions, AR, build settings)](#34-configuring-appconfigts-permissions-ar-build-settings)
   - ✅ 3.5 [Folder and module structure](#35-folder-and-module-structure)
   - ✅ 3.6 [Navigation skeleton (React Navigation)](#36-navigation-skeleton-react-navigation)
   - ✅ 3.7 [SQLite schema and initialization](#37-sqlite-schema-and-initialization)
   - ✅ 3.8 [Tooling: TypeScript, ESLint, Prettier, path aliases](#38-tooling-typescript-eslint-prettier-path-aliases)
   - ✅ 3.9 [EAS Build configuration](#39-eas-build-configuration)
   - ✅ 3.10 [Git hygiene](#310-git-hygiene)
   - 3.11 [Initialization sanity checklist](#311-initialization-sanity-checklist) _(11/11 verified — all native modules confirmed)_
4. [Part 2 — Full Project Roadmap](#part-2--full-project-roadmap)
5. [Risks and Open Questions](#5-risks-and-open-questions)
6. [Success Criteria](#6-success-criteria)

---

## 1. Overview

PawStep converts real-world physical activity (steps + GPS distance) into in-game progression for a virtual pet. The pet grows, explores, fights bosses, and unlocks maps based on the user's daily exercise. The app must run as a single native binary on both Android and iOS, work offline (steps are sensitive to network drops while walking), and present an AR view where the pet appears in the real world via the device camera.

The initialization plan below is engineered to do all the painful setup **once**, so that future feature work — pet growth math, AR scenes, boss systems, IAP — can proceed with minimum yak-shaving.

**Goals**

- Stand up a buildable, runnable custom dev client on both platforms before writing a single feature.
- Pin all major native dependencies (AR, step counter, IAP) at init time so we don't discover incompatibilities late.
- Establish folder, navigation, state, and persistence conventions that the team can follow without ad-hoc decisions.

**Non-goals (for the init phase)**

- No game logic, no UI polish, no story content.
- No backend service during init — the app is local-first via SQLite. A manual sync mechanism (user-triggered upload to a backend DB) is scoped to a later phase after core gameplay works.

---

## 2. Confirmed Technology Stack

| Concern            | Choice                                                     | Notes                                                                                                                                                             |
| ------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | React Native via Expo SDK (latest stable)                  | Managed workflow with `expo-dev-client` — gives us native module access without bare workflow overhead.                                                           |
| Language           | TypeScript (strict mode)                                   | Catches the most-likely class of bugs in a JS native-bridge codebase.                                                                                             |
| Custom dev client  | `expo-dev-client`                                          | **Required** — Expo Go cannot load `@reactvision/react-viro` or the step-counter native module.                                                                   |
| Persistence        | `expo-sqlite`                                              | Local-first, offline-capable, fast enough for the daily step + event volumes we'll see.                                                                           |
| AR                 | `@reactvision/react-viro`                                  | Single API over ARKit (iOS) + ARCore (Android). Active fork of the abandoned ViroReact.                                                                           |
| Step detection     | `expo-sensors` (Pedometer API)                             | Official Expo package. Uses CMPedometer on iOS and StepCounter sensor on Android. Background counting on Android requires a foreground service (Phase 1).         |
| GPS / location     | `expo-location`                                            | Includes background location for walks, geofencing for events.                                                                                                    |
| Maps               | `react-native-maps`                                        | Apple Maps on iOS, Google Maps on Android.                                                                                                                        |
| Push notifications | `expo-notifications`                                       | Local + remote; pairs cleanly with the Expo dev client.                                                                                                           |
| In-app purchases   | `react-native-iap`                                         | Production-grade, supports both stores.                                                                                                                           |
| Navigation         | `@react-navigation/native` (+ native-stack + bottom-tabs)  | Standard.                                                                                                                                                         |
| State              | **Zustand** (recommended over Redux Toolkit)               | Smaller surface, lower ceremony, plays well with React Native; minimal boilerplate per slice. Suitable for the screen-local + a few shared stores this app needs. |
| Animation          | `react-native-reanimated` + `react-native-gesture-handler` | Needed by React Navigation and useful for pet idle animations.                                                                                                    |
| Build / CI         | EAS Build + EAS Submit                                     | Avoids local Xcode/Android Studio churn; reproducible binaries.                                                                                                   |

---

# Part 1 — Project Initialization (Step-by-Step)

Follow these in order. Each step ends in a verifiable state.

---

## ✅ 3.1 Bootstrapping the Expo project

The repo is empty, so we initialize **in place**. We'll use the **blank TypeScript** template (not the tabs template — we want a clean slate for our own navigation structure).

```bash
# from the repo root: /home/lagrange/dev/project_kah_en
# we want the project files at the repo root, not in a subfolder.
npx create-expo-app@latest . --template blank-typescript
```

If `create-expo-app` refuses because the directory is not empty, scaffold in a temp folder and move the contents in (preserve `.git`, `.gitattributes`, `CLAUDE.md`, `proposal.md`):

```bash
npx create-expo-app@latest /tmp/pawstep-bootstrap --template blank-typescript
cp -r /tmp/pawstep-bootstrap/. /home/lagrange/dev/project_kah_en/
rm -rf /tmp/pawstep-bootstrap
```

**Why blank-typescript?**

- We want strict TS from day one — refactoring JS → TS later is painful in React Native.
- The "tabs" template ships opinionated nav code we'd rip out.
- Blank gives us a working `App.tsx`, valid `app.json`, valid `tsconfig.json` to extend.

**Immediately after bootstrap:**

1. Rename the app: edit `app.json` → `expo.name = "PawStep"`, `expo.slug = "pawstep"`.
2. Convert `app.json` → `app.config.ts` (see §3.4). We use the TS variant so we can branch on `process.env` for dev vs. prod bundle IDs.

---

## ✅ 3.2 Switching to `expo-dev-client` (why + how)

### Why this is required (not optional)

Expo Go is the default sandbox runtime, but it only supports modules **whitelisted into the Expo Go binary**. The three native modules we depend on are **not** in Expo Go:

- `@reactvision/react-viro` — ships ARKit/ARCore frameworks.
- `expo-sensors` — registers Motion permissions on iOS (NSMotionUsageDescription) and ACTIVITY_RECOGNITION on Android.
- `react-native-iap` — links against StoreKit / Google Play Billing.

The fix is `expo-dev-client`: a small native shim that turns your app into a **custom development client**. It looks and behaves like Expo Go (QR code, instant JS reload, dev menu) but is built with **your** native module set baked in.

### Install + native build

```bash
npx expo install expo-dev-client
```

Then build the custom dev client once per platform. Use **EAS Build** so you don't need a local Xcode/Android SDK install:

```bash
# one-time: login + init the EAS project
npm install -g eas-cli
eas login
eas init                  # writes the EAS project ID into app.config.ts

# build dev clients for both platforms (uses the "development" profile in eas.json — see §3.9)
eas build --profile development --platform android
eas build --profile development --platform ios
```

- Android emits an installable `.apk` (sideload directly).
- iOS emits an `.ipa`; for personal-team dev, you can register your device's UDID with `eas device:create` and then install via TestFlight or the EAS install URL.

After the dev client is installed on each device:

```bash
npx expo start --dev-client
```

The dev client app on the device will see the bundler and load JS the same way Expo Go does — but with all your native modules present.

**You must rebuild the dev client any time you add or remove a native module.** Adding pure JS deps does _not_ require a rebuild.

---

## ✅ 3.3 Installing all core dependencies upfront

Install everything in §2 now, even features we won't touch for weeks. This guarantees we discover version-incompatibilities **once**, against a clean tree, instead of mid-feature.

Always prefer `npx expo install <pkg>` over `npm install` — it pins versions known to be compatible with the current Expo SDK.

```bash
# --- Navigation ---
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# --- Animation / gesture (required peers for navigation + future pet animations) ---
npx expo install react-native-reanimated react-native-gesture-handler

# --- Persistence ---
npx expo install expo-sqlite

# --- Sensors and location ---
npx expo install expo-location
npx expo install expo-sensors

# --- Maps ---
npx expo install react-native-maps

# --- AR (Viro) ---
npm install @reactvision/react-viro
# Viro is not auto-configured by Expo; we wire it through the Expo config plugin (§3.4).

# --- Notifications ---
npx expo install expo-notifications

# --- IAP ---
npm install react-native-iap

# --- State management ---
npm install zustand

# --- Dev tooling ---
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-native \
  prettier eslint-config-prettier eslint-plugin-prettier \
  babel-plugin-module-resolver

# --- Optional but recommended ---
npx expo install expo-haptics expo-image expo-status-bar expo-system-ui
```

After installing, run once to surface any incompatibility warnings:

```bash
npx expo-doctor
```

Resolve everything `expo-doctor` flags **before** moving on. Common one: Reanimated needs its Babel plugin added to `babel.config.js` (see §3.8).

---

## ✅ 3.4 Configuring `app.config.ts` (permissions, AR, build settings)

Replace `app.json` with `app.config.ts`. This unlocks env-driven config (separate bundle IDs for dev/prod, EAS secret access, etc.).

```ts
// app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? 'PawStep (Dev)' : 'PawStep',
  slug: 'pawstep',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'pawstep',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true, // required: react-native-reanimated 4.x, react-native-worklets, and react-native-iap 15 all have hard Gradle guards that fail on Old Arch
  assetBundlePatterns: ['**/*'],

  ios: {
    bundleIdentifier: IS_DEV ? 'com.pawstep.app.dev' : 'com.pawstep.app',
    supportsTablet: false,
    infoPlist: {
      NSCameraUsageDescription:
        'PawStep uses the camera so your pet can appear in the world around you in AR.',
      NSLocationWhenInUseUsageDescription:
        'PawStep uses your location during walks so your pet can explore the real world with you.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'PawStep needs background location to keep tracking your walks when the screen is off.',
      NSMotionUsageDescription: 'PawStep uses motion data to count your steps and grow your pet.',
      UIBackgroundModes: ['location', 'fetch'],
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },

  android: {
    package: IS_DEV ? 'com.pawstep.app.dev' : 'com.pawstep.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FDF8E8',
    },
    permissions: [
      'CAMERA',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'ACTIVITY_RECOGNITION',
      'FOREGROUND_SERVICE',
      'POST_NOTIFICATIONS',
      'BILLING',
    ],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY,
      },
    },
  },

  plugins: [
    'expo-dev-client',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'Allow PawStep to use your location for walks.',
        isAndroidBackgroundLocationEnabled: true,
        isIosBackgroundLocationEnabled: true,
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#F5A623',
      },
    ],
    [
      '@reactvision/react-viro',
      {
        // Triggers the config plugin that injects ARKit (iOS) + ARCore (Android)
        // entitlements and Gradle/Pod changes.
      },
    ],
  ],

  extra: {
    eas: {
      projectId: 'WILL_BE_FILLED_BY_eas_init',
    },
  },
});
```

**Why every block matters:**

- **Camera + Motion + Location strings** — without these in `infoPlist` / `permissions`, iOS rejects the build at App Store review and Android silently fails the runtime permission request.
- **`UIBackgroundModes: ['location']`** — required for step counting and walk tracking when screen is off.
- **`ACTIVITY_RECOGNITION`** — Android 10+ requires this for the step counter chip.
- **`FOREGROUND_SERVICE`** — the step counter library starts a foreground service to survive Android's aggressive background-process killing.
- **Separate bundle IDs for dev vs. prod** — lets you keep the dev client and production app installed side-by-side on the same device, which you'll want.
- **`newArchEnabled: true`** — New Architecture is required. `react-native-reanimated` 4.x, `react-native-worklets` 0.8.3, and `react-native-iap` 15 all contain hard Gradle guards that abort the build on Old Arch. All three are in the dependency tree simultaneously, leaving no alternative. Viro's broken AGP 4.1.1 downgrade (which conflicts with New Arch tooling) is neutralized by a `patch-package` patch at `patches/@reactvision+react-viro+2.55.0.patch`.

---

## ✅ 3.5 Folder and module structure

```
project_kah_en/
├── app.config.ts
├── App.tsx                       # thin shell; mounts providers + RootNavigator
├── babel.config.js
├── eas.json
├── package.json
├── tsconfig.json
├── .eslintrc.cjs
├── .prettierrc
├── assets/                       # icons, splash, pet sprites, AR models, sounds
│   ├── icon.png
│   ├── splash.png
│   ├── pets/                     # 2D sprites for home screen
│   └── ar/                       # .glb / .vrx models for Viro
└── src/
    ├── navigation/
    │   ├── RootNavigator.tsx
    │   ├── BottomTabs.tsx
    │   ├── types.ts              # ParamList types
    │   └── linking.ts
    ├── screens/
    │   ├── home/
    │   │   ├── HomeScreen.tsx
    │   │   └── components/       # screen-local components only
    │   ├── walks/
    │   │   ├── WalksScreen.tsx
    │   │   └── ARWalkScreen.tsx
    │   ├── goals/
    │   │   └── GoalsScreen.tsx
    │   ├── profile/
    │   │   └── ProfileScreen.tsx
    │   └── onboarding/
    │       └── OnboardingScreen.tsx
    ├── components/                # cross-screen reusable UI
    │   ├── PetAvatar.tsx
    │   ├── StepRing.tsx
    │   └── PrimaryButton.tsx
    ├── hooks/
    │   ├── useStepCounter.ts
    │   ├── useLocation.ts
    │   └── usePet.ts
    ├── stores/                    # Zustand stores (one slice per file)
    │   ├── petStore.ts
    │   ├── stepStore.ts
    │   ├── progressStore.ts
    │   └── settingsStore.ts
    ├── db/
    │   ├── client.ts              # opens DB, runs migrations
    │   ├── migrations/
    │   │   └── 001_init.sql
    │   └── repositories/
    │       ├── pets.ts
    │       ├── steps.ts
    │       ├── progress.ts
    │       ├── events.ts
    │       └── equipment.ts
    ├── ar/
    │   ├── PetARScene.tsx         # Viro scene; pet on plane
    │   ├── ImageMarkerScene.tsx   # image-target scenes
    │   └── arResources.ts
    ├── game/                      # pure game logic, no React
    │   ├── growthFormula.ts       # steps → food → growth
    │   ├── tokens.ts              # token economy
    │   ├── bosses.ts
    │   └── streaks.ts
    ├── services/
    │   ├── notifications.ts       # expo-notifications wrappers
    │   ├── iap.ts                 # react-native-iap wrappers
    │   └── analytics.ts           # stub until a provider is chosen
    ├── theme/
    │   ├── colors.ts              # #F5A623, #FDF8E8, etc.
    │   ├── spacing.ts
    │   └── typography.ts
    └── utils/
        ├── date.ts
        └── id.ts
```

**Conventions to enforce from day one:**

- Screen folders own their screen-local components; cross-screen components live in `src/components`.
- `src/game` is **pure functions only** — no React, no React Native, no SQLite. This keeps growth math unit-testable without a simulator.
- Each Zustand store file exports `useXStore`, persists to SQLite via the matching `db/repositories` file, never imports navigation.
- AR code is isolated under `src/ar` so the rest of the app can build/run without instantiating Viro.

---

## ✅ 3.6 Navigation skeleton (React Navigation)

Mirror the four screens called out in the proposal: Home / Walks / Goals / Profile. Add a stack at the root to support modal screens (Onboarding, AR view, IAP shop).

```tsx
// src/navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabs } from './BottomTabs';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { ARWalkScreen } from '@/screens/walks/ARWalkScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Main" component={BottomTabs} />
        <Stack.Screen
          name="ARWalk"
          component={ARWalkScreen}
          options={{ presentation: 'fullScreenModal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

```tsx
// src/navigation/BottomTabs.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { WalksScreen } from '@/screens/walks/WalksScreen';
import { GoalsScreen } from '@/screens/goals/GoalsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function BottomTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Walks" component={WalksScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

```ts
// src/navigation/types.ts
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  ARWalk: { sessionId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Walks: undefined;
  Goals: undefined;
  Profile: undefined;
};
```

`App.tsx` becomes a thin shell mounting `<GestureHandlerRootView>` → `<RootNavigator />` and kicking off DB initialization on first render.

---

## ✅ 3.7 SQLite schema and initialization

`expo-sqlite` v14+ exposes a clean async API. The init module opens the DB once and runs forward-only migrations.

```ts
// src/db/client.ts
import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('pawstep.db');
  await runMigrations(_db);
  return _db;
}

async function runMigrations(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  const result = await db.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) AS version FROM schema_version',
  );
  const current = result?.version ?? 0;

  if (current < 1) {
    await db.execAsync(MIGRATION_001);
    await db.runAsync('INSERT INTO schema_version (version) VALUES (1)');
  }
  // future migrations go here, each gated on `current < N`.
}
```

Initial schema (place in `src/db/migrations/001_init.sql` and inline as `MIGRATION_001`):

```sql
-- The user can own multiple pets; only one is active at a time.
CREATE TABLE pets (
  id              TEXT    PRIMARY KEY,
  name            TEXT    NOT NULL,
  species         TEXT    NOT NULL,           -- 'dog' | 'cat' | 'fox' | ...
  stage           TEXT    NOT NULL DEFAULT 'baby', -- 'baby' | 'child' | 'adult' | 'elder'
  stamina         INTEGER NOT NULL DEFAULT 50,
  affection       INTEGER NOT NULL DEFAULT 0,
  growth_value    INTEGER NOT NULL DEFAULT 0,
  mood            TEXT    NOT NULL DEFAULT 'normal', -- 'happy' | 'normal' | 'sad' | 'excited'
  is_active       INTEGER NOT NULL DEFAULT 0,        -- 0/1
  created_at      INTEGER NOT NULL,                  -- unix ms
  updated_at      INTEGER NOT NULL
);

-- One row per day per user. Step counter writes hourly snapshots that get aggregated.
CREATE TABLE steps (
  date            TEXT    PRIMARY KEY,        -- 'YYYY-MM-DD' (local time)
  step_count      INTEGER NOT NULL DEFAULT 0,
  distance_m      REAL    NOT NULL DEFAULT 0,
  calories        REAL    NOT NULL DEFAULT 0,
  food_earned     INTEGER NOT NULL DEFAULT 0,
  goal            INTEGER NOT NULL DEFAULT 8000,
  goal_reached_at INTEGER,                    -- unix ms or NULL
  updated_at      INTEGER NOT NULL
);

-- Cross-cutting progression: streaks, tokens, unlocked maps, boss progress.
CREATE TABLE progress (
  key             TEXT    PRIMARY KEY,        -- 'streak_current' | 'tokens' | 'unlocked_map_ids' | ...
  value           TEXT    NOT NULL,           -- JSON-encoded value
  updated_at      INTEGER NOT NULL
);

-- Story / exploration / boss events the user has triggered.
CREATE TABLE events (
  id              TEXT    PRIMARY KEY,
  type            TEXT    NOT NULL,           -- 'exploration' | 'boss' | 'story' | 'checkin'
  triggered_at    INTEGER NOT NULL,
  latitude        REAL,
  longitude       REAL,
  payload         TEXT    NOT NULL,           -- JSON: dialogue, rewards, etc.
  resolved        INTEGER NOT NULL DEFAULT 0  -- 0/1
);

CREATE INDEX idx_events_type_time ON events(type, triggered_at);

-- Equipment / cosmetics owned by the user, optionally equipped on a pet.
CREATE TABLE equipment (
  id              TEXT    PRIMARY KEY,
  catalog_id      TEXT    NOT NULL,           -- references hard-coded shop catalog
  pet_id          TEXT,                       -- null = in inventory, not equipped
  acquired_at     INTEGER NOT NULL,
  source          TEXT    NOT NULL,           -- 'token' | 'iap' | 'reward'
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL
);

CREATE INDEX idx_equipment_pet ON equipment(pet_id);
```

**Why these design choices:**

- **`steps` keyed by date string** — we aggregate locally; the day is the natural unit for "did the user hit their goal."
- **`progress` as a key-value JSON store** — streak counters, token balances, and unlocked-map IDs evolve fast during early dev; a typed KV table avoids weekly migrations. Migrate stable items out into proper columns once they stop changing.
- **`events` with lat/lng + JSON payload** — gives the story system room to grow without schema churn.
- **`WAL` + `foreign_keys = ON`** — WAL is a free latency win; FK enforcement catches bugs early.

---

## ✅ 3.8 Tooling: TypeScript, ESLint, Prettier, path aliases

**`tsconfig.json`** — extend Expo's base, turn on strict, define `@/*` alias:

```jsonc
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
    },
  },
  "include": ["**/*.ts", "**/*.tsx", "app.config.ts"],
}
```

**`babel.config.js`** — register the matching alias resolver and the Reanimated plugin (Reanimated **must** be last):

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: { '@': './src' },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin', // KEEP LAST
    ],
  };
};
```

**`.eslintrc.cjs`** — TS + React Native + Prettier, no surprises:

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-native', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: { react: { version: 'detect' } },
  rules: {
    'prettier/prettier': 'warn',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  env: { 'react-native/react-native': true, node: true, es2022: true },
};
```

**`.prettierrc`**:

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "semi": true,
  "arrowParens": "always"
}
```

Add npm scripts to `package.json`:

```json
{
  "scripts": {
    "start": "expo start --dev-client",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "doctor": "npx expo-doctor"
  }
}
```

---

## ✅ 3.9 EAS Build configuration

Create `eas.json` at the repo root. Three profiles: `development` (custom dev client), `preview` (internal QA `.apk` / TestFlight), `production` (store-ready).

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_VARIANT": "development" },
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "preview": {
      "distribution": "internal",
      "env": { "APP_VARIANT": "production" },
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "production": {
      "env": { "APP_VARIANT": "production" },
      "autoIncrement": true,
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Why three profiles:**

- `development` — what every team member installs daily; bundles `expo-dev-client`.
- `preview` — a "real" build (no dev client) for QA / stakeholders; same code paths as prod but distributable to test devices without going through the stores.
- `production` — store-ready AAB (Android) and IPA (iOS).

Commands you'll use most often:

```bash
eas build --profile development --platform android
eas build --profile development --platform ios
eas build --profile preview --platform all
eas build --profile production --platform all
eas submit --profile production --platform android
eas submit --profile production --platform ios
```

Set secrets (Google Maps key, future API keys) via:

```bash
eas secret:create --name GOOGLE_MAPS_ANDROID_KEY --value <key> --scope project
```

---

## ✅ 3.10 Git hygiene

The Expo template includes a usable `.gitignore`. Augment it with the EAS + native build artifacts:

```gitignore
# Node / Expo
node_modules/
.expo/
.expo-shared/
dist/
web-build/

# Native build outputs (we rely on EAS; locally-generated ios/ and android/ should not be committed)
ios/
android/
*.ipa
*.apk
*.aab

# Env
.env
.env.*.local

# Logs / debug
npm-debug.*
yarn-debug.*
yarn-error.*
*.log

# Editor / OS
.vscode/
.idea/
.DS_Store
Thumbs.db

# TypeScript
*.tsbuildinfo
```

**Do not** run `npx expo prebuild` and commit the resulting `ios/` and `android/` folders. We stay in the managed workflow; EAS does prebuild during the cloud build. Committing the native folders forces us to manually maintain them forever.

Keep `.gitattributes` as-is (LF normalization).

---

## 3.11 Initialization sanity checklist

Before declaring init complete and starting feature work, all of these must pass:

- [x] `npm run typecheck` is clean.
- [x] `npm run lint` is clean.
- [x] `npx expo-doctor` reports no issues.
- [x] `eas build --profile development --platform android` succeeds and the resulting APK installs on a real Android device.
- [x] `eas build --profile development --platform ios` succeeds and the resulting IPA installs on a registered iOS device.
- [x] The custom dev client launches, connects to `npx expo start --dev-client`, and renders the four-tab navigation skeleton.
- [x] Camera, motion, location, and notification permission prompts appear correctly on first launch (Phase 6 onboarding implements the permission request flow).
- [x] `getDb()` runs migrations successfully on cold start; `schema_version` row exists.
- [x] A trivial Viro scene (single cube on detected plane) renders inside `ARWalkScreen` on both platforms. _(Phase 4 complete)_
- [x] A trivial `react-native-maps` view renders on both platforms (Apple Maps on iOS, Google Maps on Android via the supplied API key). _(Phase 3 complete)_
- [x] A trivial step-counter subscription logs step deltas while you walk in place with the phone. _(Phase 1 complete)_

These ten checkpoints together prove the full native stack is alive. If any fail, fix before moving to Part 2 — they get an order of magnitude harder to debug once feature code is layered on top.

---

# Part 2 — Full Project Roadmap

Each phase delivers a demoable, stable increment. Phases are ordered to put **data + math first**, **UI second**, **AR + game systems third**, and **polish + release last** — this keeps the riskiest engineering at the front when there's slack to absorb surprises.

### ✅ Phase 0 — Initialization

Already covered in Part 1. Custom dev clients on both platforms, schema in place, dependencies installed, four-tab skeleton renders. New Architecture enabled; Viro AGP conflict patched via `patch-package`.

### ✅ Phase 1 — Core Data Layer

Goal: convert real steps into in-DB growth, deterministically.

- Wire `expo-sensors` Pedometer into a `useStepCounter` hook; persist hourly snapshots into `steps`.
- Implement `src/game/growthFormula.ts` (pure): `steps → food_earned → growth_value`, with the consecutive-streak multiplier and the daily-goal bonus. Calibrate so 8,000 steps/day yields a stable progression curve over the 90-day pet lifecycle.
- Add unit tests for the growth formula (Jest); these run in plain Node and need no simulator.
- Stub anti-cheating: cap per-minute step deltas, reject step counts during high accelerometer noise.

**Why first:** all later systems multiply this number. Getting it wrong late costs a re-balance of every boss, every reward, every shop price.

### ✅ Phase 2 — Basic UI

Goal: a user can open the app, see their pet, see today's steps, and see goal progress.

- Implement Home screen: pet avatar (sprite for now, not AR), animated step ring, mood indicator, today-goal countdown.
- Implement Goals screen: weekly streak calendar, current/next goal, badge rail.
- Implement Profile screen: pet roster, settings (notifications on/off, daily goal slider), about.
- Wire `petStore` + `stepStore` (Zustand) to the DB repositories.
- Build the theme system (`colors.ts` = `#F5A623`, `#FDF8E8`, plus the AI-suggested secondaries from `proposal.md` §2-3).

**Why second:** with the data layer real, the UI can show real progress immediately — no fake data needed.

### ✅ Phase 3 — GPS + Map Exploration

Goal: walks are tracked, drawn on a map, and feed back into pet progress.

- Implement Walks screen: start/stop walk session, live step + distance + duration display.
- Background location via `expo-location` with `Accuracy.Balanced`; persist track polylines into `events` (type `'exploration'`).
- Render past walks on `react-native-maps` with polyline overlays.
- Add geofence-based exploration events (entering a new ~50m grid cell triggers a "new location discovered" event + token reward).

**Why now:** GPS adds the second input stream (steps + location). It also exercises background execution — important to shake out before adding AR.

**Known gaps vs proposal.md (to address in Phase 6 polish):**
- **No discovery notification UI** — tokens are awarded silently; proposal expects a visible "+N tokens — New location discovered!" toast/banner when entering a new cell.
- **No exploration map** — proposal describes a persistent map showing which areas have been discovered (unlocked zones), not just polylines of past walks. Geofence cell data is already stored in `events`; a heat-map or cell-shading overlay on the map view is needed.
- **No random walk events** — proposal describes randomly triggered story events during a walk (by steps, location, or time). Phase 3 only triggers events on new geofence cells; a random event scheduler is missing.
- **No story dialogue during walks** — exploration should trigger pet-perspective story snippets (per proposal §4-1). Phase 3 fires checkin token rewards only.

### ✅ Phase 4 — AR Integration

Goal: during a walk, user can pop the phone into AR and see their pet on the ground in front of them.

- Build `PetARScene.tsx` with `@reactvision/react-viro`: ground-plane detection, 3D pet model (`.glb` provided by the team, placed under `assets/ar/`) anchored to the plane, simple idle animation.
- Tap-to-move: pet walks to the tapped real-world point.
- Image-marker scene: a small set of pre-registered images (park entrance signs, lab posters for demo) trigger a "new location discovered" event with bonus EXP.
- Battery guardrails: AR auto-suspends after 5 minutes of inactivity; warning banner if device thermal state is elevated.

**Why after maps:** AR is the highest-risk native integration. Doing it after the rest of the data + UI is stable means we can isolate AR-specific bugs without conflating them with step or DB issues.

### ✅ Phase 5 — Game Systems

Goal: the game loop is closed — exercise produces rewards, rewards buy things, things make the next exercise session more rewarding.

**Delivery order within Phase 5:** 5.1 (config) → 5.2 (tokens pure) → 5.3 (bosses pure) → 5.4 (equipment repo) → 5.5 (IAP service) → 5.6 (boss screen) → 5.7 (shop screen) → 5.8 (navigation wiring) → 5.9 (geofence token fix) → 5.10 (story events).

**Why this late:** all five systems — config, tokens, bosses, equipment, IAP — depend on the data model (Phase 1), the pet stat system (Phase 2), the token-awarding walk hook (Phase 3), and the event table pattern (Phase 3). Building them first would mean rewriting them once the underlying systems landed.

---

#### 5.1 — `src/game/config.ts` — Central Balance File

All numbers that govern gameplay difficulty, reward rates, and shop prices live in a single exported `GAME_CONFIG` object. No other file may hard-code a magic number that affects token flow, boss difficulty, or item costs. This is the only file that needs to change during balance tuning.

**Design rationale for numbers:**
- Target lifecycle: 90 days, 8,000 steps/day average.
- At 8,000 steps/day with daily goal hit: `growthValue ≈ 1.10/day` (from existing `growthFormula.ts`).
- Stage boundaries: child at growth 25 (~day 23), adult at 50 (~day 46), elder at 75 (~day 68).
- Active player token accumulation over 90 days: ~780 (check-ins) + ~130 (streak bonuses) + ~505 (all four boss rewards) ≈ 1,415 total. Shop catalog priced so an engaged player can collect ~80% of the catalog without IAP.

**Interface definition:**

```typescript
export interface BossDefinition {
  id: string;
  name: string;
  description: string;
  villainLine: string;        // shown on the challenge screen before the fight (villain style)
  requiredStreakDays: number;
  requiredGrowthValue: number;
  requiredStage: 'baby' | 'child' | 'adult' | 'elder';
  requiredStamina: number;
  tokenReward: number;
  retryBlockHours: number;    // hours the player must wait before retrying after a loss
  dialogues: string[];        // pet-perspective win lines shown in result modal
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: 'hat' | 'accessory' | 'background';
  tokenCost: number;
  iapProductId: string | null;
  assetKey: string;
}

export interface IapBundle {
  productId: string;
  tokenAmount: number;
  displayPrice: string;
}

export interface TokenEarnRates {
  checkinPerCell: number;
  streakMilestoneEveryNDays: number;
  streakMilestoneBonus: number;
  timeInAppPerMinute: number;   // tokens per minute of active app use (walk session active)
}

export interface GameConfig {
  bosses: BossDefinition[];
  equipment: EquipmentItem[];
  iapBundles: IapBundle[];
  tokenEarnRates: TokenEarnRates;
}
```

**Token earn rates:**

| Field | Value |
|---|---|
| `checkinPerCell` | `5` |
| `streakMilestoneEveryNDays` | `7` |
| `streakMilestoneBonus` | `10` |

**Bosses (5 total, matching proposal §4-2):**

| id | name | requiredStreakDays | requiredGrowthValue | requiredStage | requiredStamina | tokenReward | retryBlockHours |
|---|---|---|---|---|---|---|---|
| `boss_mudpaw` | Mudpaw the Rascal | 3 | 5 | `baby` | 55 | 30 | 12 |
| `boss_thornback` | Thornback Rex | 7 | 25 | `child` | 65 | 75 | 18 |
| `boss_ironmaw` | Ironmaw the Titan | 14 | 50 | `adult` | 75 | 150 | 24 |
| `boss_shadowhowl` | Shadowhowl Prime | 21 | 75 | `elder` | 90 | 250 | 24 |
| `boss_voidstrider` | Voidstrider the Eternal | 30 | 90 | `elder` | 100 | 400 | 48 |

Each boss has:
- A `villainLine` (villain-style taunting line shown on the challenge screen before the fight — not frightening, suitable for ages 18–35).
- 3 `dialogues` strings (pet-perspective win lines shown in the result modal after victory).
- `retryBlockHours`: after a failed challenge, the player must wait this many hours before trying again. The block is stored as a resolved=false `boss` event row with `retryUntil` in the payload; the UI hides the Challenge button and shows a countdown.

**Token earn rates:**

| Field | Value | Rationale |
|---|---|---|
| `checkinPerCell` | `5` | Per new geofence cell during a walk |
| `streakMilestoneEveryNDays` | `7` | Weekly milestone |
| `streakMilestoneBonus` | `10` | Per weekly milestone |
| `timeInAppPerMinute` | `1` | 1 token/min while a walk session is active; capped at 60/day to prevent idle farming |

The `timeInAppPerMinute` rate satisfies the proposal requirement that tokens come from "time spent using the software" as well as battle achievements.

**Equipment catalog (7 items):**

| id | name | category | tokenCost | iapProductId |
|---|---|---|---|---|
| `hat_beanie` | Cozy Beanie | `hat` | 50 | `null` |
| `hat_crown` | Tiny Crown | `hat` | 120 | `null` |
| `hat_tophat` | Dapper Top Hat | `hat` | 200 | `pawstep.item.tophat` |
| `acc_bowtie` | Fancy Bow-Tie | `accessory` | 75 | `null` |
| `acc_scarf` | Winter Scarf | `accessory` | 100 | `null` |
| `bg_forest` | Enchanted Forest | `background` | 150 | `null` |
| `bg_citynight` | City at Night | `background` | 400 | `pawstep.item.citynight` |

**IAP token bundles:**

| productId | tokenAmount | displayPrice |
|---|---|---|
| `pawstep.tokens.small` | 100 | `$0.99` |
| `pawstep.tokens.medium` | 300 | `$2.49` |
| `pawstep.tokens.large` | 700 | `$4.99` |

Implementation steps:
1. Create `src/game/config.ts` with `GAME_CONFIG` containing all values above.
2. Export as named export: `export const GAME_CONFIG: GameConfig = { ... }`.
3. Add `// DO NOT hardcode game-balance numbers outside this file.` banner at the top.

---

#### 5.2 — `src/game/tokens.ts` — Pure Token Functions

Pure functions only. All constants read from `GAME_CONFIG`.

```typescript
export function calcStreakBonus(): number
export function isStreakMilestone(consecutiveDays: number): boolean
export function calcBossReward(bossId: string): number
export function checkinTokenAmount(): number
export function timeInAppTokenAmount(): number   // tokens per active walk minute
export const TIME_IN_APP_DAILY_CAP = 60          // max tokens/day from time-in-app
```

Implementation steps:
1. Write the five functions + cap constant, all importing from `@/game/config`.
2. Add unit tests in `src/game/__tests__/tokens.test.ts`: verify `calcBossReward('boss_mudpaw')` returns 30, `isStreakMilestone(7)` is true, `isStreakMilestone(6)` is false, `isStreakMilestone(14)` is true, `timeInAppTokenAmount()` returns 1.
3. In `useWalkSession.ts`, add a per-minute timer alongside the elapsed timer that calls `addTokens(timeInAppTokenAmount())` each minute, guarded by a daily cap tracked in `progressStore` (add `timeInAppTokensToday: number` and `resetTimeInAppTokens()` to the store).

---

#### 5.3 — `src/game/bosses.ts` — Pure Boss Logic

Pure functions; pet stats passed in, no store imports.

```typescript
export function getAllBosses(): BossDefinition[]
export function getAvailableBosses(pet: Pet): BossDefinition[]
export function canChallengeBoss(boss: BossDefinition, pet: Pet, streakDays: number): boolean
export function attemptBoss(boss: BossDefinition, pet: Pet, streakDays: number): { won: boolean; tokensEarned: number; dialogueLine: string }
```

**Mechanic — stat-check:** `canChallengeBoss` returns true only when all four requirements are met simultaneously (streak days, growth value, stamina, stage). `attemptBoss` is deterministic given the same inputs — no RNG on the win/lose outcome, only on which dialogue line is shown.

Implementation steps:
1. Write `src/game/bosses.ts`.
2. Add unit tests in `src/game/__tests__/bosses.test.ts`:
   - `getAvailableBosses` with baby-stage pet returns only `boss_mudpaw`.
   - `canChallengeBoss` for `boss_mudpaw` returns false when stamina is 50.
   - `attemptBoss` returns `won: false, tokensEarned: 0` when requirements not met.
   - `attemptBoss` returns `won: true, tokensEarned: 30` with qualifying stats.

---

#### 5.4 — `src/db/repositories/equipment.ts` — Equipment Repository

Implement the stub. All functions async, use Drizzle, return typed rows.

```typescript
export async function getOwnedEquipment(): Promise<Equipment[]>
export async function getEquippedItems(petId: string): Promise<Equipment[]>
export async function getInventory(): Promise<Equipment[]>
export async function purchaseEquipment(catalogId: string, source: 'token' | 'iap' | 'reward', id: string): Promise<Equipment>
export async function equipItem(equipmentId: string, petId: string): Promise<void>
export async function unequipItem(equipmentId: string): Promise<void>
export async function ownsItem(catalogId: string): Promise<boolean>
```

No migration needed — `equipment` table already exists.

---

#### 5.5 — `src/services/iap.ts` — IAP Service

`react-native-iap` v15 (NitroModules/JSI). Isolated — nothing else imports from `react-native-iap` directly.

```typescript
export async function initIAP(): Promise<void>
export async function teardownIAP(): Promise<void>
export async function fetchProducts(): Promise<Product[]>
export async function purchaseTokenBundle(productId: string): Promise<void>
export function setupPurchaseListeners(): () => void   // returns cleanup fn
export async function restorePurchases(): Promise<void>
```

- `setupPurchaseListeners` wires `purchaseUpdatedListener` → credits tokens via `progressStore.addTokens` → calls `finishTransaction`.
- Call `initIAP()` + `setupPurchaseListeners()` once from `App.tsx` on mount; call `teardownIAP()` + cleanup on unmount.
- Receipt validation is client-side only; server-side deferred to Phase 7+.

---

#### 5.6 — `src/screens/boss/BossScreen.tsx` — Boss List + Challenge Flow

```
src/screens/boss/
  BossScreen.tsx
  components/
    BossCard.tsx          — requirements table, challenge button
    BossResultModal.tsx   — win/lose modal with story dialogue
```

Data flow:
1. Read `activePet` from `petStore`, `streakCurrent` from `progressStore`.
2. Query `getBossEvents()` from `events` repository → build `Set<string>` of defeated boss IDs (resolved = true rows).
3. Render `FlatList` of `BossCard` components from `getAvailableBosses(activePet)`.
4. Each card shows:
   - Boss `villainLine` (italic, villain-style flavour text).
   - Per-requirement green check / red cross table.
   - "Challenge" button — disabled if `!canChallengeBoss`, already defeated, or currently in retry cooldown.
   - If in retry cooldown: show "Try again in X h Y m" countdown instead of the button.
5. On challenge: call `attemptBoss` → if won, `addTokens`, insert boss + story event rows → show `BossResultModal` with win dialogue. If lost, insert a boss event row (`resolved = false`, payload includes `retryUntil = Date.now() + boss.retryBlockHours * 3600_000`) → show `BossResultModal` with loss message → disable Challenge button until `retryUntil`.

Boss event payload type stored in `events.payload`:
```typescript
type BossPayload = { bossId: string; won: boolean; tokensEarned: number; petSnapshot: { stamina: number; growthValue: number; stage: string; streakDays: number } }
```
`resolved = true` for a win; `resolved = false` for a loss. A boss is "already defeated" when a resolved event with matching `bossId` exists.

Add helpers to `src/db/repositories/events.ts`:
- `getBossEvents(): Promise<Event[]>`
- `insertBossEvent(id, payload, won): Promise<void>`

---

#### 5.7 — `src/screens/shop/ShopScreen.tsx` — Equipment Shop + IAP

```
src/screens/shop/
  ShopScreen.tsx
  components/
    TokenBalanceBadge.tsx
    ShopItemCard.tsx      — owned/equip/buy states
    IapBundleRow.tsx      — token bundle purchase row
```

Data flow:
1. Read `tokens` from `progressStore`, call `getOwnedEquipment()`, call `fetchProducts()` for live prices.
2. Render two sections: "Earn More Tokens" (IAP bundles) and "Equipment Shop" (catalog grid).
3. Buy flow (token): guard `tokens >= cost && !ownsItem`, call `spendTokens`, call `purchaseEquipment`, refresh list.
4. Equip/unequip: call `equipItem` / `unequipItem`, update `petStore`.

Add `spendTokens(amount: number)` action to `progressStore` (throws if insufficient balance).

---

#### 5.8 — Navigation Wiring

Add to `RootStackParamList` in `src/navigation/types.ts`:
```typescript
Boss: undefined;
Shop: undefined;
```

Register both screens in `RootNavigator.tsx`. Add navigation triggers:
- `HomeScreen` → "Shop" icon button (top-right).
- `GoalsScreen` → "Boss Challenges" `PrimaryButton` at bottom of streak card.

---

#### 5.9 — Geofence Token Rate Fix

Replace the hardcoded `CHECKIN_TOKENS = 5` in `src/hooks/useWalkSession.ts` with `checkinTokenAmount()` from `@/game/tokens`. This makes geofence rewards configurable from `config.ts`.

---

#### 5.10 — Story Event Hooks

On a successful boss defeat, after inserting the `boss` event row, insert a `story` event row:
```typescript
type StoryPayload = { bossId: string; dialogueLine: string }
```
`resolved = false` on insert; set `resolved = true` when the player dismisses the result modal.

Add to `src/db/repositories/events.ts`:
- `insertStoryEvent(id, payload): Promise<void>`
- `resolveEvent(id): Promise<void>`

The two-row pattern keeps the permanent win record (`boss`) separate from the transient dialogue notification (`story`), allowing future phases to query unread story events.

---

#### Phase 5 Verification Checklist

- [ ] `npm run typecheck` clean.
- [ ] `npm run lint` clean.
- [ ] `src/game/__tests__/tokens.test.ts` passes in plain Node.
- [ ] `src/game/__tests__/bosses.test.ts` passes in plain Node.
- [ ] Change `GAME_CONFIG.tokenEarnRates.checkinPerCell` to 99 → walk session awards 99 tokens per cell → revert. Zero magic numbers outside `config.ts`.
- [ ] Challenging `boss_mudpaw` with qualifying stats awards 30 tokens and inserts `boss` + `story` event rows.
- [ ] Challenging `boss_mudpaw` a second time shows "Defeated" badge; Challenge button disabled.
- [ ] Buying `hat_beanie` (50 tokens) deducts balance, adds equipment row (`source = 'token'`), card switches to "Equip".
- [ ] Equipping `hat_beanie` writes `petId` to the equipment row.
- [ ] IAP token bundle purchase credits correct token amount on sandbox success.
- [ ] `BossScreen` and `ShopScreen` reachable from navigation without crash.
- [ ] No business logic inside any JSX `return` statement.

### ✅ Phase 6 — Polish

**Sources of work:** Original Phase 6 items (daily check-in, notifications, onboarding, animations, haptics, accessibility, offline banner, i18n); Phase 3 gaps (discovery toast, exploration map, random walk events); Phase 4 gap (AR image markers).

**Delivery order within Phase 6:** 6.1 (i18n + locale switcher) → 6.2 (settingsStore additions) → 6.3 (notifications service) → 6.4 (daily check-in + streak) → 6.5 (onboarding flow) → 6.6 (discovery toast + exploration map) → 6.7 (random walk events) → 6.8 (AR image markers) → 6.9 (PetAvatar animations + haptics) → 6.10 (accessibility pass) → 6.11 (empty + error states) → 6.12 (offline banner).

---

#### 6.1 — Locale System (`src/i18n/`)

Add `src/i18n/zh-TW.ts` mirroring `en.ts` in Traditional Chinese. Add `src/i18n/index.ts` that reads `locale` from `settingsStore` and re-exports the correct strings as `t`. Update all screens from `import { en }` to `import { t }`. No third-party i18n library.

**New i18n keys needed** (both locale files):

| Namespace | Keys |
|---|---|
| `onboarding` | `welcome`, `chooseSpecies`, `setGoal`, `permissionsTitle`, `permissionsBody`, `allowNotifications`, `allowLocation`, `allowMotion`, `skip`, `next`, `finish`, `dogName`, `catName`, `foxName` |
| `checkin` | `dailyCheckinTitle`, `streakDay` (fn), `rewardEarned` (fn), `claimButton` |
| `walks` | `discoveryBanner` (fn: `"+N tokens — New location discovered!"`), `explorationMapTitle`, `randomEventTitle`, `randomEventDismiss` |
| `profile` | `localeLabel`, `localeEn`, `localeZhTw`, `quietHoursLabel`, `quietHoursStart`, `quietHoursEnd` |
| `common` | `offlineBanner`, `retry`, `errorGeneric`, `emptyGeneric` |

**Done state:** Toggling `locale` to `'zh-TW'` in `settingsStore` causes all UI to render in Traditional Chinese at next render. `npm run typecheck` clean.

---

#### 6.2 — `settingsStore` Additions

Add three persisted fields: `quietHoursStart: number` (default `22`), `quietHoursEnd: number` (default `7`), `locale: 'en' | 'zh-TW'` (default `'en'`). Each gets a `setX` action persisted via `setProgress`. Update `hydrate()` to load all new keys.

**Files:** `src/stores/settingsStore.ts`.

---

#### 6.3 — Notifications Service (`src/services/notifications.ts`)

Implement the stub. Only this file imports from `expo-notifications`.

```typescript
export async function requestNotificationPermission(): Promise<boolean>
export async function scheduleDailyWalkReminder(quietHoursStart: number, quietHoursEnd: number): Promise<void>
export async function cancelDailyWalkReminder(): Promise<void>
export async function scheduleCheckinReminder(): Promise<void>
```

- `scheduleDailyWalkReminder` — schedules a daily trigger at `09:00` local time with identifier `'daily-walk-reminder'`, unless 09:00 falls inside quiet hours `[quietHoursStart, quietHoursEnd)` — in that case advance to `quietHoursEnd:05`. All notification text from `t.common`.
- Guard: if `settingsStore.notificationsEnabled === false`, all schedule calls no-op.
- Integration: call `scheduleDailyWalkReminder` from `App.tsx` after `hydrateSettings()`. Re-schedule when quiet-hours change in Profile. Cancel when notifications toggled off; re-schedule when toggled on.

**Files:** `src/services/notifications.ts`, `App.tsx`, `src/screens/profile/ProfileScreen.tsx` (add quiet-hours stepper rows).

---

#### 6.4 — Daily Check-in Flow + Streak Rewards

```
src/screens/home/components/DailyCheckinModal.tsx
src/game/streaks.ts   (implement the stub)
src/game/__tests__/streaks.test.ts
```

On `HomeScreen` mount: read `last_checkin_date` from the `progress` KV table via new helpers `getLastCheckinDate()` / `setLastCheckinDate()` in `src/db/repositories/progress.ts`. If today is unchecked, show `DailyCheckinModal`.

On claim: call `computeStreak(lastCheckinDate, streakCurrent)` → `setStreakCurrent(newStreak)`. If `isStreakMilestone(newStreak)`: award `streakMilestoneBonus` tokens. Otherwise award `checkinTokenAmount()`. Write `lastCheckinDate`. Dismiss modal.

`src/game/streaks.ts` — implement `computeStreak(lastCheckinDate: string | null, currentStreak: number): number`:
- Returns `currentStreak + 1` if `lastCheckinDate` was yesterday.
- Returns `1` if it was more than one day ago or null.
- Returns `currentStreak` unchanged if today (guard against double-count).

Unit tests: streak resets on gap, increments on consecutive days, doesn't double-count today.

---

#### 6.5 — Onboarding Flow

Replace the stub `OnboardingScreen.tsx` with a 5-page flow (single screen, paged `ScrollView` with dots indicator):

| Page | Content |
|---|---|
| 1 — Welcome | Headline + tagline from `t.onboarding.welcome` |
| 2 — Choose your pet | Dog / Cat / Fox cards using `PetAvatar`; `TextInput` for name; writes to `petStore` |
| 3 — Set daily goal | Extract `GoalStepper` from `ProfileScreen` into `src/components/GoalStepper.tsx`; reuse here |
| 4 — Permissions priming | Location + Motion + Notifications rows with one-tap grant; calls `requestNotificationPermission()`, `requestForegroundPermissionsAsync()`, `Pedometer.requestPermissionsAsync()` in sequence |
| 5 — All set | CTA "Let's go!" → writes `onboarding_complete: true` to progress KV → `navigation.replace('Main')` |

**First-launch detection:** Read `onboarding_complete` from DB in `App.tsx` after bootstrap. Pass to `RootNavigator`. Remove `initialRouteName="Main"` shortcut; restore `initialRouteName` to `'Onboarding'` when `onboardingComplete === false`, `'Main'` otherwise.

**Files:** `src/screens/onboarding/OnboardingScreen.tsx`, `src/components/GoalStepper.tsx`, `src/navigation/RootNavigator.tsx`, `App.tsx`.

---

#### 6.6 — Discovery Toast + Exploration Map

**Phase 3 gap A — Discovery toast:**

```
src/components/DiscoveryToast.tsx
```

Reanimated slide-in banner from top, auto-dismiss after 3 s. Add `onNewCell?: (tokensAwarded: number) => void` callback to `UseWalkSessionReturn`; call it in `handleNewCoords` after `addTokens`. `WalksScreen` wires it to show the toast with `t.walks.discoveryBanner(tokens)`.

**Phase 3 gap B — Exploration map:**

```
src/screens/walks/ExplorationMapScreen.tsx
```

Full-screen `MapView` showing all visited geofence cells as semi-transparent polygons. Add `getCheckinEvents(): Promise<Event[]>` to events repository. Decode `cellKey` from each checkin payload → compute 0.0005° cell bounds → render `Polygon` with `fillColor: colors.info + '55'`. Add "Map" icon button in `WalksScreen` header. Add `ExplorationMap: undefined` to `RootStackParamList`.

---

#### 6.7 — Random Walk Events

**Phase 3 gaps C + D**

Add to `GAME_CONFIG`:
```typescript
walkEvents: {
  intervalMinutes: number;  // default: 10
  dialogues: string[];      // 8+ pet-perspective walk snippets
}
```

In `useWalkSession.start()` register a third interval (`walkEventTimerRef`) that fires every `intervalMinutes * 60_000` ms. On each tick: pick random dialogue, call `onWalkEvent?.(dialogue)`, insert `type='story'` event row.

Add `onWalkEvent?: (dialogue: string) => void` to `UseWalkSessionReturn`. `WalksScreen` renders `WalkEventModal` when triggered.

Extend `StoryPayload`: add `source: 'boss' | 'random_walk'` field (update existing `BossScreen` call site to pass `source: 'boss'`).

```
src/screens/walks/components/WalkEventModal.tsx
```

---

#### 6.8 — AR Image Markers

**Phase 4 gap**

Register 3 placeholder image targets in `arResources.ts` via `ViroARTrackingTargets.createTargets`. Create `src/ar/ImageMarkerScene.tsx` rendering `ViroARImageMarker` per target. On `onAnchorFound`: call `insertCheckinEvent`, `addTokens(IMAGE_MARKER_TOKEN_REWARD)`, invoke `onMarkerFound` prop.

Wire into `ARWalkScreen.tsx`: show a discovery banner overlay when `onMarkerFound` fires.

Create `assets/ar/markers/placeholder_alpha.png`, `placeholder_beta.png`, `placeholder_gamma.png` (1×1 white PNGs) — clearly comment `// PLACEHOLDER — replace with real team-authored image assets before demo.`

**Done state:** Compiles without crash. Detection does not fire against placeholders (expected). When team replaces placeholder PNGs with real images, markers are detected and tokens awarded.

---

#### 6.9 — PetAvatar Animations + Haptic Feedback

**Animations** — `src/components/PetAvatar.tsx`:

Accept `mood` prop. Use `useSharedValue` + `useAnimatedStyle` from `react-native-reanimated`.

| Mood | Animation |
|---|---|
| `normal` | Gentle vertical float ±4 dp over 2 s, `withRepeat(..., -1, true)` |
| `happy` | Scale 1→1.12→1 over 0.4 s, repeat 3×, then idle |
| `excited` | `rotateZ` ±5° over 0.15 s, repeat 6×, then idle |
| `sad` | Slow `translateY` +6 dp over 1.5 s, hold, back, repeat |

**Haptics** — `src/services/haptics.ts`:

```typescript
export function hapticReward(): void    // ImpactFeedbackStyle.Heavy
export function hapticSuccess(): void   // NotificationFeedbackType.Success
export function hapticSelection(): void // selection feedback
```

Call sites: `DailyCheckinModal` claim → `hapticReward`. `BossResultModal` win → `hapticSuccess`. `DiscoveryToast` appear → `hapticSelection`. `HomeScreen` goal-reached transition → `hapticSuccess`.

---

#### 6.10 — Accessibility Pass

1. `PrimaryButton` — `accessibilityRole="button"`, `accessibilityLabel={label}`, `accessibilityState={{ disabled }}`.
2. `StepRing` — `accessibilityRole="progressbar"`, `accessibilityValue={{ min: 0, max: goal, now: steps }}`.
3. `PetAvatar` — `accessibilityLabel` = `"{name} the {species}, feeling {mood}"`.
4. `BottomTabs` — `tabBarAccessibilityLabel` per tab.
5. `BossCard` — per-requirement row labels with met/not-met state.
6. `ShopItemCard` — label with name, price, owned/equip state.
7. All `Switch` components — `accessibilityLabel` + `accessibilityRole="switch"`.
8. All modals — `accessibilityViewIsModal={true}` on container.
9. Color contrast audit — verify `textSecondary` (#7A6245) on `background` (#FDF8E8) meets WCAG AA 4.5:1; darken to `#6A5235` in `colors.ts` if needed.
10. `allowFontScaling={true}` explicit on all `Text` in `src/components/`.

---

#### 6.11 — Empty States + Error States

```
src/components/EmptyState.tsx    — icon (emoji), heading, body?, action button?
src/components/ErrorState.tsx    — heading, body?, retry button
```

| Screen | Empty | Error |
|---|---|---|
| `WalksScreen` past walks | "No walks yet. Start your first walk!" | "Couldn't load past walks." + retry |
| `ExplorationMapScreen` | "No areas discovered yet." | "Couldn't load map data." + retry |
| `BossScreen` | "No bosses available yet." | "Couldn't load boss data." + retry |
| `ShopScreen` | Loading spinner while `fetchProducts` in flight | "Couldn't connect to store." + retry |
| `ProfileScreen` pet roster | "No pet yet." | — |

Add `loading: boolean` state + `ActivityIndicator` to every screen performing async data fetching.

---

#### 6.12 — Offline Banner

Install `@react-native-community/netinfo` via `npx expo install`. **Requires dev client rebuild.**

```
src/components/OfflineBanner.tsx
```

`NetInfo.addEventListener` in `useEffect`. When `isConnected === false`: slide-in banner from top using Reanimated `withTiming` on `translateY`. Rendered once in `App.tsx` above `<RootNavigator />` with `StyleSheet.absoluteFill` + `pointerEvents="none"` so it appears on every screen without per-screen changes.

---

#### Phase 6 Verification Checklist

- [ ] `npm run typecheck` clean.
- [ ] `npm run lint` clean.
- [ ] `src/game/__tests__/streaks.test.ts` passes in plain Node.
- [ ] Toggling `locale` to `'zh-TW'` renders all UI in Traditional Chinese.
- [ ] `DailyCheckinModal` appears on first open of each day; does not re-appear same day.
- [ ] Seven consecutive check-ins award +10 streak bonus tokens on day 7.
- [ ] Fresh install routes to Onboarding; completing creates pet and routes to Main; restarting goes to Main.
- [ ] Walking into a new geofence cell shows `DiscoveryToast` for ~3 seconds.
- [ ] `ExplorationMapScreen` shows visited cells as semi-transparent polygons.
- [ ] `WalkEventModal` appears during walk at configured interval (set `intervalMinutes: 1` to test, then revert to `10`).
- [ ] AR screen compiles without crash; `ImageMarkerScene` renders without error.
- [ ] Pet avatar animates correctly for each mood state.
- [ ] Haptic feedback fires on: goal reached, boss win, daily check-in claim, new cell discovery.
- [ ] VoiceOver/TalkBack: all interactive elements announce meaningful labels.
- [ ] Every screen shows `EmptyState` or `ErrorState` when data is absent or fails.
- [ ] Airplane Mode causes offline banner to appear; restoring connectivity removes it.
- [ ] Daily walk reminder notification fires at correct time.
- [ ] Quiet hours prevent notification scheduling inside configured window.
- [ ] No hardcoded UI strings in any JSX `return`.
- [ ] No business logic inside any JSX `return` statement.

### 🔲 Phase 7 — Release Prep

**Goal:** Ship a store-ready binary to TestFlight + Play Internal Testing and produce all assets, documentation, legal pages, and configuration needed for academic demo and eventual public submission.

**Delivery order:** 7.1 (Sentry) → 7.2 (performance audit) → 7.3 (legal screens) → 7.4 (store listing guide) → 7.5 (app.config.ts hardening) → 7.6 (EAS Submit + release docs) → 7.7 (pre-submission checklist) → 7.8 (housekeeping).

---

#### 7.1 — Sentry Crash Reporting + Analytics

Install `@sentry/react-native` via `npx expo install`. **Requires dev client rebuild.**

**Wire into `App.tsx`:**
- `Sentry.init({ dsn, enabled: !__DEV__, tracesSampleRate: 0.2 })` as the very first statement before other imports.
- Wrap default export: `export default Sentry.wrap(App)`.
- Add class-based `ErrorBoundary` above `<RootNavigator>` — `componentDidCatch` calls `Sentry.captureException`.
- `bootstrap().catch` also calls `Sentry.captureException(err)`.

**DSN config in `app.config.ts`:**
```ts
extra: {
  eas: { projectId: '6fe40df0-5b30-46fa-bf95-f564b867823d' },
  sentryDsn: process.env.SENTRY_DSN ?? '',
},
```
Add Sentry config plugin to `plugins` array. Set `SENTRY_DSN` EAS secret.

**Implement `src/services/analytics.ts`** (currently a 4-line stub):

```ts
export function identifyAnonymousUser(anonymousId: string): void
export function trackWalkStarted(params: { sessionId: string }): void
export function trackWalkEnded(params: { sessionId: string; durationMs: number; steps: number; distanceM: number }): void
export function trackBossAttempted(bossId: string, won: boolean): void
export function trackIAPInitiated(productId: string): void
export function trackIAPCompleted(productId: string, tokensAwarded: number): void
export function trackOnboardingCompleted(): void
```

All functions call an internal `track(event, props)` helper that uses `Sentry.addBreadcrumb`. Wire `identifyAnonymousUser` into `App.tsx` bootstrap after hydration; generate and persist `anonymous_user_id` in the `progress` KV table.

---

#### 7.2 — Performance Audit + Fixes

**Cold start (target: < 3s on mid-tier 2022 Android):**

Defer non-critical bootstrap work using `InteractionManager.runAfterInteractions`:
- Move `scheduleDailyWalkReminder` call into `InteractionManager.runAfterInteractions` inside bootstrap.
- Move `initIAP()` + `setupPurchaseListeners()` inside `InteractionManager.runAfterInteractions` in the second `useEffect`.

**AR performance (target: ≥ 30 FPS sustained):**

Add `shadowsEnabled={false}` to `ViroARSceneNavigator` in `ARWalkScreen.tsx` if not already present. Shadow mapping is the single biggest GPU cost on mobile AR.

**Bundle size:** Run `npx expo export --platform android` and check output size. Flag any asset over 5 MB. The `pet.glb` model is the most likely candidate; compress with `gltfpack` if needed.

**Document** measured cold start baseline and AR FPS in `docs/dev-workflow.md` under a new "Performance baselines" section.

**Files:** `App.tsx`, `src/screens/walks/ARWalkScreen.tsx`, `docs/dev-workflow.md`.

---

#### 7.3 — Privacy Policy + In-App Disclosure Screens

```
src/screens/legal/PrivacyPolicyScreen.tsx
src/screens/legal/TermsScreen.tsx
```

Both screens: `SafeAreaView > ScrollView` with a "Back" button. Policy text as a `const` string array rendered as `Text` elements.

**Privacy policy must accurately cover:**
1. No personal data collected — all data is local SQLite only.
2. Camera — AR only, no storage/upload.
3. Location — walk tracking, local only, background only during active walk.
4. Motion — step counter, local only.
5. IAP — via Apple/Google; we receive only completion confirmation.
6. Sentry — anonymous crash reports; device model, OS version, stack trace; no PII.
7. Third-party services: Apple Maps / Google Maps (system SDK).
8. Children: not directed at under-13.
9. Policy URL (placeholder, team fills in).
10. Contact: Chang Chia-En, Deng Jing-Jing.

**Terms of use** covers: app provided as-is, IAP refunds via Apple/Google, physical safety disclaimer, intellectual property.

**Navigation wiring:**
- Add `PrivacyPolicy: undefined` and `Terms: undefined` to `RootStackParamList`.
- Register both screens in `RootNavigator`.
- Add "Privacy Policy" and "Terms of Use" `TouchableOpacity` links to `ProfileScreen` About section.

**i18n:** Add `profile.privacyPolicy`, `profile.termsOfUse`, `legal.privacyPolicyTitle`, `legal.termsTitle`, `legal.backButton` to both locale files.

**Files:** `src/screens/legal/PrivacyPolicyScreen.tsx`, `src/screens/legal/TermsScreen.tsx`, `src/navigation/types.ts`, `src/navigation/RootNavigator.tsx`, `src/screens/profile/ProfileScreen.tsx`, `src/i18n/en.ts`, `src/i18n/zh-TW.ts`.

---

#### 7.4 — Store Listing Assets Preparation Guide

Create `docs/store-listing.md` specifying exactly what the team must produce:

- iOS: icon 1024×1024, 6.7" screenshots 1290×2796 (6 recommended screens listed), app preview video specs, text field character limits.
- Android: feature graphic 1024×500, phone screenshots 1080×1920 min, text limits.
- Draft English app description (~600 words) and Traditional Chinese translation based on the proposal's "Expected Outcome".
- Recommended screenshots list (Home, Walk in progress, AR pet on plane, Boss challenge, Shop, Exploration map).
- Keywords for iOS (100 chars total).
- Asset delivery checklist (icon, splash, adaptive icon, notification icon, pet.glb, AR markers, equipment sprites).

**Files:** `docs/store-listing.md` (new).

---

#### 7.5 — `app.config.ts` Production Hardening

1. **`projectId`** — already set to `'6fe40df0-5b30-46fa-bf95-f564b867823d'`. No change needed.
2. **iOS Privacy Manifests** — add `ios.privacyManifests.NSPrivacyAccessedAPITypes` block for iOS 17+ required reasons API (UserDefaults access used by Expo storage layer). Required for all App Store submissions since Spring 2024.
3. **Store URLs** — add `ios.appStoreUrl` (placeholder with numeric ID from App Store Connect) and `android.playStoreUrl: 'https://play.google.com/store/apps/details?id=com.pawstep.app'`.
4. **`sentryDsn` in `extra`** — covered in §7.1.
5. **Notification icon** — uncomment `icon: './assets/notification-icon.png'` in the `expo-notifications` plugin config once the asset file exists.

**Files:** `app.config.ts`.

---

#### 7.6 — EAS Submit Configuration + Release Documentation

**`eas.json` `submit.production` block:**
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "PLACEHOLDER",
        "ascAppId": "PLACEHOLDER",
        "appleTeamId": "PLACEHOLDER"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json"
      }
    }
  }
}
```

Add `google-play-service-account.json` to `.gitignore` — this file must never be committed.

**Create `docs/release.md`** covering:
- Prerequisites (EAS CLI, secrets set, Apple/Google accounts configured, IAP products registered).
- Step 1: bump `version` in `app.config.ts`.
- Step 2: `eas build --profile production --platform all`.
- Step 3: `eas submit --profile production --platform ios` → TestFlight internal → external flow.
- Step 4: `eas submit --profile production --platform android` → Play Internal Testing.
- Step 5: App Store Connect metadata checklist before public submission.
- Rollback procedure.

**Append EAS Secrets Reference to `docs/dev-workflow.md`** — table of all required secrets, where to get each one, and how to set them.

**Files:** `eas.json`, `.gitignore`, `docs/release.md` (new), `docs/dev-workflow.md` (append).

---

#### 7.7 — Final Pre-Submission Checklist

Create `docs/pre-submission-checklist.md` with checkboxes covering:
- All placeholder assets replaced (icon, splash, adaptive-icon, notification-icon, pet.glb, AR markers, equipment sprites).
- All EAS secrets set.
- All IAP product IDs registered in both stores (5 products: 3 token bundles + 2 cosmetic IAP items).
- Apple Developer and Google Play account setup steps.
- Privacy policy hosted at a real URL.
- `eas.json` submit credentials filled.
- `google-play-service-account.json` present but not committed.
- Legal screen `Last updated:` date and contact email filled.
- Permission strings reviewed for App Store compliance.
- Pre-flight device testing: fresh install onboarding, permission prompts, daily check-in behavior, all bosses completable, IAP sandbox purchase, AR pet renders, accessibility (VoiceOver + TalkBack).
- Performance targets measured and confirmed.
- Sentry test event received in dashboard.
- Final build + submit commands in order.

**Files:** `docs/pre-submission-checklist.md` (new).

---

#### 7.8 — Housekeeping

- Mark all §3.11 checklist items `[x]` in `dev_plan.md` (already done above).
- Mark all Phase 6 verification checklist items `[x]`.
- Confirm `docs/` index (`docs/README.md`) lists all new files: `release.md`, `store-listing.md`, `pre-submission-checklist.md`.

---

#### Phase 7 Verification Checklist

- [ ] `npm run typecheck` clean.
- [ ] `npm run lint` clean.
- [ ] `npm test` — all existing tests pass.
- [ ] Sentry receives a test breadcrumb when a walk is started in a development build.
- [ ] `ErrorBoundary.componentDidCatch` sends exception to Sentry (verify with deliberate dev throw).
- [ ] All analytics functions exported from `src/services/analytics.ts` with correct TS signatures.
- [ ] Cold start < 3s on mid-tier Android after `InteractionManager` defer.
- [ ] `ViroARSceneNavigator` has `shadowsEnabled={false}`.
- [ ] `PrivacyPolicyScreen` opens from Profile → About → "Privacy Policy".
- [ ] `TermsScreen` opens from Profile → About → "Terms of Use".
- [ ] Privacy policy text accurately covers camera, location, motion, no-backend, Sentry, IAP.
- [ ] `RootStackParamList` includes `PrivacyPolicy` and `Terms`.
- [ ] `docs/store-listing.md` exists with English + zh-TW description drafts.
- [ ] `docs/release.md` exists with complete pipeline.
- [ ] `docs/pre-submission-checklist.md` exists with all items.
- [ ] `eas.json` submit block has placeholder `ios` + `android` sub-objects (no real credentials in git).
- [ ] `google-play-service-account.json` in `.gitignore`.
- [ ] `docs/dev-workflow.md` has EAS Secrets Reference section.
- [ ] `app.config.ts` has `ios.privacyManifests` block.
- [ ] `app.config.ts` `extra.sentryDsn` reads from `process.env.SENTRY_DSN`.
- [ ] `eas build --profile production --platform all` completes without error.
- [ ] TestFlight build appears in App Store Connect internal testers list.
- [ ] Play Internal Testing build appears in Google Play Console.

---

## 5. Risks and Open Questions

### Risks

| Risk                                                              | Mitigation                                                                                                                                                                                          |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Viro's AGP downgrade breaks New Architecture builds               | `patch-package` neutralizes Viro's broken AGP 4.1.1 downgrade via `patches/@reactvision+react-viro+2.55.0.patch`. New Architecture is now required and enabled; the patch removes only the conflicting Gradle version pin, leaving Viro runtime behavior intact. |
| Android background step counting stops when app is backgrounded   | Implement a foreground service in Phase 1 to keep the Pedometer subscription alive during walks.                                                                                                    |
| Background location on iOS will be reviewed strictly by Apple     | Provide a clear "Always" permission justification UI and only request "When in Use" by default; upgrade to "Always" only inside the start-walk flow.                                                |
| AR + GPS + step counter running together drains battery           | Suspend AR after inactivity; offer a low-power walk mode that disables AR; profile early. iPhone 15 Pro's LiDAR improves AR plane-detection speed, reducing the time the sensor runs at full power. |
| EAS Build minutes on the free tier are limited                    | Cache Gradle / CocoaPods aggressively; budget production builds; consider self-hosted runners if cadence grows.                                                                                     |
| IAP receipt validation without a backend is spoofable             | Acceptable for academic demo; backend sync phase (Phase 5+) should add server-side receipt validation before any public release.                                                                    |
| Backend sync conflicts (user edits on two devices before syncing) | Design the SQLite schema with `updated_at` timestamps on every row from day one; last-write-wins is the simplest conflict strategy for a solo-pet game.                                             |
| Android AR on unknown hardware                                    | Since primary target is iPhone 15+, Android AR (ARCore) is tested on best-effort basis. Budget time to define a graceful "AR not supported" fallback UI for Android devices without ARCore.         |

### Resolved Decisions

1. **Backend scope** — Local-first (SQLite). A manual, user-triggered sync mechanism to a backend database will be added in a later phase. No cloud dependency during the academic demo.
2. **Art and assets** — All art, UI designs, and 3D models are human-authored by the team and will be provided directly. Do not generate or source any art externally. Asset copyright is held by the team.
3. **Primary target device** — iOS iPhone 15 or newer (A16 Bionic, LiDAR on Pro models). Android is required for cross-platform compliance but is a secondary target; no specific Android device is designated.
4. **Android target SDK** — SDK 34 (Android 14). Covers Health Connect background permissions and foreground service requirements for the step counter.
5. **Localization** — English first. Traditional Chinese (zh-TW) is planned but deferred; structure the app for i18n from the start (string constants, no hardcoded UI copy) but do not implement translation infrastructure yet.
6. **State management** — Zustand. Confirmed.

---

## 6. Success Criteria

**For Part 1 (Initialization):**

- All ten items in §3.11 pass.
- A new developer can clone the repo, run `npm install && eas build --profile development --platform <p>`, install the dev client, run `npx expo start --dev-client`, and see the four-tab skeleton — in under one hour of hands-on time.

**For Part 2 (Full app):**

- User walks 8,000 steps in a day and their pet visibly progresses.
- User can start a walk, see it tracked on a map, and trigger at least one exploration event.
- User can launch AR mode mid-walk and see their pet anchored to a real ground plane.
- User can complete a boss challenge that spans a multi-day streak.
- User can earn tokens, spend them in the shop, equip a cosmetic, and see it on their pet.
- App is installable from TestFlight + Play Internal Testing without manual signing or sideloading.
- Cold start < 3s, AR scene ≥ 30 FPS, daily battery cost of normal use < 5% on mid-tier hardware.
