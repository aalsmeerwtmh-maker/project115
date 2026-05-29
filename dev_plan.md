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
   - 3.11 [Initialization sanity checklist](#311-initialization-sanity-checklist) _(3/11 verified — EAS android build pending)_
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
- [ ] `eas build --profile development --platform android` succeeds and the resulting APK installs on a real Android device. _(build fix applied — pending re-trigger)_
- [ ] `eas build --profile development --platform ios` succeeds and the resulting IPA installs on a registered iOS device.
- [x] The custom dev client launches, connects to `npx expo start --dev-client`, and renders the four-tab navigation skeleton. _(white screen is expected — all screens are stubs)_
- [ ] Camera, motion, location, and notification permission prompts appear correctly on first launch (verify on both platforms).
- [ ] `getDb()` runs migrations successfully on cold start; `schema_version` row exists. _(Drizzle migrations implemented; runtime verification pending)_
- [ ] A trivial Viro scene (single cube on detected plane) renders inside `ARWalkScreen` on both platforms. _(Phase 4)_
- [ ] A trivial `react-native-maps` view renders on both platforms (Apple Maps on iOS, Google Maps on Android via the supplied API key). _(Phase 3)_
- [ ] A trivial step-counter subscription logs step deltas while you walk in place with the phone. _(Phase 1)_

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

### 🔲 Phase 2 — Basic UI

Goal: a user can open the app, see their pet, see today's steps, and see goal progress.

- Implement Home screen: pet avatar (sprite for now, not AR), animated step ring, mood indicator, today-goal countdown.
- Implement Goals screen: weekly streak calendar, current/next goal, badge rail.
- Implement Profile screen: pet roster, settings (notifications on/off, daily goal slider), about.
- Wire `petStore` + `stepStore` (Zustand) to the DB repositories.
- Build the theme system (`colors.ts` = `#F5A623`, `#FDF8E8`, plus the AI-suggested secondaries from `proposal.md` §2-3).

**Why second:** with the data layer real, the UI can show real progress immediately — no fake data needed.

### 🔲 Phase 3 — GPS + Map Exploration

Goal: walks are tracked, drawn on a map, and feed back into pet progress.

- Implement Walks screen: start/stop walk session, live step + distance + duration display.
- Background location via `expo-location` with `Accuracy.Balanced`; persist track polylines into `events` (type `'exploration'`).
- Render past walks on `react-native-maps` with polyline overlays.
- Add geofence-based exploration events (entering a new ~50m grid cell triggers a "new location discovered" event + token reward).

**Why now:** GPS adds the second input stream (steps + location). It also exercises background execution — important to shake out before adding AR.

### 🔲 Phase 4 — AR Integration

Goal: during a walk, user can pop the phone into AR and see their pet on the ground in front of them.

- Build `PetARScene.tsx` with `@reactvision/react-viro`: ground-plane detection, 3D pet model (`.glb` provided by the team, placed under `assets/ar/`) anchored to the plane, simple idle animation.
- Tap-to-move: pet walks to the tapped real-world point.
- Image-marker scene: a small set of pre-registered images (park entrance signs, lab posters for demo) trigger a "new location discovered" event with bonus EXP.
- Battery guardrails: AR auto-suspends after 5 minutes of inactivity; warning banner if device thermal state is elevated.

**Why after maps:** AR is the highest-risk native integration. Doing it after the rest of the data + UI is stable means we can isolate AR-specific bugs without conflating them with step or DB issues.

### 🔲 Phase 5 — Game Systems

Goal: the game loop is closed — exercise produces rewards, rewards buy things, things make the next exercise session more interesting.

- Boss battle screen: turn-based or timed challenges keyed to consecutive-day step thresholds (e.g., "walk 8,000 steps for 7 consecutive days to unlock Boss 1").
- Token economy: tokens earned from time-in-app + completed bosses + streak bonuses, spent in the equipment shop.
- Equipment shop: catalog of cosmetic items, currency = tokens or IAP. Equip/unequip writes to the `equipment` table.
- Story event hooks: trigger pet-perspective dialogue snippets from `events.payload` JSON.
- IAP integration via `react-native-iap`: a small set of token bundles and one cosmetic bundle. Implement receipt validation client-side (server-side validation deferred until a backend exists).

**Why this late:** these systems all _consume_ the data + UI + map + AR plumbing built earlier. Building them first would mean rewriting them once the underlying systems landed.

### 🔲 Phase 6 — Polish

- Daily check-in flow with streak rewards.
- Local push notifications (`expo-notifications`): "Your pet is waiting for a walk!" — quiet hours configurable.
- Onboarding flow: pet selection, daily goal calibration, permission priming screens (ask in-app before triggering OS prompts).
- Pet idle/walk/happy animations using Reanimated; haptic feedback on rewards.
- Accessibility pass: screen reader labels on every interactive element, dynamic type support, color-contrast verification.
- Empty states, error states, offline banner.
- i18n groundwork: move all hardcoded UI strings into a `src/i18n/en.ts` constants file now, so zh-TW can be added later by swapping a single locale file. Do not implement a full i18n library yet — just no magic strings in JSX.

### 🔲 Phase 7 — Release Prep

- Production `eas build --profile production --platform all` and TestFlight + Internal Testing track distribution.
- Privacy policy + permission disclosure pages (required for App Store and Play submission given camera + motion + background location).
- Store listing assets: screenshots, feature graphic, promo video, descriptions.
- Crash reporting + analytics provider selection (Sentry recommended; wire via `services/analytics.ts` stub).
- Performance pass: cold start under 3s on a mid-tier 2022 Android device; AR scene at 30 FPS sustained.
- App Store / Play Store submission via `eas submit`.

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
