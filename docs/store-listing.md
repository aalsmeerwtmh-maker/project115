# PawStep — Store Listing Guide

Asset and copy specifications for App Store (iOS) and Google Play (Android) submission.

---

## iOS App Store

### App Icon

| Spec | Value |
|---|---|
| Size | 1024 × 1024 px |
| Format | PNG, no transparency, no rounded corners (App Store Connect rounds them) |
| File | `assets/icon.png` (already referenced by `app.config.ts`) |

### Screenshots (required)

Submit at least 3 screenshots per device size. 6 recommended (see list below). Use the iPhone 6.7" size — it covers all larger required sizes automatically.

| Device class | Resolution | Required |
|---|---|---|
| 6.7" (iPhone 15 Pro Max) | 1290 × 2796 px | Yes |
| 6.5" (iPhone 14 Plus) | 1284 × 2778 px | Optional (6.7" covers this) |
| 5.5" (iPhone 8 Plus) | 1242 × 2208 px | Optional |
| iPad Pro 12.9" | 2048 × 2732 px | Required if iPad support is added |

**Recommended screenshot sequence (6.7"):**

1. **Home screen** — pet avatar with animated step ring, today's step count, mood indicator
2. **Walk in progress** — map view with live step/distance/duration HUD, Start Walk active
3. **AR pet on ground plane** — ViroAR scene with pet model anchored to real-world surface
4. **Boss challenge** — BossCard with villain line, requirements table, and "Challenge" button
5. **Equipment Shop** — ShopScreen grid with token balance badge and "Buy" / "Equip" states
6. **Exploration Map** — ExplorationMapScreen with visited cells shown as coloured polygons

### App Preview Video (optional but recommended)

- Format: H.264 or HEVC, .mov or .mp4
- 6.7" size: 886 × 1920 px or 1290 × 2796 px
- Duration: 15–30 seconds
- Suggested flow: launch → onboarding pet selection → walk start → AR pet appears → boss challenge

### Text Field Limits

| Field | Limit | Notes |
|---|---|---|
| App Name | 30 characters | "PawStep" (7 chars) |
| Subtitle | 30 characters | e.g. "Walk the World, Grow Your Pet" |
| Description | 4,000 characters | See draft below |
| What's New | 4,000 characters | For update releases |
| Keywords | 100 characters total | Comma-separated, no spaces after commas |
| Support URL | Required | — |
| Privacy Policy URL | Required | Replace placeholder in legal screens |

**Recommended keywords (iOS, 100 chars max):**

```
pedometer,virtual pet,AR pet,step counter,walk tracker,fitness,augmented reality,tamagotchi
```

---

## Google Play

### Feature Graphic

| Spec | Value |
|---|---|
| Size | 1024 × 500 px |
| Format | JPEG or PNG |
| Purpose | Banner shown at the top of the store listing; must work with and without a promo video overlay |

### Screenshots

- Minimum: 2 screenshots
- Recommended: 6 (same sequence as iOS above)
- Phone: minimum 1080 × 1920 px (portrait)
- Format: JPEG or PNG (no alpha)

### Text Field Limits

| Field | Limit |
|---|---|
| App Title | 30 characters |
| Short Description | 80 characters |
| Full Description | 4,000 characters |

---

## English App Description (~600 words)

> Copy this into the "Description" field in App Store Connect and Google Play Console.

---

**PawStep** turns your real-world steps into adventures for a virtual pet companion. Every walk you take helps your pet grow, explore new territories, and face powerful bosses. The more you move, the stronger your bond becomes.

**Walk. Grow. Explore.**

Connect your daily exercise to a living virtual world. PawStep uses your phone's step counter and GPS to translate every walk into food and experience for your pet. Set a daily step goal, hit it consistently, and watch your companion evolve from a tiny baby through childhood, adulthood, and beyond.

**See Your Pet in the Real World**

Point your camera at any flat surface and your pet steps into your reality. PawStep's augmented reality mode uses ARKit (iOS) and ARCore (Android) to anchor your companion on real-world planes — your floor, a table, the grass in the park. Watch them react to your environment as you walk together.

**Discover the World Around You**

PawStep turns your neighbourhood into a map of discoveries. Each new area you walk through unlocks tokens and triggers exploration events. Over time, your personal exploration map fills with the paths you have walked and the places you have discovered. No two players' maps look the same.

**Face the Bosses**

As your pet grows stronger, formidable bosses appear. Each boss requires your pet to have reached a certain growth stage, maintained a streak of active days, and built up enough stamina. Defeat them to earn tokens and unlock new story moments. There are five bosses in the current season, culminating in the legendary Voidstrider the Eternal — a challenge that only the most dedicated walkers can reach.

**Equip and Personalise**

Spend tokens earned through walking on hats, accessories, and background scenes for your pet. From a cozy beanie to a dapper top hat to a glowing city-at-night backdrop — every item is a reward for the effort you put in on real streets.

**Built for Real Life**

- Works offline. Step counting and pet progress never need a network connection.
- Battery-aware. AR auto-suspends after inactivity. A low-power walk mode is available.
- Privacy first. All data lives on your device — no account required, nothing uploaded.
- Accessibility. Full VoiceOver and TalkBack support.
- Bilingual. English and Traditional Chinese (繁體中文).

**Start your first walk today. Your pet is waiting.**

---

## Traditional Chinese (繁體中文) App Description

> Copy this into the zh-TW localisation fields in App Store Connect and Google Play Console.

---

**PawStep** 將你現實世界的步行，化為虛擬寵物的冒險旅程。每一次出門散步，都能讓你的寵物成長、探索新領域、挑戰強大的頭目。你走得越多，羈絆就越深。

**走路。成長。探索。**

PawStep 透過手機的步數感應器與 GPS，將你的每次散步轉化為寵物的食物與經驗值。設定每日步數目標，持續達成，看著你的夥伴從嗷嗷待哺的幼兒，蛻變為強大的成體。

**用 AR 看見你的寵物走進現實**

將鏡頭對準任何平坦的地面，你的寵物便會走入你的真實世界。PawStep 使用 ARKit（iOS）與 ARCore（Android）將你的夥伴錨定在現實平面上——你的地板、桌子、公園草地。陪著牠一起散步，看牠在你的環境中做出反應。

**發現身邊的世界**

PawStep 將你的社區化為一張充滿發現的地圖。每走過一個新區域，就能解鎖代幣並觸發探索事件。隨著時間累積，你的個人探索地圖會填滿你走過的路徑與發現的地點。每位玩家的地圖都是獨一無二的。

**挑戰頭目**

隨著寵物漸漸強大，強悍的頭目也會接連出現。每位頭目都要求寵物達到特定的成長階段、保持連續活躍天數，並積累足夠的體力。擊敗頭目可獲得代幣並解鎖故事場景。本賽季共有五位頭目，最終挑戰是傳說中的「永恆虛空騎士（Voidstrider the Eternal）」——只有最勤奮的行者才能抵達。

**裝扮你的寵物**

用散步賺取的代幣為寵物購買帽子、配件與背景。從毛茸茸的毛帽到紳士禮帽，從魔法森林到深夜城市——每件物品都是你在真實街道上付出努力的獎勵。

**為真實生活而設計**

- 離線也能使用。步數計算與寵物成長完全不需要網路連線。
- 省電設計。AR 在閒置後自動暫停。提供低耗電散步模式。
- 隱私優先。所有資料都留在你的裝置上——無需帳號，不上傳任何資料。
- 無障礙支援。完整支援 VoiceOver 與 TalkBack。
- 雙語介面：英文與繁體中文。

**今天就開始你的第一次散步吧。你的寵物在等你。**

---

## Asset Delivery Checklist

Before submission, confirm all placeholder assets have been replaced with final team-authored artwork.

- [ ] `assets/icon.png` — 1024 × 1024 final app icon (replaces template icon)
- [ ] `assets/splash.png` — splash screen (current placeholder acceptable for internal testing)
- [ ] `assets/android-icon-foreground.png` — adaptive icon foreground layer
- [ ] `assets/notification-icon.png` — white-on-transparent PNG for Android notification tray; uncomment `icon:` in `expo-notifications` plugin config in `app.config.ts` once ready
- [ ] `assets/ar/pet.glb` — final 3D pet model (replace sphere placeholder in `PetARScene.tsx`)
- [ ] `assets/ar/markers/placeholder_alpha.png` — replace with real image target
- [ ] `assets/ar/markers/placeholder_beta.png` — replace with real image target
- [ ] `assets/ar/markers/placeholder_gamma.png` — replace with real image target
- [ ] `assets/pets/` — 2D pet sprites for Home screen `PetAvatar` component (dog, cat, fox × 4 stages)
- [ ] Equipment sprites for all 7 catalog items (hat_beanie, hat_crown, hat_tophat, acc_bowtie, acc_scarf, bg_forest, bg_citynight)
- [ ] 6 × 6.7" iPhone screenshots
- [ ] Feature graphic (1024 × 500 px) for Google Play
- [ ] App preview video (optional)
