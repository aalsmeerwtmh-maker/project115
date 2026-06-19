# iOS Test Build Without a Paid Apple Account

This guide covers producing an **iOS development build for a physical iPhone** when:

- There is **no paid Apple Developer Program** membership ($99/yr) available — not yours, not the team's.
- The dev machine is **Windows/WSL2** (no local macOS).

It is meant for **testing on a real device** (step counting, GPS, walks, AR) before Phase 7. The
simulator is **not** an option here — the iOS Simulator cannot generate CoreMotion step data, so it
cannot exercise the core step/GPS flow.

> **TL;DR:** The only $0 path is **free provisioning** — a *free* Apple ID + a Mac running Xcode.
> EAS cloud builds cannot help, because a device `.ipa` must be code-signed and a free Apple ID
> cannot create the provisioning profiles EAS needs. A Mac is unavoidable for the final compile +
> sign step; everything before it is already done on the WSL2 side (see below).

---

## Why EAS / Expo Go don't apply

| Option | Works here? | Why |
|---|---|---|
| Expo Go | ❌ | Native modules (Viro, `react-native-iap`, maps, reanimated 4) aren't in Expo Go. |
| iOS Simulator build | ❌ | No CoreMotion step data; faking GPS doesn't test the real walk flow. |
| EAS cloud **device** build | ❌ | Device `.ipa` must be signed; a free Apple ID can't create the provisioning profiles EAS requires. |
| **Free provisioning (free Apple ID + Mac + Xcode)** | ✅ | The only $0 route. Installs expire after **7 days**; re-sign weekly. |

---

## What's already done on the WSL2 side

These steps run on Linux/Windows and **do not need a Mac**. They are already applied in this repo:

1. **Generated the native iOS project** (off-Mac, no CocoaPods):
   ```bash
   npx expo prebuild -p ios --no-install
   ```
   This created `ios/` from `app.config.ts` + the config plugins. It does **not** compile.

2. **Set the Viro New Architecture flag** in `ios/.xcode.env`:
   ```sh
   export RCT_NEW_ARCH_ENABLED=1
   ```
   ViroReact requires the New Architecture; without this the Mac compile fails on Viro.

3. **Removed the Push Notifications entitlement** in `ios/PawStep/PawStep.entitlements`
   (`aps-environment`). A free Apple ID **cannot sign** the Push Notifications capability, so leaving
   it in makes signing fail. Local notifications still work; only *remote push* is disabled — a
   Phase 7 feature that isn't wired up yet anyway.

> **Reversibility:** Steps 2 and 3 edit generated files under `ios/`. Running
> `npx expo prebuild -p ios --clean` regenerates them — `aps-environment` comes back and the
> `.xcode.env` flag is lost. After any future prebuild, **re-apply steps 2 and 3** for a
> free-provisioning build, or restore them intentionally once a paid account exists. Commit `ios/`
> (consistent with the committed `android/`) so the Mac operator gets the prepared state.

---

## Mac session runbook (the only Mac-required part)

You need a Mac with **Xcode** and **CocoaPods**, plus a **free Apple ID** (a normal Apple ID — no
enrollment, no payment).

### Step 0 — Install pods (both paths)
```bash
cd ios && pod install && cd ..
```

### Path A — Borrowed / physical Mac (strongly preferred)
Plug the iPhone into the Mac via USB, then:
```bash
npx expo run:ios --device
```
In Xcode signing, select your **Personal Team** (the free Apple ID). Trust the developer profile on
the iPhone: **Settings → General → VPN & Device Management → [your Apple ID] → Trust**.

This single flow handles build + sign + install. Easiest by far.

### Path B — Cloud / rented Mac (MacinCloud, MacStadium, EC2 Mac)
A remote Mac **cannot see your physical iPhone over USB**, so signing/installing happens on your
own Windows machine instead:

1. On the cloud Mac: open `ios/PawStep.xcworkspace` in Xcode and build/archive the app into an
   `.ipa` (development signing or unsigned).
2. Download the `.ipa` to your Windows machine.
3. Install **Sideloadly** (runs on Windows), connect the iPhone over USB, and sideload the `.ipa`
   with your **free Apple ID**. In Sideloadly, enable the option to **remove the Push Notifications
   entitlement** (defense-in-depth in case it's still present) so signing succeeds.

Sideloadly registers your device and signs locally, so the phone never needs the cloud Mac.

---

## What works vs. what doesn't under free provisioning

| Feature | On a free-provisioning device build |
|---|---|
| Step counting (CoreMotion / `expo-sensors`) | ✅ Works — primary test target |
| GPS / background location | ✅ Works — primary test target |
| AR (Viro / ARKit) | ✅ Works |
| Maps (`react-native-maps`, Apple Maps) | ✅ Works |
| In-game token shop (spending **earned** tokens) | ✅ Works — fully virtual, no Apple involvement |
| Local notifications | ✅ Works |
| **Remote push notifications** | ❌ Entitlement removed; needs a paid account |
| **Real-money IAP** (`react-native-iap` token bundles) | ❌ Returns no products; needs App Store Connect setup (Phase 7) |

The two ❌ rows are Phase 7 / monetization concerns and do **not** block step/GPS testing. The app
launches and runs end-to-end; those features simply no-op.

---

## Limitations to expect

- **7-day expiry.** Free-provisioned apps stop launching after 7 days. Re-run the install flow
  weekly. Within those 7 days you can reload JS over Metro without rebuilding.
- **App / device caps.** A free Apple ID allows max 3 sideloaded apps and a limited number of
  registered devices.
- **Re-apply the two `ios/` edits** after any `expo prebuild --clean` (see Reversibility above).
