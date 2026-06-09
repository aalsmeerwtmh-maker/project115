# PawStep Project Instructions

This document provides architectural context, development conventions, and operational guidance for working on the PawStep codebase.

## Project Overview
PawStep is a virtual pet adventure app that turns real-world exercise (step counting) into game progress. It is built with React Native and Expo SDK 56, featuring an offline-first architecture with a local SQLite database and Augmented Reality (AR) integration.

### Core Technologies
- **Framework:** React Native + Expo (SDK 56).
- **Language:** TypeScript (Strict Mode).
- **Architecture:** React Native New Architecture (`newArchEnabled: true`).
- **State Management:** Zustand (hydrated from DB).
- **Database:** expo-sqlite + Drizzle ORM.
- **AR:** @reactvision/react-viro (Viro AR).
- **IAP:** react-native-iap v15 (NitroModules/JSI-based).

## Building and Running

### Prerequisites
- Node.js 20+
- npm 10+
- EAS CLI (`npm install -g eas-cli`)
- Physical iOS or Android device (AR and Step Counter do not work in simulators).

### Key Commands
- **Start Metro:** `npm start` (Runs `expo start --dev-client`).
- **Android Dev Build:** `npx eas build --profile development --platform android`.
- **iOS Dev Build:** `npx eas build --profile development --platform ios`.
- **Run Android:** `npm run android` (After building dev client).
- **Run iOS:** `npm run ios` (After building dev client).
- **Database Migration:** `npm run db:generate` (Generates SQL and bundles it into `src/db/migrations.ts`).
- **Tests:** `npm test` (Jest).
- **Lint & Format:** `npm run lint` and `npm run format`.
- **Typecheck:** `npm run typecheck`.

## Development Conventions

### 1. New Architecture
The project **requires** the React Native New Architecture. Do not attempt to downgrade or bypass this, as core dependencies like `react-native-reanimated` 4.x and `react-native-iap` 15 depend on it.

### 2. Database & Persistence
- **Lazy Initialization:** The database is initialized lazily via `initDb()` in `App.tsx`. Access the DB through the `db` proxy exported from `@/db/client`.
- **Migrations:** Never edit `src/db/drizzle/` files manually. Use `npm run db:generate` to bundle migrations into `src/db/migrations.ts`.
- **Repositories:** Use the repository pattern in `src/db/repositories/` for all database interactions. Screens should interact with stores or hooks, not repositories directly.

### 3. Game Logic Isolation
- **Pure Logic:** All game balance, formulas (growth, streaks, tokens), and boss definitions live in `src/game/`. This directory must remain **pure TypeScript** with no React or native module dependencies to ensure testability.
- **Configuration:** No magic numbers. All tunable game parameters must be defined in `src/game/config.ts` under `GAME_CONFIG`.

### 4. Isolation Patterns
- **AR Isolation:** Imports from `@reactvision/react-viro` must be confined to `src/ar/` and `src/screens/walks/ARWalkScreen.tsx`.
- **IAP Isolation:** Imports from `react-native-iap` must be confined to `src/services/iap.ts`.
- **Service Wrappers:** Use the wrappers in `src/services/` for Haptics, Notifications, and Analytics.

### 5. UI & Internationalization
- **i18n:** All user-visible strings must be defined in `src/i18n/en.ts` and `src/i18n/zh-TW.ts` and accessed via the `t` proxy.
- **Clean JSX:** Keep business logic out of JSX returns. Derive values and handle logic before the return statement.
- **Theming:** Use `src/theme/` (colors, spacing, typography) for all styling. **Avoid TailwindCSS**; prefer standard StyleSheet for consistency.

## Project Structure
- `src/ar/`: Viro AR scenes and resource registration.
- `src/components/`: Shared, reusable UI components.
- `src/db/`: Schema, migrations, and typed repositories.
- `src/game/`: Pure TypeScript game mechanics and configuration.
- `src/hooks/`: Native API wrappers (Location, Pedometer, Walk Session).
- `src/navigation/`: Navigation definitions and parameter types.
- `src/screens/`: Screen components, organized by feature.
- `src/services/`: External service abstractions (IAP, Notifications).
- `src/stores/`: Zustand state management.
- `src/theme/`: Visual design tokens.
- `src/utils/`: Generic utility functions (dates, IDs).

## Known Gotchas
- **WSL2 Networking:** If developing in WSL2, use Tailscale and set `REACT_NATIVE_PACKAGER_HOSTNAME` in `.env.local`.
- **AR Placeholders:** The 3D pet model and AR markers are currently placeholders. Do not generate AI art; wait for human-authored assets from the art team.
- **Maps API Key:** Android requires `GOOGLE_MAPS_ANDROID_KEY` to be set in EAS Secrets or `.env` to prevent native crashes in walk screens.
