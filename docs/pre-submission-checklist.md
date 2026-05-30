# PawStep — Pre-Submission Checklist

Complete every item before triggering a production build and store submission.
Items marked with a store badge (iOS / Android) apply only to that platform.

---

## Assets

- [ ] `assets/icon.png` — 1024 × 1024 px, no transparency (replaces template)
- [ ] `assets/splash.png` — final splash screen image
- [ ] `assets/android-icon-foreground.png` — adaptive icon foreground layer
- [ ] `assets/notification-icon.png` — white-on-transparent PNG; uncomment `icon:` in `expo-notifications` plugin config in `app.config.ts`
- [ ] `assets/ar/pet.glb` — final 3D pet model (replace sphere placeholder in `src/ar/PetARScene.tsx`)
- [ ] `assets/ar/markers/placeholder_alpha.png` — replaced with real image target
- [ ] `assets/ar/markers/placeholder_beta.png` — replaced with real image target
- [ ] `assets/ar/markers/placeholder_gamma.png` — replaced with real image target
- [ ] `assets/pets/` — 2D pet sprites for Home screen (dog, cat, fox × 4 life stages)
- [ ] Equipment sprites for all 7 catalog items: hat_beanie, hat_crown, hat_tophat, acc_bowtie, acc_scarf, bg_forest, bg_citynight

---

## EAS Secrets

All secrets must be set before `eas build --profile production` runs. Verify with `eas env:list`.

- [ ] `GOOGLE_MAPS_ANDROID_KEY` — Android map API key (Google Cloud Console)
- [ ] `SENTRY_DSN` — Sentry project DSN (Sentry dashboard → Project Settings → Client Keys)
- [ ] `SENTRY_AUTH_TOKEN` — for source-map upload during EAS build (Sentry → Account → API Tokens)

---

## IAP Products

All 5 products must be in **"Ready to Submit"** (iOS) or **"Active"** (Android) state before submitting.

- [ ] `pawstep.tokens.small` — 100 tokens / $0.99 (iOS + Android)
- [ ] `pawstep.tokens.medium` — 300 tokens / $2.49 (iOS + Android)
- [ ] `pawstep.tokens.large` — 700 tokens / $4.99 (iOS + Android)
- [ ] `pawstep.item.tophat` — Dapper Top Hat cosmetic item (iOS + Android)
- [ ] `pawstep.item.citynight` — City at Night background (iOS + Android)

---

## Account Setup

### iOS

- [ ] Apple Developer Program account active and in good standing
- [ ] App created in App Store Connect with a numeric App ID
- [ ] `app.config.ts` `ios.appStoreUrl` updated with real numeric ID (replace `idPLACEHOLDER`)
- [ ] Distribution certificate and provisioning profile configured (EAS manages this automatically)
- [ ] `eas.json` submit block: `appleId`, `ascAppId`, `appleTeamId` filled (replace PLACEHOLDER)

### Android

- [ ] Google Play Developer account active and in good standing
- [ ] App created in Google Play Console
- [ ] `google-play-service-account.json` downloaded from Google Play Console → Setup → API access; present at repo root (not committed)
- [ ] Service account granted "Release manager" role in Google Play Console

---

## Legal Screens

- [ ] `PrivacyPolicyScreen.tsx` — `Last updated:` date reflects actual submission date
- [ ] `PrivacyPolicyScreen.tsx` — Policy URL replaced with live hosted URL
- [ ] `PrivacyPolicyScreen.tsx` — Contact email replaced (`PLACEHOLDER@example.com`)
- [ ] `TermsScreen.tsx` — `Last updated:` date reflects actual submission date
- [ ] `TermsScreen.tsx` — Contact email replaced (`PLACEHOLDER@example.com`)
- [ ] Privacy policy is hosted at a publicly accessible URL before submission

---

## `app.config.ts` Checks

- [ ] `version` bumped to release version (e.g. `'1.0.0'`)
- [ ] `ios.appStoreUrl` has real numeric App Store ID
- [ ] `sentryDsn` reads from `process.env.SENTRY_DSN` (already correct — verify EAS secret is set)
- [ ] `ios.privacyManifests` block present (Phase 7 — already added)
- [ ] `expo-notifications` plugin `icon:` field uncommented and pointing to final asset

---

## Build Verification

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npm test` — all tests pass (no regressions)
- [ ] `npx expo-doctor` — no issues reported

---

## Device Testing (Pre-flight)

Test on at least one physical iOS device and one physical Android device.

- [ ] Fresh install (no previous data): onboarding flow runs, pet selection works, "Let's go!" routes to Main
- [ ] Permission prompts appear: Location, Motion (iOS), Notifications — tapping Allow grants correctly
- [ ] Daily check-in modal appears on first open of a new day; does not re-appear same day
- [ ] All 5 bosses are reachable and completable with qualifying stats
- [ ] IAP sandbox purchase completes and credits correct token amount
- [ ] AR pet renders on a flat surface without crash (iPhone with LiDAR preferred)
- [ ] Exploration map shows visited cells as polygons
- [ ] Walk event modal appears during a walk session
- [ ] Offline banner appears in Airplane Mode; disappears on reconnect
- [ ] VoiceOver (iOS) / TalkBack (Android): all interactive elements announce meaningful labels
- [ ] Both legal screens open from Profile → About section and can be dismissed

---

## Performance Targets

- [ ] Cold start < 3 s on mid-tier 2022 Android device
- [ ] AR scene ≥ 30 FPS sustained on iPhone 15 (confirm with `debug={true}` Viro flag in dev build)
- [ ] No single asset in `dist/` output exceeds 5 MB (run `npx expo export --platform android`)

---

## Sentry Verification

- [ ] Sentry receives a test breadcrumb when a walk is started in a production build
- [ ] `ErrorBoundary.componentDidCatch` sends exception to Sentry (verify with a deliberate dev-mode throw before final build)
- [ ] Sentry source maps are uploaded during EAS build (check Sentry → Releases after build)

---

## Store Listing (Final Copy)

- [ ] App name, subtitle, description loaded into App Store Connect / Google Play Console (see `docs/store-listing.md`)
- [ ] All 6 iPhone 6.7" screenshots uploaded
- [ ] Feature graphic uploaded to Google Play (1024 × 500 px)
- [ ] Keywords set in App Store Connect (≤ 100 characters)
- [ ] Privacy policy URL set in both consoles
- [ ] Age rating configured
- [ ] All IAP items in correct state

---

## Final Build + Submit Commands (in order)

```bash
# 1. Verify clean working tree
git status

# 2. Build for both platforms
eas build --profile production --platform all

# 3. Wait for both builds to complete successfully, then submit
eas submit --profile production --platform ios
eas submit --profile production --platform android
```
