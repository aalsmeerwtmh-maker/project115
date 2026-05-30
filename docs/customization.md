# Customization Guide

This guide is for developers who want to change things quickly without reading the full codebase. It covers four areas: game balance, UI theme, text copy, and notifications.

---

## Section 1 — Game Balance (`src/game/config.ts`)

Every tuneable game number lives in `GAME_CONFIG` in `src/game/config.ts`. Edit that file and nowhere else. The comment at the top of the file enforces this:

```
// DO NOT hardcode game-balance numbers outside this file.
```

### Token earn rates

`GAME_CONFIG.tokenEarnRates` controls how fast the player earns tokens through normal play.

| Field | Current value | Meaning |
|---|---|---|
| `checkinPerCell` | `5` | Tokens awarded each time the player enters a new ~50 m grid cell during a walk |
| `streakMilestoneEveryNDays` | `7` | A streak bonus fires every N days of consecutive goal completion |
| `streakMilestoneBonus` | `10` | Tokens awarded at each streak milestone |
| `timeInAppPerMinute` | `1` | Tokens earned per minute of active walk session; subject to the daily cap in `src/game/tokens.ts` |

To make tokens easier to earn, increase `checkinPerCell` or `timeInAppPerMinute`. To slow the economy, decrease them.

### Walk events

`GAME_CONFIG.walkEvents` controls the in-walk random pet dialogue.

| Field | Current value | Meaning |
|---|---|---|
| `intervalMinutes` | `10` | A random dialogue line fires every 10 minutes during an active walk session |
| `dialogues` | 8 entries | Pet-perspective one-liners shown in the walk event modal |

To change how often events fire, edit `intervalMinutes`. To add or remove pet dialogue lines, edit the `dialogues` array. These strings are game content, not i18n keys — they do not need to be added to `src/i18n/`.

### Boss table

`GAME_CONFIG.bosses` is an array of five bosses in progression order. Each boss definition has the following fields:

| Field | Type | Meaning |
|---|---|---|
| `id` | `string` | Unique identifier stored in `progress.boss_progress`. Never change an existing `id` — it would orphan existing save data. |
| `name` | `string` | Display name shown on the Boss screen |
| `description` | `string` | Flavour description on the boss card |
| `villainLine` | `string` | Villain taunt shown on the challenge screen before the fight |
| `requiredStreakDays` | `number` | Minimum consecutive-day streak to unlock the boss challenge |
| `requiredGrowthValue` | `number` | Minimum pet `growth_value` to unlock |
| `requiredStage` | `'baby' \| 'child' \| 'adult' \| 'elder'` | Minimum pet stage to unlock |
| `requiredStamina` | `number` | Minimum pet stamina (0–100) to unlock |
| `tokenReward` | `number` | Tokens awarded on victory |
| `retryBlockHours` | `number` | Hours the player must wait before retrying after a loss |
| `dialogues` | `string[]` | Pet-perspective win lines shown in the result modal (one is picked at random) |

Current boss progression:

| Boss | Streak | Growth | Stage | Stamina | Reward | Retry |
|---|---|---|---|---|---|---|
| Mudpaw the Rascal | 3 days | 5 | baby | 55 | 30 tokens | 12 h |
| Thornback Rex | 7 days | 25 | child | 65 | 75 tokens | 18 h |
| Ironmaw the Titan | 14 days | 50 | adult | 75 | 150 tokens | 24 h |
| Shadowhowl Prime | 21 days | 75 | elder | 90 | 250 tokens | 24 h |
| Voidstrider the Eternal | 30 days | 90 | elder | 100 | 400 tokens | 48 h |

To add a boss, append a new object to the array and add a matching entry to `src/db/repositories/progress.ts` if boss-specific persistence is needed.

### Equipment catalog

`GAME_CONFIG.equipment` is an array of seven shop items. Each has:

| Field | Type | Meaning |
|---|---|---|
| `id` | `string` | Unique identifier stored in `equipment.catalog_id`. Never change an existing `id`. |
| `name` | `string` | Display name in the shop |
| `category` | `'hat' \| 'accessory' \| 'background'` | Shop section grouping |
| `tokenCost` | `number` | Token price; `0` for items that are only purchasable via IAP |
| `iapProductId` | `string \| null` | App Store / Play Store product ID for IAP-exclusive items; `null` for token-only items |
| `assetKey` | `string` | Key used to look up the sprite image in `ShopItemCard.tsx`; matches the filename in `assets/equipment/` once images are delivered |

Current equipment and asset keys:

| Item | Category | Token cost | IAP product ID | Asset key |
|---|---|---|---|---|
| Cozy Beanie | hat | 50 | — | `hat_beanie` |
| Tiny Crown | hat | 120 | — | `hat_crown` |
| Dapper Top Hat | hat | 200 | `pawstep.item.tophat` | `hat_tophat` |
| Fancy Bow-Tie | accessory | 75 | — | `acc_bowtie` |
| Winter Scarf | accessory | 100 | — | `acc_scarf` |
| Enchanted Forest | background | 150 | — | `bg_forest` |
| City at Night | background | 400 | `pawstep.item.citynight` | `bg_citynight` |

### IAP token bundles

`GAME_CONFIG.iapBundles` defines the three token bundle products sold through the stores. These fields are for display only — actual product prices are set in App Store Connect and the Google Play Console.

| Field | Type | Meaning |
|---|---|---|
| `productId` | `string` | Must match the product ID configured in both stores exactly |
| `tokenAmount` | `number` | Tokens credited to the user when the purchase completes |
| `displayPrice` | `string` | Fallback price string shown while live prices load from the store |

Current bundles: `pawstep.tokens.small` (100 tokens / $0.99), `pawstep.tokens.medium` (300 tokens / $2.49), `pawstep.tokens.large` (700 tokens / $4.99).

---

## Section 2 — UI and Theme

All design tokens are in `src/theme/`. Change values there; the update propagates everywhere the token is used.

### Colors — `src/theme/colors.ts`

| Token | Value | Used for |
|---|---|---|
| `primary` | `#F5A623` | Buttons, step ring fill, active tab indicator |
| `primaryLight` | `#FAC76A` | Pressed states, ring track tint |
| `primaryDark` | `#C47E0F` | Button hover / focus ring |
| `background` | `#FDF8E8` | Main app background |
| `surface` | `#FFFFFF` | Cards and modals |
| `surfaceAlt` | `#FFF3D0` | Secondary card backgrounds |
| `textPrimary` | `#2C1E0F` | Headings and body copy |
| `textSecondary` | `#7A6245` | Captions and secondary labels |
| `textDisabled` | `#C4B49A` | Disabled states and placeholder text |
| `success` | `#5CB85C` | Goal reached, streak active |
| `warning` | `#F0AD4E` | Pet mood: normal, partial progress |
| `error` | `#D9534F` | Errors, missed goal |
| `info` | `#5BC0DE` | Info banners, exploration events |
| `border` | `#E8D9B5` | Dividers, ring track, card borders |
| `overlay` | `rgba(44,30,15,0.4)` | Modal backdrop |

### Typography — `src/theme/typography.ts`

| Token | Font size | Weight | Line height | Typical use |
|---|---|---|---|---|
| `heading1` | 28 | 700 | 34 | Screen titles |
| `heading2` | 22 | 700 | 28 | Section headings |
| `heading3` | 18 | 600 | 24 | Card titles |
| `body` | 16 | 400 | 22 | General body text |
| `bodyBold` | 16 | 600 | 22 | Emphasis within body |
| `caption` | 12 | 400 | 16 | Labels and metadata |
| `captionBold` | 12 | 600 | 16 | Small badges |
| `label` | 14 | 500 | 20 | Form labels and tab bar text |

The system font stack is used throughout (no custom fonts loaded in Phase 1–6). To add a custom font, load it via `expo-font` in `App.tsx` and add a `fontFamily` key to the relevant typography tokens.

### Spacing — `src/theme/spacing.ts`

All margins and paddings use this 4-pt grid:

| Token | Value | Typical use |
|---|---|---|
| `xs` | 4 | Icon-to-label gap, tight padding |
| `sm` | 8 | Inner card padding, row gap |
| `md` | 16 | Standard section padding |
| `lg` | 24 | Screen horizontal margin |
| `xl` | 32 | Large vertical gap between sections |
| `xxl` | 48 | Hero section spacing |

Border radius scale:

| Token | Value | Use |
|---|---|---|
| `radius.sm` | 6 | Tags, small badges |
| `radius.md` | 12 | Cards, input fields |
| `radius.lg` | 20 | Large modals, bottom sheets |
| `radius.full` | 9999 | Pill buttons, circular avatars |

### Per-screen edit guide

| Screen | What to change | Where |
|---|---|---|
| Home | Step ring color and track | `colors.primary` / `colors.border` in `src/theme/colors.ts` |
| Home | Mood badge labels | `src/i18n/en.ts` → `mood.*` |
| Walks | Discovery toast colors | `colors.info` in `colors.ts`; text in `en.ts` → `walks.discoveryBanner` |
| Goals | Streak calendar tile colors | `colors.success` / `colors.border` |
| Boss | Boss card layout | `src/screens/boss/components/BossCard.tsx` |
| Shop | Item card layout | `src/screens/shop/components/ShopItemCard.tsx` |
| Profile | Settings list items | `src/screens/profile/ProfileScreen.tsx` |
| Onboarding | Pet species options | `src/i18n/en.ts` → `onboarding.*` + `src/screens/onboarding/OnboardingScreen.tsx` |

---

## Section 3 — Text Copy

All user-visible strings are in `src/i18n/en.ts` (English) and `src/i18n/zh-TW.ts` (Traditional Chinese). The two files must stay in sync.

### Using strings in JSX

Import the `t` proxy from `src/i18n/index.ts`:

```ts
import { t } from '@/i18n/index';

// Static string
<Text>{t.home.goalReached}</Text>

// String with argument (function)
<Text>{t.home.stepsToGo(3500)}</Text>
```

`t` is a Proxy that reads the current locale from `settingsStore` at the moment the component renders. Locale changes trigger a React re-render automatically.

### Adding a new string

1. Add the key to `src/i18n/en.ts` under the appropriate namespace:
   ```ts
   walks: {
     // existing keys...
     newFeatureLabel: 'New feature',
   }
   ```
2. Add the same key to `src/i18n/zh-TW.ts` with the Traditional Chinese translation.
3. Use `t.walks.newFeatureLabel` in JSX.

If the string takes arguments, use a function:
```ts
walks: {
  distanceWithUnit: (km: number) => `${km.toFixed(1)} km`,
}
```

### Namespaces

| Namespace | Screen / context |
|---|---|
| `home` | Home screen |
| `goals` | Goals screen |
| `profile` | Profile screen |
| `mood` | Pet mood values (all screens) |
| `species` | Pet species names (all screens) |
| `walks` | Walks screen and walk session |
| `boss` | Boss screen and boss modals |
| `shop` | Shop screen |
| `ar` | AR walk screen |
| `onboarding` | Onboarding flow |
| `checkin` | Daily check-in modal |
| `common` | Shared strings (offline banner, error messages) |

### Switching locale at runtime

The locale is stored in `settingsStore`. The Profile screen exposes a language picker that calls:

```ts
import { useSettingsStore } from '@/stores/settingsStore';
useSettingsStore.getState().setLocale('zh-TW');
```

Supported values: `'en'` and `'zh-TW'`. The change persists to the `progress` KV table and survives app restarts.

---

## Section 4 — Notifications

### Changing notification text

Notification title and body strings are hardcoded in `src/services/notifications.ts`, not in i18n. To change them, edit the `content` blocks in `scheduleDailyWalkReminder()` and `scheduleCheckinReminder()` directly.

```ts
content: {
  title: 'Time for a walk!',                                 // ← change here
  body: 'Your pet is waiting for you. Take a stroll today.', // ← and here
  sound: true,
},
```

If you want these strings to be localizable in the future, move them to `src/i18n/en.ts` and call `t.notifications.*` in `notifications.ts`.

### Changing the default trigger time

The daily walk reminder fires at **09:00** by default. This value is hardcoded in `scheduleDailyWalkReminder()`:

```ts
let triggerHour = 9;
let triggerMinute = 0;
```

The check-in reminder fires at **08:00**. Both values are in `src/services/notifications.ts`.

The quiet-hours logic in `scheduleDailyWalkReminder` shifts the trigger to `quietHoursEnd:05` if 09:00 falls within the user's quiet hours window.

### Changing quiet hours defaults

Default quiet hours are defined in `src/stores/settingsStore.ts`:

```ts
const DEFAULT_QUIET_HOURS_START = 22;  // 10 PM
const DEFAULT_QUIET_HOURS_END = 7;     // 7 AM
```

These are the values used on first launch (before the user changes them in Profile settings). The user's chosen values persist in the `progress` KV table under `settings_quiet_hours_start` and `settings_quiet_hours_end`.
