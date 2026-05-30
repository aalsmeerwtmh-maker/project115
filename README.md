# PawStep — Exercise with E-Pet

PawStep turns real-world exercise into a virtual pet adventure. Walk outside, count your steps, and discover new map tiles — your pet grows stronger, changes mood, and eventually faces five increasingly difficult boss challenges. During a walk you can open an AR camera view and see your pet standing on the ground in the world around you. The app runs entirely offline; all data lives on the device.

Built with React Native + Expo SDK 56 for iOS and Android. Phases 0–6 complete; Phase 7 (release prep) is in progress.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Dev Workflow](#dev-workflow)
- [Project Structure](#project-structure)
- [Game Balance Tuning](#game-balance-tuning)
- [Asset Handoff](#asset-handoff)
- [Environment Variables and Secrets](#environment-variables-and-secrets)
- [Known Limitations](#known-limitations)
- [Further Reading](#further-reading)

---

## Tech Stack

| Layer | Library | Version | Purpose |
|---|---|---|---|
| Framework | React Native + Expo | SDK 56 | Cross-platform iOS/Android |
| Language | TypeScript | ~6.0 | Strict mode throughout |
| Navigation | React Navigation | 7 | Native stack + bottom tabs |
| State | Zustand | ^5.0 | Global in-memory state (pet, steps, progress, settings) |
| Local DB | expo-sqlite + Drizzle ORM | SDK 56 / ^0.45 | Offline-first persistence with type-safe queries |
| AR | @reactvision/react-viro | ^2.55 | Pet in AR via ARKit (iOS) and ARCore (Android) |
| Step counting | expo-sensors Pedometer | SDK 56 | Phone step counter — no smartwatch required |
| GPS | expo-location | SDK 56 | Walk tracking and geofence cell discovery |
| Maps | react-native-maps | 1.27 | Past walk polylines and exploration map |
| Notifications | expo-notifications | SDK 56 | Daily reminders and pet mood alerts |
| IAP | react-native-iap | ^15 | Token bundles and cosmetic purchases |
| JSI bridge | react-native-nitro-modules | ^0.35 | Required by react-native-iap v15 |
| Animation | react-native-reanimated | 4.3 | UI animations (requires New Architecture) |
| Build | EAS Build + EAS Submit | — | Cloud builds for iOS and Android |

---

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **npm 10+** — bundled with Node
- **EAS CLI** — `npm install -g eas-cli`
- **Expo account** — [expo.dev](https://expo.dev) (free)
- **A physical iOS or Android device** — the AR library and step counter do not run in a simulator or Expo Go
- **Tailscale** (WSL2 only) — required to connect the device to the Metro bundler running inside WSL2; see [Dev Workflow](#dev-workflow)

> **Why not Expo Go?** `@reactvision/react-viro`, `expo-sensors` (Motion/ACTIVITY_RECOGNITION), and `react-native-iap` all ship native code that Expo Go does not include. We use a custom dev client that works identically to Expo Go but with our native modules baked in.

---

## Quick Start

```bash
git clone https://github.com/aalsmeerwtmh-maker/project115.git
cd project115
npm install
```

`patch-package` runs automatically via the `postinstall` script and applies `patches/@reactvision+react-viro+2.55.0.patch`, which fixes a Viro/New Architecture Gradle conflict.

**First-time per-developer setup (WSL2 + Tailscale):**

```bash
# 1. Find your personal Tailscale IP
tailscale ip -4

# 2. Create your local env file (gitignored — do not commit)
cp .env.example .env.local
# Edit .env.local and replace the placeholder with your Tailscale IP
```

Then follow the [Dev Workflow](#dev-workflow) section to build the custom dev client and start Metro.

---

## Dev Workflow

### Starting Metro

The dev machine runs WSL2. Each developer sets their own Tailscale IP in `.env.local` (see Quick Start above). Metro reads this file automatically:

```bash
npm start
```

To also clear the Metro cache (required after adding a native module or changing `babel.config.js`):

```bash
npm start -- -c
```

Scan the QR code with the PawStep dev client app (not the regular Expo Go app).

### ADB wireless debugging (WSL2, no USB)

USB passthrough to WSL2 requires extra setup. Wireless ADB is easier:

1. On the Android device, enable **Developer options** and **Wireless debugging**.
2. Tap **Pair device with pairing code** — note the IP, port, and 6-digit code.
3. In WSL2:
   ```bash
   adb pair <device-ip>:<pairing-port>
   # enter the 6-digit code when prompted
   adb connect <device-ip>:<debug-port>
   adb devices   # verify the device appears
   ```
4. The pairing port and debug port are different; both are shown in the Wireless debugging settings on the device.

### Building the dev client

The dev client must be rebuilt whenever a new native module is added. Use EAS Build so you don't need a local Xcode or Android Studio install:

```bash
# Android (installs as .apk — sideload directly)
eas build --profile development --platform android

# iOS (register your device first, then install via EAS install link)
eas device:create
eas build --profile development --platform ios
```

### EAS build profiles cheat sheet

| Profile | Distribution | Android output | iOS output | Use for |
|---|---|---|---|---|
| `development` | Internal | `.apk` | `.ipa` | Day-to-day dev client |
| `preview` | Internal | `.apk` | `.ipa` | QA / stakeholder testing |
| `production` | Store | `.aab` | `.ipa` | App Store / Play Store submission |

```bash
eas build --profile development --platform android
eas build --profile preview --platform all
eas build --profile production --platform all
```

### Running tests

```bash
npm test               # Jest — runs all test files
npm run test:watch     # Jest in watch mode
npm run test:coverage  # Jest with coverage report
npm run typecheck      # tsc --noEmit (zero output = clean)
npm run lint           # ESLint
npm run format         # Prettier (auto-fix)
```

### Adding a DB migration

1. Edit `src/db/schema.ts`.
2. Run:
   ```bash
   npm run db:generate
   ```
   This runs `drizzle-kit generate` and then `scripts/bundle-migrations.mjs`, which rewrites `src/db/migrations.ts` automatically with the new SQL bundled as a TypeScript string export.
3. Open `src/db/client.ts`, import the new export (`m0001`, `m0002`, etc.), and add it to `migrationFiles`.

Never edit `src/db/drizzle/` by hand or delete an existing migration.

---

## Project Structure

```
project_kah_en/
├── App.tsx                          # Entry point — mounts providers, calls initDb(), renders RootNavigator
├── app.config.ts                    # Expo config: bundle IDs, permissions, plugins, EAS project ID
├── eas.json                         # EAS Build profiles (development / preview / production)
├── scripts/
│   └── bundle-migrations.mjs        # Post-codegen script: bundles .sql files → migrations.ts
├── patches/
│   └── @reactvision+react-viro+2.55.0.patch   # Neutralizes Viro's AGP 4.1.1 downgrade (New Architecture fix)
├── assets/
│   ├── icon.png                     # App icon (iOS + Android)
│   ├── splash-icon.png              # Splash screen logo
│   ├── android-icon-foreground.png  # Android adaptive icon foreground layer
│   ├── android-icon-background.png  # Android adaptive icon background color
│   ├── android-icon-monochrome.png  # Android notification icon (monochrome)
│   ├── pets/                        # 2D pet sprites referenced by PetAvatar.tsx
│   └── ar/
│       └── markers/                 # AR image markers (placeholder PNGs — replace before demo)
└── src/
    ├── navigation/
    │   ├── RootNavigator.tsx        # Root native stack; ARWalk is a fullScreenModal here
    │   ├── BottomTabs.tsx           # Four-tab layout: Home, Walks, Goals, Profile
    │   └── types.ts                 # RootStackParamList + MainTabParamList
    ├── screens/
    │   ├── home/                    # Pet avatar, daily step ring, mood, check-in modal
    │   ├── walks/                   # Walk session, polyline map, AR launch, exploration map
    │   ├── goals/                   # Streak calendar, boss challenge list
    │   ├── boss/                    # Full-screen boss detail and result modal
    │   ├── shop/                    # Equipment shop, token bundles, IAP
    │   ├── profile/                 # Pet roster, settings (goal, notifications, language)
    │   └── onboarding/              # First-launch flow: species, goal, permissions
    ├── components/                  # Shared UI: PetAvatar, StepRing, PrimaryButton, OfflineBanner, etc.
    ├── stores/
    │   ├── petStore.ts              # Active pet data; hydrated from DB on startup
    │   ├── stepStore.ts             # Today's step count and sensor availability flag
    │   ├── progressStore.ts         # Streak, token balance, time-in-app tokens
    │   └── settingsStore.ts         # Daily goal, notifications toggle, quiet hours, locale
    ├── hooks/
    │   ├── useStepCounter.ts        # expo-sensors Pedometer subscription
    │   ├── useLocation.ts           # GPS tracking during walk sessions
    │   ├── useWalkSession.ts        # Walk orchestrator: timer, polyline, cell discovery, walk events
    │   └── usePet.ts                # Read / update the active pet via petStore
    ├── db/
    │   ├── client.ts                # Lazy Drizzle instance + initDb() migration runner + default pet seed
    │   ├── schema.ts                # All five table definitions — source of truth for the DB shape
    │   ├── migrations.ts            # AUTO-GENERATED — do not edit; run npm run db:generate
    │   ├── drizzle/                 # Generated SQL files + journal — do not edit manually
    │   └── repositories/            # Typed query functions: pets, steps, progress, events, equipment
    ├── game/                        # Pure TypeScript — no React, no native, fully unit-testable
    │   ├── config.ts                # GAME_CONFIG: all tuneable numbers live here
    │   ├── growthFormula.ts         # steps → food_earned → growth_value conversion
    │   ├── tokens.ts                # Token earn/spend rules and daily caps
    │   ├── streaks.ts               # Consecutive-day streak logic and multiplier formula
    │   └── bosses.ts                # Boss unlock conditions and challenge evaluation
    ├── ar/
    │   ├── PetARScene.tsx           # Pet anchored to detected ground plane (placeholder sphere until GLB delivered)
    │   ├── ImageMarkerScene.tsx     # Location events triggered by camera scanning image markers
    │   └── arResources.ts           # Animation registration, material definitions, marker target registration
    ├── services/
    │   ├── iap.ts                   # react-native-iap wrapper (ISOLATION: only file that imports from rn-iap)
    │   ├── notifications.ts         # expo-notifications wrapper (ISOLATION: only file that imports from expo-notifications)
    │   ├── haptics.ts               # Named haptic feedback functions (reward, success, selection)
    │   └── analytics.ts             # Stub — provider to be chosen in Phase 7
    ├── theme/
    │   ├── colors.ts                # Brand palette: primary orange, cream background, semantic colors
    │   ├── spacing.ts               # 4-pt grid (xs/sm/md/lg/xl/xxl) + border radius scale
    │   └── typography.ts            # Font sizes, weights, and line heights
    ├── i18n/
    │   ├── en.ts                    # English strings
    │   ├── zh-TW.ts                 # Traditional Chinese strings
    │   └── index.ts                 # `t` proxy — reads current locale from settingsStore at render time
    └── utils/
        ├── date.ts                  # YYYY-MM-DD formatting, unix-ms helpers
        └── id.ts                    # UUID generation for DB row IDs
```

---

## Game Balance Tuning

All tuneable game numbers live in `src/game/config.ts` under `GAME_CONFIG`. Edit that file — never hardcode numbers elsewhere.

See [docs/customization.md](docs/customization.md) for a complete annotated reference of every field.

---

## Asset Handoff

The art team must supply several files before the app is demo-ready. A complete checklist with exact specs is in [docs/assets.md](docs/assets.md).

Summary of what is still needed:
- `assets/ar/pet.glb` — the 3D pet model for AR
- Real AR image markers (3 files) to replace the current placeholder PNGs in `assets/ar/markers/`
- Equipment sprite images for all 7 shop items

---

## Environment Variables and Secrets

| Variable | Platform | How to set | Purpose |
|---|---|---|---|
| `GOOGLE_MAPS_ANDROID_KEY` | Android only | EAS secret (production) or `.env` (local dev) | Google Maps SDK for the walk history and exploration map |

iOS uses Apple Maps and requires no key.

To add the key to EAS:
```bash
eas env:create --scope project --name GOOGLE_MAPS_ANDROID_KEY --value <your-key>
```

For local development, create a `.env` file at the project root (it is gitignored):
```
GOOGLE_MAPS_ANDROID_KEY=your_key_here
```

---

## Known Limitations

- **Offline banner requires a dev client rebuild** after `@react-native-community/netinfo` is installed. If the banner does not appear, rebuild the dev client.
- **AR image markers use placeholder images.** The `markerAlpha`, `markerBeta`, and `markerGamma` targets in `arResources.ts` point to placeholder PNGs. Camera scanning will not trigger recognition events until real images are substituted.
- **Equipment shop items have no images.** `ShopItemCard.tsx` renders a placeholder view for all items because no equipment sprites have been delivered yet.
- **Analytics provider is a stub.** `src/services/analytics.ts` exports a no-op `analytics.track()`. The provider will be chosen and wired up in Phase 7.
- **No backend sync.** All data is local. A user-triggered sync mechanism is planned but not implemented.

---

## Further Reading

| Document | Contents |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Data flow, layer rules, navigation structure, state management, key design decisions |
| [docs/customization.md](docs/customization.md) | Game balance tuning, UI theme, text copy, notifications — the "change things quickly" guide |
| [docs/assets.md](docs/assets.md) | Complete art handoff checklist with exact specs and wiring instructions |
| [docs/dev-workflow.md](docs/dev-workflow.md) | Day-to-day developer guide: environment setup, common tasks, error reference |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines and code review checklist |
