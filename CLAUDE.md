# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository State

The project skeleton is in place. The repository contains a complete Expo SDK 56 application with the following in place:

- `app.config.ts` — Expo managed-workflow config; **New Architecture is enabled** (`newArchEnabled: true`), required by `react-native-reanimated` 4.x, `react-native-worklets` 0.8.3, and `react-native-iap` 15, all of which have hard Gradle guards that reject Old Architecture builds.
- `src/navigation/` — React Navigation 7 skeleton: root native stack, four-tab bottom navigator, typed route params.
- `src/screens/` — placeholder screen components for Home, Walks, Goals, Profile, Onboarding, and ARWalk.
- `src/stores/` — Zustand store files for pet, steps, progress, and settings (stubs pending Phase 1–2 wiring).
- `src/db/` — Drizzle ORM setup: `client.ts` (database init + migration runner), `schema.ts` (all table definitions), generated migration files in `src/db/drizzle/`, and repository stubs.
- `src/services/iap.ts` — stub wrapper for `react-native-iap` v15 (NitroModules/JSI-based).
- `patches/@reactvision+react-viro+2.55.0.patch` — `patch-package` patch that neutralizes Viro's broken AGP 4.1.1 downgrade, which would otherwise conflict with New Architecture build tooling.
- `eas.json`, `tsconfig.json`, `.eslintrc.cjs`, `.prettierrc`, `babel.config.js` — full tooling configuration.

## Git Configuration

- Line endings: LF normalization is enforced via `.gitattributes` (`* text=auto`). Keep this in place for cross-platform consistency.
- Remote: `https://github.com/aalsmeerwtmh-maker/project115.git`
