# PawStep — Release Pipeline

Step-by-step guide for building and submitting PawStep to the App Store and Google Play.

---

## Prerequisites

Before running a production build, confirm all of the following:

- [ ] EAS CLI installed and logged in: `npm install -g eas-cli && eas login`
- [ ] `GOOGLE_MAPS_ANDROID_KEY` EAS secret set (Google Cloud → APIs & Services → Credentials)
- [ ] `SENTRY_DSN` EAS secret set (Sentry dashboard → Project Settings → Client Keys)
- [ ] Apple Developer Program membership active; app created in App Store Connect
- [ ] `eas.json` submit block filled: `appleId`, `ascAppId`, `appleTeamId` (replace PLACEHOLDER values)
- [ ] `google-play-service-account.json` present in the repo root (not committed — see `.gitignore`)
- [ ] Google Play Console: app created, internal testing track configured
- [ ] All IAP products registered:
  - `pawstep.tokens.small` (iOS + Android)
  - `pawstep.tokens.medium` (iOS + Android)
  - `pawstep.tokens.large` (iOS + Android)
  - `pawstep.item.tophat` (iOS + Android)
  - `pawstep.item.citynight` (iOS + Android)
- [ ] All placeholder assets replaced (see `docs/store-listing.md` — Asset Delivery Checklist)
- [ ] Privacy policy hosted at a real URL; URL updated in `PrivacyPolicyScreen.tsx` and `TermsScreen.tsx`
- [ ] Legal screen contact email updated from `PLACEHOLDER@example.com`
- [ ] `app.config.ts`: `ios.appStoreUrl` updated with real numeric App Store ID

---

## Step 1 — Bump the Version

Edit `app.config.ts`:

```ts
version: '1.0.0',   // increment for each public release
```

The `autoIncrement: true` in the `production` build profile handles the `buildNumber` (iOS) and `versionCode` (Android) automatically.

---

## Step 2 — Production Build (both platforms)

```bash
eas build --profile production --platform all
```

This triggers two parallel cloud builds on EAS:
- Android: produces an `.aab` (Android App Bundle) for Play Store upload.
- iOS: produces an `.ipa` signed with your Distribution certificate.

Monitor build progress at https://expo.dev/ or with:

```bash
eas build:list --limit 5
```

Both builds must complete successfully before proceeding to submit.

---

## Step 3 — Submit to iOS (TestFlight)

```bash
eas submit --profile production --platform ios
```

EAS Submit uses the `appleId`, `ascAppId`, and `appleTeamId` from `eas.json submit.production.ios`.

After upload:
1. In App Store Connect, navigate to your app → TestFlight.
2. Wait for Apple's automated compliance review (usually < 30 minutes).
3. Add the build to an **Internal Testing** group and invite testers.
4. After internal sign-off, add the build to an **External Testing** group (optional, requires Beta App Review).
5. When ready for public release: App Store → Prepare for Submission → select the build → Submit for Review.

---

## Step 4 — Submit to Android (Play Internal Testing)

```bash
eas submit --profile production --platform android
```

EAS Submit uploads the `.aab` to Google Play using the service account credentials at `./google-play-service-account.json`.

After upload:
1. In Google Play Console, navigate to your app → Testing → Internal testing.
2. The new build should appear within a few minutes.
3. Create a new release if it does not appear automatically.
4. Add testers via the Internal testing track.
5. When ready for wider distribution: promote to Closed testing, Open testing, or Production.

---

## Step 5 — App Store Connect Metadata Checklist

Before submitting for public review, confirm in App Store Connect:

- [ ] App name, subtitle, and description match `docs/store-listing.md`
- [ ] Keywords set (≤ 100 characters)
- [ ] All 6 screenshots uploaded for 6.7" (and iPad if enabled)
- [ ] App preview video uploaded (recommended)
- [ ] Privacy policy URL set and resolves to a live page
- [ ] Support URL set
- [ ] Age rating configured (likely 4+ or 9+)
- [ ] Content rights declaration completed
- [ ] Pricing set
- [ ] All IAP products in "Ready to Submit" state
- [ ] Export compliance answered (no encryption → answer "No")

---

## Rollback Procedure

If a production build introduces a critical regression:

### iOS

1. In App Store Connect → App Store → iOS App → Version History, find the previous version.
2. If it is still in "Ready for Sale" state and you have not yet replaced it, no action is needed for users already on the old version.
3. Expedited review is available for critical issues; submit a new build with the fix and request expedited review.
4. For TestFlight: remove the broken build from the testing group; testers will fall back to the previous build.

### Android

1. In Google Play Console → your app → Production → Releases, find the previous release.
2. Use **Halt rollout** if you are doing a staged rollout and have not reached 100%.
3. Use **Create new release** with a new version code and a fixed build to replace the broken one.
4. Google Play does not support true rollback (reverting to an older build); always fix-forward.

---

## Recurring Tasks

| Cadence | Task |
|---|---|
| Each release | Bump `version` in `app.config.ts` |
| Each release | Update "What's New" text in App Store Connect / Google Play Console |
| As needed | Update privacy policy date in `PrivacyPolicyScreen.tsx` and `TermsScreen.tsx` |
| Annually | Renew Apple Distribution certificate if it expires |
