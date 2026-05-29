# PawStep — Exercise with E-Pet

PawStep turns real-world exercise into a virtual pet adventure. Your daily steps and GPS walks feed your pet's growth, unlock new maps, and power up boss challenges. During a walk, you can open an AR camera view and see your pet exploring the world around you.

Built with React Native + Expo for iOS and Android.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [First-Time Setup](#first-time-setup)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [For Designers — Changing Assets](#for-designers--changing-assets)
- [For Designers — Changing the Theme](#for-designers--changing-the-theme)
- [Adding a New Screen](#adding-a-new-screen)
- [Adding a New Database Table](#adding-a-new-database-table)
- [Code Quality](#code-quality)

---

## Tech Stack

| Layer         | Library                    | Purpose                                                           |
| ------------- | -------------------------- | ----------------------------------------------------------------- |
| Framework     | React Native + Expo SDK 56 | Cross-platform iOS/Android                                        |
| Language      | TypeScript (strict)        | Type safety across the codebase                                   |
| Navigation    | React Navigation 7         | Screen routing and tab bar                                        |
| State         | Zustand                    | Global app state (pet, steps, progress)                           |
| Local DB      | expo-sqlite                | Offline-first persistence                                         |
| AR            | @reactvision/react-viro    | Pet appears in the real world via camera                          |
| Steps         | expo-sensors (Pedometer)   | Phone step counter chip — official Expo SDK, no smartwatch needed |
| GPS           | expo-location              | Walk tracking and exploration events                              |
| Maps          | react-native-maps          | Displaying past walks                                             |
| Notifications | expo-notifications         | Pet mood alerts, daily reminders                                  |
| IAP           | react-native-iap           | Token bundles and cosmetic purchases                              |
| JSI bridge    | react-native-nitro-modules | JSI bridge layer required by react-native-iap v15                 |
| Build         | EAS Build + EAS Submit     | Cloud builds for iOS and Android                                  |

---

## Prerequisites

Before setting up, make sure you have:

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **npm 10+** — comes with Node
- **EAS CLI** — `npm install -g eas-cli`
- **Expo account** — [expo.dev](https://expo.dev) (free)
- A **physical iOS or Android device** — the app uses native AR and step-counter modules that do not run in a simulator

> **Why can't I use Expo Go?**
> The AR library (`@reactvision/react-viro`) and step-counter module ship native code that Expo Go does not include. We use a custom dev client instead — it works exactly like Expo Go (QR code, live reload) but with our native modules baked in.

---

## First-Time Setup

**1. Clone the repo and install dependencies**

```bash
git clone https://github.com/aalsmeerwtmh-maker/project115.git
cd project115
npm install
```

> **New Architecture is enabled** (`newArchEnabled: true` in `app.config.ts`). This is required by `react-native-reanimated` 4.x, `react-native-worklets`, and `react-native-iap` v15, all of which include hard Gradle guards that fail builds on Old Architecture. `patch-package` applies automatically during `npm install` (via the `postinstall` script) and fixes a Viro build conflict that would otherwise occur under New Architecture.

**2. Log in to EAS**

```bash
eas login
```

**3. Build the custom dev client onto your device**

This only needs to be done once (and again whenever a new native module is added).

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

- **iOS** — you'll need to register your device first: `eas device:create`. The build is then installed via the EAS install link or TestFlight.
- **Android** — EAS produces a `.apk` you can install directly by sideloading.

**4. Set up environment variables**

Copy the example env file and fill in values:

```bash
cp .env.example .env
```

Required keys:

| Key                       | Where to get it                                                                 |
| ------------------------- | ------------------------------------------------------------------------------- |
| `GOOGLE_MAPS_ANDROID_KEY` | [Google Cloud Console](https://console.cloud.google.com) → Maps SDK for Android |

> iOS uses Apple Maps by default and does not need a key.

---

## Running the App

Once the dev client is installed on your device:

```bash
npm start
```

Scan the QR code with the PawStep dev client app (not the regular Expo Go app). The JS bundle will load and hot-reload as you edit files.

Other useful commands:

```bash
npm run typecheck   # TypeScript type check (no output = all good)
npm run lint        # ESLint check
npm run format      # Auto-format all files with Prettier
npm run doctor      # Check for Expo SDK version mismatches
```

---

## Project Structure

```
project_kah_en/
├── App.tsx                        # Entry point — mounts providers and navigation
├── app.config.ts                  # Expo config: permissions, bundle IDs, plugins
├── eas.json                       # EAS Build profiles (development / preview / production)
├── assets/                        # Static assets (see "For Designers" below)
│   ├── icon.png                   # App icon (all platforms)
│   ├── splash-icon.png            # Splash screen image
│   ├── android-icon-foreground.png # Android adaptive icon foreground layer
│   ├── pets/                      # 2D pet sprites used on the Home screen
│   └── ar/                        # 3D pet models (.glb) used in AR scenes
├── patches/                       # patch-package patches for dependency fixes
│   └── @reactvision+react-viro+2.55.0.patch  # neutralizes Viro's broken AGP downgrade
└── src/
    ├── navigation/                # Screen routing
    │   ├── RootNavigator.tsx      # Root stack (Onboarding → Main tabs / AR modal)
    │   ├── BottomTabs.tsx         # The four main tabs
    │   └── types.ts               # TypeScript route param types
    ├── screens/                   # One folder per screen
    │   ├── home/                  # Pet display, daily step ring, mood
    │   ├── walks/                 # Walk session, map, AR launch
    │   ├── goals/                 # Streak calendar, boss challenges
    │   ├── profile/               # Pet roster, settings
    │   └── onboarding/            # First-launch flow
    ├── components/                # Reusable UI pieces shared across screens
    │   ├── PetAvatar.tsx          # Pet sprite component
    │   ├── StepRing.tsx           # Animated circular step progress
    │   └── PrimaryButton.tsx      # Main CTA button
    ├── stores/                    # Zustand global state (one file per domain)
    │   ├── petStore.ts            # Active pet data
    │   ├── stepStore.ts           # Today's step count and distance
    │   ├── progressStore.ts       # Streaks, tokens, unlocked maps
    │   └── settingsStore.ts       # User preferences (goal, notifications)
    ├── hooks/                     # React hooks wrapping native APIs
    │   ├── useStepCounter.ts      # Step counter sensor subscription
    │   ├── useLocation.ts         # GPS location during walks
    │   └── usePet.ts              # Read/update the active pet
    ├── db/                        # SQLite persistence layer
    │   ├── client.ts              # Drizzle instance (db) + initDb() migration runner
    │   ├── schema.ts              # All table definitions — the source of truth for the DB shape
    │   ├── drizzle/               # Generated migration files (do not edit manually)
    │   └── repositories/          # Type-safe query functions using the Drizzle query builder
    │       ├── pets.ts
    │       ├── steps.ts
    │       ├── progress.ts
    │       ├── events.ts
    │       └── equipment.ts
    ├── game/                      # Pure game logic — no React, fully unit-testable
    │   ├── growthFormula.ts       # steps → food → pet growth calculation
    │   ├── tokens.ts              # Token earn/spend rules
    │   ├── streaks.ts             # Consecutive-day streak logic
    │   └── bosses.ts              # Boss definitions and unlock conditions
    ├── ar/                        # AR scenes (Viro)
    │   ├── PetARScene.tsx         # Pet anchored to a real ground plane
    │   ├── ImageMarkerScene.tsx   # Location events triggered by camera scanning
    │   └── arResources.ts         # Paths to 3D models and image markers
    ├── services/                  # Wrappers for external APIs
    │   ├── notifications.ts       # Schedule / cancel push notifications
    │   ├── iap.ts                 # In-app purchase flow
    │   └── analytics.ts           # Analytics stub (provider TBD)
    ├── theme/                     # Visual design tokens
    │   ├── colors.ts              # Brand color palette
    │   ├── spacing.ts             # Margin/padding scale
    │   └── typography.ts          # Font sizes and weights
    └── utils/
        ├── date.ts                # YYYY-MM-DD formatting, unix ms helpers
        └── id.ts                  # UUID generation for DB rows
```

---

## For Designers — Changing Assets

All static assets live in the `assets/` folder at the project root.

### App icon and splash screen

| File                                 | Used for                         | Recommended size                                |
| ------------------------------------ | -------------------------------- | ----------------------------------------------- |
| `assets/icon.png`                    | iOS and Android app icon         | 1024 × 1024 px                                  |
| `assets/splash-icon.png`             | Splash screen logo               | 200 × 200 px (centered on white/cream)          |
| `assets/android-icon-foreground.png` | Android adaptive icon foreground | 1024 × 1024 px (safe zone: center 640 × 640 px) |

Just replace the file — keep the exact same filename. EAS Build picks up the new image automatically on the next build.

### Pet sprites (2D — used on the Home screen)

Place sprite files in `assets/pets/`. They are referenced from the `PetAvatar` component in `src/components/PetAvatar.tsx`. Format: **PNG with transparency**.

### 3D pet models (used in AR)

Place `.glb` model files in `assets/ar/`. They are referenced from `src/ar/arResources.ts`. Only `.glb` (binary glTF) is supported by the AR library — `.fbx` and `.obj` must be converted first.

> Free converter: [Blender](https://blender.org) can import .fbx/.obj and export .glb.

---

## For Designers — Changing the Theme

All design tokens are in `src/theme/`. You do not need to touch any screen or component files to change the visual style.

### Colors — `src/theme/colors.ts`

```ts
export const colors = {
  primary: '#F5A623', // warm orange — buttons, highlights, step ring fill
  background: '#FDF8E8', // cream white — main app background
  // add more here as the palette grows
} as const;
```

Change the hex values to update the color everywhere it is used across the app.

### Spacing — `src/theme/spacing.ts`

Defines the margin/padding scale (e.g. `spacing.sm`, `spacing.md`, `spacing.lg`). Edit the values here instead of using magic numbers in component files.

### Typography — `src/theme/typography.ts`

Font sizes, line heights, and font weights. If you want to use a custom font, load it via `expo-font` in `App.tsx` and reference the font family name here.

---

## Adding a New Screen

1. Create a folder under `src/screens/yourscreen/` with a `YourScreen.tsx` file.
2. Add the screen name and params to the appropriate type in `src/navigation/types.ts`.
3. Register the screen in `src/navigation/RootNavigator.tsx` (for full-screen/modal) or `src/navigation/BottomTabs.tsx` (for a new tab).
4. Navigate to it from another screen with:

```ts
navigation.navigate('YourScreen', { param: value });
```

---

## Adding a New Database Table

1. Add the table to `src/db/schema.ts` using Drizzle table definitions.
2. Run `npm run db:generate` — Drizzle Kit reads the schema diff and writes a new `.sql` file into `src/db/drizzle/`.
3. Open `src/db/client.ts`, import the new `.sql` file, and add its tag to `migrationFiles`.
4. Create a repository file at `src/db/repositories/your_table.ts` with typed query functions using the Drizzle query builder.
5. Call the repository from a Zustand store or a custom hook — never directly from a screen component.

> Never modify or delete an existing migration file. Users who already have the app installed have already run those migrations. Always generate a new one via `npm run db:generate`.

---

## Code Quality

Before opening a pull request, make sure these all pass:

```bash
npm run typecheck   # must be clean (zero errors)
npm run lint        # must be clean (zero errors)
```

Format your code before committing:

```bash
npm run format
```

**A few conventions to follow:**

- Screen-local components go inside the screen's own folder (`src/screens/yourscreen/components/`). Cross-screen components go in `src/components/`.
- `src/game/` is pure TypeScript — no React imports, no SQLite. This keeps the game logic unit-testable without a device or simulator.
- All hardcoded UI strings must go in `src/i18n/en.ts` (not inline in JSX). This makes adding Traditional Chinese (zh-TW) easier later.
- Do not call database repositories directly from screen components. Go through a Zustand store or a custom hook.
