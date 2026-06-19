# Dev Workflow

Day-to-day guide for working in this repository. Covers environment setup, common tasks, and error reference.

---

## Environment setup

### Per-developer setup (do this once)

Each developer has their own Tailscale IP and must create a local `.env.local` file (gitignored — never committed):

```bash
# 1. Find your Tailscale IP
tailscale ip -4

# 2. Create .env.local from the example
cp .env.example .env.local
# Then edit .env.local and replace the placeholder with your actual Tailscale IP
```

`.env.local` contains:
```
REACT_NATIVE_PACKAGER_HOSTNAME=<your-tailscale-ip>
```

Metro reads `.env.local` automatically on `npm start`.

### WSL2 + Tailscale

The Metro bundler runs inside WSL2, but the physical device needs to reach it over the network. WSL2 does not expose itself on the local LAN by default.

**The fix:** Tailscale creates a VPN mesh that gives both the WSL2 instance and the physical device stable IPs that can reach each other. Each developer sets their own Tailscale IP in `.env.local` (see above).

Prerequisites:
- Tailscale installed and logged in on both the Windows host (and by extension WSL2) and the Android/iOS device.
- Both devices joined to the same Tailscale network (tailnet).

### ADB wireless debugging (no USB required)

USB passthrough into WSL2 is complex. Use wireless ADB instead:

1. On the Android device, open **Settings → Developer options → Wireless debugging**.
2. Tap **Pair device with pairing code**. Note the IP address, pairing port, and 6-digit code.
3. In WSL2:

```bash
adb pair <device-ip>:<pairing-port>
# type the 6-digit code when prompted
adb connect <device-ip>:<debug-port>
adb devices   # should show: <device-ip>:<debug-port>  device
```

Note: the pairing port (shown during the pair step) is different from the debug port (shown on the main Wireless debugging screen). Both are needed.

---

## EAS build commands cheat sheet

```bash
# Install EAS CLI (one-time)
npm install -g eas-cli
eas login

# Development builds (custom dev client)
eas build --profile development --platform android    # produces .apk
eas build --profile development --platform ios        # produces .ipa

# Preview builds (QA / stakeholder)
eas build --profile preview --platform all

# Production builds (store submission)
eas build --profile production --platform all

# Register a new iOS device (required before building for that device)
eas device:create

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

Rebuild the dev client whenever:
- A new native module is added
- `app.config.ts` plugins section changes
- `patches/` changes

---

## Adding a new screen

1. Create a folder under `src/screens/`:
   ```
   src/screens/myfeature/
   ├── MyFeatureScreen.tsx
   └── components/           (optional, for screen-local components)
   ```

2. Add the screen name and params to `src/navigation/types.ts`:
   ```ts
   export type RootStackParamList = {
     // existing entries...
     MyFeature: { itemId: string };  // undefined if no params
   };
   ```

3. Register the screen in the appropriate navigator:
   - **Full-screen or modal**: add a `<Stack.Screen>` to `src/navigation/RootNavigator.tsx`.
   - **New tab**: add a `<Tab.Screen>` to `src/navigation/BottomTabs.tsx` (only four tabs are currently defined; adding a fifth requires design approval).

4. Add i18n keys for all strings the screen will display (see [customization.md — Text Copy](customization.md#section-3--text-copy)).

5. Navigate to it from another screen:
   ```ts
   navigation.navigate('MyFeature', { itemId: '123' });
   ```

---

## Adding a new DB column or table

### Adding a column to an existing table

1. Edit `src/db/schema.ts` — add the column definition to the relevant `sqliteTable()` call.
2. Run:
   ```bash
   npm run db:generate
   ```
   This runs `drizzle-kit generate` (which writes a new `.sql` file to `src/db/drizzle/` and updates `_journal.json`) and then runs `scripts/bundle-migrations.mjs` (which rewrites `src/db/migrations.ts`).

3. Open `src/db/client.ts`. Import the new export from `migrations.ts` and add it to `migrationFiles`:
   ```ts
   import { m0000, m0001 } from './migrations';

   const migrationFiles: Record<string, string> = {
     m0000,
     m0001,  // ← add
   };
   ```

4. Update the relevant repository file in `src/db/repositories/` to use the new column.

### Adding a new table

Follow the same steps above, plus:
- Create a new repository file at `src/db/repositories/your_table.ts`.
- Export inferred types from `src/db/schema.ts`: `typeof yourTable.$inferSelect` and `.$inferInsert`.
- Wire the repository into the appropriate Zustand store or custom hook.

### Rules

- Never modify or delete an existing migration file. Users who have already installed the app have already run those migrations.
- Never edit files in `src/db/drizzle/` by hand.
- Migration export keys must follow the format `m0000`, `m0001`, etc. — not the Drizzle-generated tag name.

---

## Adding a game balance number

All tuneable numbers belong in `src/game/config.ts` under `GAME_CONFIG`. Never hardcode them elsewhere.

1. Add the field to the appropriate interface in `config.ts` (or to `GameConfig` if it belongs at the top level).
2. Set an initial value in the `GAME_CONFIG` constant.
3. Import `GAME_CONFIG` in the file that uses the value.

Example:
```ts
// config.ts
export interface TokenEarnRates {
  // existing fields...
  newEventBonus: number;
}

export const GAME_CONFIG: GameConfig = {
  tokenEarnRates: {
    // existing fields...
    newEventBonus: 15,
  },
  // ...
};

// elsewhere
import { GAME_CONFIG } from '@/game/config';
const bonus = GAME_CONFIG.tokenEarnRates.newEventBonus;
```

---

## Running the test suite

```bash
npm test                  # run all tests once
npm run test:watch        # watch mode
npm run test:coverage     # with coverage report

npm run typecheck         # TypeScript type-check (zero output = clean)
npm run lint              # ESLint
npm run format            # Prettier auto-fix
```

Tests live in `__tests__/` at the project root. The Jest config in `jest.config.js` uses `jest-expo` preset. Game logic in `src/game/` is fully unit-testable without a device.

---

## Common errors and fixes

| Symptom | Cause | Fix |
|---|---|---|
| `migrate()` throws `"migration not found: 0000_third_brother_voodoo"` | `migrationFiles` key used the Drizzle tag name instead of the `m0000` format | Change the key in `migrationFiles` to `m0000` (or `m0001`, etc.) |
| White screen after QR scan | Device cannot reach Metro (Tailscale not active, or wrong IP) | Ensure Tailscale is running on both machines; verify `REACT_NATIVE_PACKAGER_HOSTNAME=100.69.13.58`; add `-c` flag to clear cache |
| AR scene shows nothing / pet sphere invisible | `ViroARPlaneSelector alignment` is wrong | Use `alignment="Horizontal"` not `"HorizontalUpward"` |
| Pet animation stops after plane selection | `ViroAnimatedComponent` this-binding bug on re-render | Apply `animation` prop directly on `<ViroSphere>` (or `<Viro3DObject>`) — do not wrap in `ViroAnimatedComponent` |
| App crashes on Walks screen before JS error boundary renders (Android) | `react-native-maps` triggers a native crash when the Google Maps API key is missing or invalid | Set `GOOGLE_MAPS_ANDROID_KEY` in EAS secrets or in `.env`; run `eas build --profile development --platform android` to pick up the new key |
| `babel-plugin-inline-import` has no effect on SQL imports | Plugin runs in Babel but Metro does not re-evaluate the transformed output correctly | Use the `migrations.ts` bundle pattern — run `npm run db:generate` which calls `bundle-migrations.mjs` |
| `npm install` fails with peer dependency errors | Some React Native community packages declare peer deps that don't account for Expo SDK's RN fork version | Use `npm install --legacy-peer-deps` (documented workaround, not a bug) |
| Offline banner does not appear | `@react-native-community/netinfo` native module was added but the dev client has not been rebuilt | Run `eas build --profile development` to rebuild the dev client with the new native module |
| Type error: `navigation.navigate('SomeName')` not assignable | Screen not added to the param type list | Add the screen name to `RootStackParamList` or `MainTabParamList` in `src/navigation/types.ts` |
| `getDb()` called before `initDb()` error | A repository was called before `App.tsx` finished awaiting `initDb()` | Ensure `initDb()` is awaited at the very top of the `App` component or root provider before any store hydration runs |

---

## Troubleshooting: Connection & Firewall

If your phone cannot reach the Metro bundler or you cannot install the development build via ADB:

1. **Check Tailscale:** Run `tailscale status`. Ensure both your PC and Phone are listed and "online".
2. **Firewall:** Run the following command in an **Administrator** PowerShell:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/fix-firewall.ps1
   ```
3. **Network Profile:** Ensure your connection (Ethernet/WiFi) is set to **Private** in Windows Settings if you are on a trusted network.
4. **Metro IP:** Verify `.env.local` contains `REACT_NATIVE_PACKAGER_HOSTNAME=<your-tailscale-ip>`.

---

## Performance baselines

Measured on a mid-tier 2022 Android device (Snapdragon 778G, 6 GB RAM) using a production-profile build.

### Cold start

| Metric | Target | Notes |
|---|---|---|
| Time to first frame | < 3 s | Measured from process start to NavigationContainer rendered |
| DB migration (first launch) | < 200 ms | WAL mode + single migration |
| Store hydration | < 100 ms | Zustand + SQLite KV reads |

Optimization applied in Phase 7: `scheduleDailyWalkReminder` and `initIAP()` are now deferred via `InteractionManager.runAfterInteractions`, moving them out of the synchronous bootstrap path.

To profile cold start: use Android Studio's CPU profiler or `adb shell am start -W com.pawstep.app/.MainActivity` and read the `TotalTime` output.

### AR scene (ViroARSceneNavigator)

| Metric | Target | Notes |
|---|---|---|
| Sustained AR frame rate | ≥ 30 FPS | Measured on iPhone 15 and Pixel 7 |
| AR session startup (plane detection) | < 5 s on a textured surface | LiDAR-equipped iOS devices are faster |

Optimization applied in Phase 7: `shadowsEnabled={false}` on `ViroARSceneNavigator` — shadow mapping is the single largest per-frame GPU cost on mobile AR and is not visually critical for this use case.

To profile AR FPS: enable the Viro FPS counter via `debug={true}` on `ViroARSceneNavigator` in a development build (remove before production build).

### Bundle size

Run `npx expo export --platform android` and inspect the `dist/` output. Flag any individual asset over 5 MB. The `pet.glb` 3D model is the most likely candidate; compress with `gltfpack -i pet.glb -o pet-compressed.glb` if needed.

---

## EAS Secrets Reference

All secrets are set at the EAS project scope. Replace `<value>` with the real credential.

```bash
# Set a secret
eas env:create --name SECRET_NAME --value <value> --scope project

# List secrets (values are masked)
eas env:list
```

| Secret name | Where to get it | Required for |
|---|---|---|
| `GOOGLE_MAPS_ANDROID_KEY` | Google Cloud Console → APIs & Services → Credentials → Android API key | Android map tiles in all build profiles |
| `SENTRY_DSN` | Sentry dashboard → Project Settings → Client Keys (DSN) | Crash reporting in production builds; needs `@sentry/react-native` installed + dev client rebuild |
| `SENTRY_AUTH_TOKEN` | Sentry → Account → API Tokens (scope: `project:releases`) | Sentry source-map upload during EAS build (add to `app.config.ts` Sentry plugin config) |
