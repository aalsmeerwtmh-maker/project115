# PawStep 項目書面報告

---

## 目錄

1. [項目開發動機](#一項目開發動機)
2. [遊戲設計理念](#二遊戲設計理念)
3. [主要功能介紹](#三主要功能介紹)
4. [系統設計與實作](#四系統設計與實作)
5. [與現有技術之對比分析](#五與現有技術之對比分析)

---

## 一、項目開發動機

### 1.1 社會背景

隨著現代都市生活節奏加快，久坐不動已成為全球性的公共健康問題。世界衛生組織（WHO）指出，身體活動不足是全球第四大死亡風險因素，而青少年及上班族群體尤為嚴重。傳統的健身應用程式雖能記錄步數與運動時長，但往往缺乏持續的驅動力，導致用戶在新鮮感消退後便逐漸放棄使用。

另一方面，虛擬寵物文化自 1990 年代起便深受大衆喜愛，從掌上型電子雞（Tamagotchi）到現今的手機養成遊戲，均展示了玩家願意投入時間照顧虛擬生命的心理傾向。若能將真實的身體活動與虛擬寵物的成長綁定，則可形成一種自然的正向激勵循環——用戶因關愛寵物而願意多走路，寵物的成長又回饋了用戶堅持運動的成就感。

### 1.2 現有方案的不足

現有市場上雖已有若干融合遊戲化與健身的應用，但各有侷限：

- **純健身應用**（如 Google Fit、Apple Health）：功能完整但缺乏情感連結與遊戲化元素，難以維持長期使用動機。
- **計步器遊戲**（如 Pokémon GO）：遊戲性強，但以收集為核心，玩家對個體角色的情感投入相對薄弱，且需要持續的網絡連線與外部資料伺服器支援。
- **虛擬寵物遊戲**（如 Tamagotchi、My Talking Tom）：情感連結強，但與現實運動完全脫鉤，無法促進健康行為。

### 1.3 開發目標

PawStep 的誕生正是為了填補上述缺口，提供一個**以真實步行為核心驅動力、以虛擬寵物為情感載體**的行動應用程式。具體目標如下：

1. **促進日常步行習慣**：透過寵物成長機制，激勵用戶每天達成步數目標。
2. **建立情感連結**：讓用戶對自己的虛擬寵物產生持續的關注與照顧動機。
3. **提供沉浸式體驗**：結合擴增實境（AR）技術，讓寵物「出現」在現實世界中。
4. **支持長期參與**：透過連續打卡、徽章成就、頭目挑戰等機制，維持用戶的長期黏著度。
5. **無障礙本地化**：支援英文與繁體中文，服務不同語系的使用者。

---

## 二、遊戲設計理念

### 2.1 核心設計哲學：「行走即成長」

PawStep 的核心設計哲學可以用一句話概括：**你走得越多，你的寵物就越強壯**。這個理念貫穿了所有機制設計，確保現實世界的身體活動與遊戲內的成就直接掛鉤，形成不可分割的因果關係。

### 2.2 正向激勵循環

遊戲的核心循環設計如下：

```
步行 → 獲得代幣、探索事件、步數里程碑
  ↓
代幣消費（購買裝備、食物）
  ↓
寵物成長（成長值提升、階段進化）
  ↓
解鎖頭目挑戰
  ↓
戰勝頭目 → 更多代幣、成就感
  ↓
驅動更多步行
```

這個循環確保用戶在每次開啟應用時都有新的目標可以追求，避免了「目標感缺失」這一導致用戶流失的常見原因。

### 2.3 漸進式難度設計

遊戲採用分層式的進度設計，讓新手玩家和資深玩家都能找到適合自己的節奏：

| 進度層次 | 解鎖條件 | 對應機制 |
|---|---|---|
| 入門 | 完成首次步行 | 第一步徽章、基礎代幣獎勵 |
| 初級 | 連續 3 天 + 成長值 5 | 首位頭目（Mudpaw） |
| 中級 | 連續 7 天 + child 階段 | 第二位頭目、7 日連打徽章 |
| 高級 | 連續 14 天 + adult 階段 | 第三位頭目（Ironmaw） |
| 精英 | 連續 21 天 + elder 階段 | 第四位頭目（Shadowhowl） |
| 終極 | 連續 30 天 + 成長值 90 | 終極頭目（Voidstrider）、30 日徽章 |

### 2.4 情感設計：寵物狀態系統

寵物並非只是一個靜態的數值，而是有豐富情緒表達的生命體。其心情受多種因素影響：

- **時段**：白天自然活躍，夜間進入睡眠狀態。
- **運動狀態**：步行中顯示「walking」動畫。
- **餵食**：購買食物後進入「eating」狀態，親密度與體力上升。
- **步數表現**：當日步數越高，寵物越興奮（excited → happy → normal → sad）。

這種設計讓用戶感覺寵物是有生命的，而不是冷冰冰的統計數字，從而強化情感投入。

### 2.5 代幣經濟設計

PawStep 建立了一套完整的虛擬代幣經濟體系，確保遊戲內的供需平衡：

**代幣獲取途徑：**
- 每分鐘步行時間：+1 代幣
- 探索新地點（地理圍欄格）：+5 代幣
- 每 7 天連打里程碑：+10 代幣獎勵
- 戰勝隨機頭目：20–80 代幣（視戰鬥次數增加）
- 戰勝主線頭目：30–400 代幣不等
- 成就徽章初次達成：30–500 代幣

**代幣消費用途：**
- 食物購買（5–20 代幣）：恢復寵物體力與親密度
- 裝備購買（80–150 代幣）：帽子、西裝、背景
- 寵物改名（5 代幣，首次免費）

---

## 三、主要功能介紹

### 3.1 步數追蹤與每日目標

PawStep 利用裝置內建的計步感應器，透過 `expo-sensors` 的 Pedometer API 即時記錄用戶的步行數據。系統會在每個本地午夜自動重置，並與 SQLite 資料庫同步，確保歷史數據的完整保存。

用戶可在設定中自訂每日步數目標（預設為 8,000 步），主畫面的進度條會即時顯示達成比例。

### 3.2 步行會話（Walk Session）

啟動步行模式後，系統進入完整的步行追蹤狀態：

- **GPS 路徑記錄**：利用 `expo-location` 記錄用戶的移動路徑，繪製步行軌跡折線（Polyline）。
- **距離計算**：採用 Haversine 公式，根據 GPS 座標精確計算步行距離（公里）。
- **地理圍欄探索**：將地圖劃分為若干格子（Cell），首次進入新格子即觸發「發現新地點」事件並獎勵代幣。
- **隨機步行事件**：每 10 分鐘觸發一次寵物視角的趣味對話事件（Something Happened），豐富步行體驗。
- **自動頭目出現**：每走 200 步或每 5 分鐘會觸發隨機頭目遭遇，考驗玩家當前的寵物狀態。

### 3.3 虛擬寵物系統

#### 3.3.1 物種選擇
用戶可選擇三種寵物物種，各有獨特的 2D 動畫與 3D AR 模型：
- **狗（Golden Retriever）**：活潑好動，適合跑步愛好者
- **貓（Ginger Tabby）**：優雅獨立，深受貓咪愛好者喜愛
- **鳥（Blue Bird）**：輕盈靈活，象徵自由與飛翔

#### 3.3.2 成長階段
寵物的成長值由步行時間直接決定（每分鐘 +0.1 成長值，最少需步行 2 分鐘），並劃分為四個進化階段：

| 階段 | 外觀特徵 | 開放內容 |
|---|---|---|
| Baby（初生） | 小巧可愛 | 基礎互動 |
| Child（幼年） | 略微成長 | 解鎖第二位頭目 |
| Adult（成年） | 體型完整 | 解鎖第三位頭目 |
| Elder（長老） | 成熟威嚴 | 解鎖最終頭目 |

每次進化都會觸發動態慶祝彈窗（StageUpModal），配合彈性動畫呈現。

#### 3.3.3 寵物狀態
寵物具備七種顯示狀態，各配備對應的 2D 動畫：
`sleeping`、`eating`、`walking`、`happy`、`normal`、`sad`、`excited`

### 3.4 頭目挑戰系統

PawStep 設計了兩層頭目系統：

**主線頭目（5 位）：**
進入「頭目挑戰」頁面，系統依據連打天數、成長值、寵物階段與體力判斷是否達到挑戰條件。戰鬥以回合制展開，玩家的輸出傷害由親密度決定（0–20 親密度輸出最低傷害，100 親密度接近最高傷害），頭目每次攻擊消耗寵物血量的 1/7。

**隨機遭遇頭目（Walk Boss）：**
在步行過程中自動觸發，先顯示「發生了一件事！」的敘事彈窗，玩家按下「Got it」後才進入戰鬥，確保玩家不會在毫無準備的情況下突然進入戰鬥畫面。

### 3.5 裝備系統

用戶可在商店中購買以下四種裝備：

| 裝備 | 類型 | 代幣 | 效果 |
|---|---|---|---|
| Cozy Hat | 帽子 | 80 | 全 App 的 2D 寵物圖改為戴帽版本 |
| Suit | 西裝 | 150 | 全 App 的 2D 寵物圖改為穿西裝版本 |
| Park Background | 背景 | 100 | 主頁寵物圓框背景換為公園場景 |
| Winter Park Background | 背景 | 120 | 主頁寵物圓框背景換為冬日雪景 |

裝備的「穿戴」邏輯支援組合：同時裝備帽子與西裝，寵物圖像自動切換為帽子＋西裝的合體版本；背景類裝備有互斥機制，新背景裝備後舊背景自動卸下。

裝備效果同時反映在 AR 場景中：穿戴裝備後，AR 內的 3D 寵物模型亦更換為相應的著裝版本（Meshy AI 生成的 GLB 模型）。

### 3.6 擴增實境（AR）功能

ARWalkScreen 使用 `@reactvision/react-viro` 框架，讓寵物以 3D 模型形式出現在真實環境中：

- 自動偵測水平平面，提示用戶點擊放置寵物。
- 寵物會根據當前心情播放對應的 3D 動畫（站立、睡眠、進食、行走、興奮）。
- 當用戶與寵物的距離超過 2 公尺時，寵物會自動向用戶方向靠近（跟隨邏輯）。
- 支援圖像標記（Image Marker）AR 掃描，發現特定標記可獲得代幣獎勵（每次 +25 代幣）。

### 3.7 成就徽章系統

| 徽章 | 達成條件 | 代幣獎勵 |
|---|---|---|
| 👟 First Walk | 完成第一次步行 | 30 |
| 🔥 7-Day Streak | 連續步行 7 天 | 100 |
| 🏆 30-Day Streak | 連續步行 30 天 | 500 |
| 💯 100K Steps | 累計步數達 100,000 步 | 200 |

首次達成任一徽章，系統會觸發金色主題的慶祝彈窗（BadgeCelebrationModal），顯示徽章名稱、獎勵代幣數，以及精確的達成日期與時間。目標頁（GoalsScreen）會永久記錄並展示所有已達成徽章的達成時間。

### 3.8 每日打卡與連打系統

用戶每天首次開啟應用即觸發打卡，系統計算連打天數並給予對應獎勵。每達到 7 天倍數的連打里程碑時，額外發放 10 代幣作為里程碑獎勵。目標頁的週曆視圖以七個動物表情符號（週一至週日）直觀展示本週的打卡情況。

### 3.9 多語言支援

應用完整支援英文（en）與繁體中文（zh-TW）。語言偵測依據裝置系統語言自動切換，用戶亦可在設定頁手動選擇偏好語言。所有用戶可見字串均透過 i18n 代理（`t` proxy）存取，確保無硬編碼文字出現在介面中。

---

## 四、系統設計與實作

### 4.1 技術棧總覽

| 層次 | 技術選型 | 版本 | 選用理由 |
|---|---|---|---|
| 框架 | React Native + Expo | RN 0.85.3 / Expo 56 | 跨平台支援，Expo 生態系成熟 |
| 架構 | New Architecture | — | JSI/TurboModules，效能更佳 |
| 語言 | TypeScript | — | 靜態型別，降低執行期錯誤 |
| 本地資料庫 | expo-sqlite + Drizzle ORM | 56.0.4 / 0.45.2 | 離線優先，型別安全的 SQL |
| 狀態管理 | Zustand | 5.0.14 | 輕量、無樣板程式碼 |
| 動畫 | react-native-reanimated | 4.3.1 | Worklet 線程，不阻塞 JS |
| AR | @reactvision/react-viro | 2.55.0 | 支援 ARCore/ARKit |
| GPS | expo-location | 56.0.15 | Expo 原生整合 |
| 計步 | expo-sensors (Pedometer) | 56.0.5 | 直接存取 CMPedometer / SensorManager |
| 地圖 | react-native-maps | 1.27.2 | Google Maps + Apple Maps 雙支援 |
| 內購 | react-native-iap | 15.3.1 | JSI 原生模組，支援 NitroModules |
| 導航 | React Navigation | 7.x | Stack + BottomTabs 混合導航 |
| 通知 | expo-notifications | 56.0.15 | 本地推播提醒 |
| 震動回饋 | expo-haptics | 56.0.3 | 動作回饋增強沉浸感 |

### 4.2 應用程式架構

```
App.tsx (入口點)
├── 初始化 DB (initDb)
├── 水化 Stores (petStore / progressStore / settingsStore / equipmentStore)
└── RootNavigator
    ├── Onboarding Stack (首次使用引導流程)
    └── Main Stack
        ├── BottomTabs
        │   ├── HomeScreen      (主頁、寵物展示)
        │   ├── WalksScreen     (步行追蹤)
        │   ├── GoalsScreen     (目標與徽章)
        │   └── ShopScreen      (商店)
        └── Modal Screens
            ├── ProfileScreen
            ├── StatusCheckScreen
            ├── BossScreen
            ├── ARWalkScreen
            └── Legal Screens
```

### 4.3 資料庫設計

系統採用 SQLite 作為本地儲存引擎，搭配 Drizzle ORM 提供型別安全的資料操作。資料庫共包含五張主要資料表：

#### 資料表結構

```
pets
├── id (TEXT, PK)
├── name (TEXT)
├── species (TEXT)          -- 'dog' | 'cat' | 'bird'
├── mood (TEXT)             -- 'happy' | 'normal' | 'sad'
├── stamina (INTEGER)       -- 0–100，體力值
├── affection (INTEGER)     -- 0–100，親密度
├── growthValue (REAL)      -- 累計成長值，決定進化階段
└── stage (TEXT)            -- 'baby' | 'child' | 'adult' | 'elder'

steps
├── date (TEXT, PK)         -- 'YYYY-MM-DD'
└── stepCount (INTEGER)     -- 當日累計步數

events
├── id (TEXT, PK)
├── type (TEXT)             -- 'exploration' | 'story' | 'checkin'
├── timestamp (INTEGER)     -- Unix ms
└── metadata (TEXT)         -- JSON 格式的附加資料

equipment
├── id (TEXT, PK)
├── catalogId (TEXT)        -- 對應 GAME_CONFIG.equipment 中的 id
├── petId (TEXT, nullable)  -- null = 在背包中；非 null = 已裝備
├── source (TEXT)           -- 'token' | 'iap' | 'reward'
└── acquiredAt (INTEGER)

badges
├── id (TEXT, PK)           -- 'first_walk' | 'streak_7' | ...
├── achievedAt (INTEGER)    -- Unix ms，首次達成時間
└── rewardClaimed (INTEGER) -- boolean，防止重複發獎
```

#### 資料庫初始化（Lazy Proxy 模式）

為解決 React Native 模組載入順序問題，`src/db/client.ts` 採用 JavaScript `Proxy` 模式實作懶初始化：

```typescript
// db 常數在 import 時即可使用，但實際存取需等 initDb() 完成
const db = new Proxy({} as DrizzleDB, {
  get(_, prop) {
    if (!_db) throw new Error('DB not initialized. Call initDb() first.');
    return _db[prop as keyof DrizzleDB];
  }
});
```

這確保任何 Repository 函數都可在頂層 import `db`，而不會在資料庫初始化前意外觸發錯誤。

#### 資料庫遷移管理

由於 Metro Bundler 無法直接 import `.sql` 文件，系統採用自訂的遷移打包方案：

1. 修改資料庫 Schema (`src/db/schema.ts`)
2. 執行 `npm run db:generate`（呼叫 `drizzle-kit generate` + `scripts/bundle-migrations.mjs`）
3. 腳本將每個 `.sql` 文件的內容以 TypeScript 字串形式寫入 `src/db/migrations.ts`
4. `client.ts` 以 `{ m0000, m0001, ... }` 的格式引用並執行遷移

### 4.4 狀態管理架構

系統使用 Zustand 管理四個全域 Store，各司其職：

```
petStore         ── 活躍寵物的所有屬性（物種、心情、成長值等）
progressStore    ── 代幣、連打天數、步數目標、餵食到期時間
settingsStore    ── 語言、每日目標、通知設定、靜音時段
equipmentStore   ── 已擁有裝備（owned）與已裝備裝備（equipped）
```

所有 Store 在 `App.tsx` 啟動時依序水化（hydrate）自 SQLite，確保應用重啟後狀態的持久性。

`equipmentStore` 的設計尤為重要：它以 `catalogId` 的字串陣列形式儲存當前裝備狀態，所有需要顯示寵物圖像的元件均透過訂閱此 Store 自動獲取正確的著裝版本，無需逐層傳遞 Props。

### 4.5 寵物圖像解析系統（2D）

為支援帽子、西裝及其組合的圖像切換，系統在 `src/components/PetAvatar.tsx` 中實作了圖像解析函數：

```
resolvePetStandImage(species, hasHat, hasSuit)
  ├── 無裝備 → assets/pet_{species}_stand.png
  ├── 僅帽子 → assets/clothes/pet_{species}_hat.png
  ├── 僅西裝 → assets/clothes/pet_{species}_suit.png
  └── 帽子+西裝 → assets/clothes/pet_{species}_hat_suit.png
```

衣物圖像的白色背景已使用 Jimp 進行像素級處理移除（設計加工流程詳見 `scripts/process-assets.mjs`），確保透明疊加效果正確。

`PetStateDisplay` 元件對於靜態心情（normal、sad、happy）採用上述著裝圖像，對於動態動畫幀（walking、excited、sleeping、eating）則回退至基礎圖像，直至美術組提供動態著裝動畫。

### 4.6 AR 系統架構

AR 功能嚴格隔離於 `src/ar/` 目錄下，全域任何元件均不可直接 import `@reactvision/react-viro`，以確保 AR 故障時不影響主應用的啟動與運行。

```
src/ar/
├── arResources.ts   ── GLB 模型登錄、動畫定義、resolveARModels()
├── PetARScene.tsx   ── Viro AR 場景主體（平面偵測、放置、跟隨、幀動畫）
└── ...

ARWalkScreen.tsx  ── 唯一允許 import Viro 場景的 Screen
```

`resolveARModels(species, hasHat, hasSuit)` 根據當前裝備狀態返回對應的 GLB 模型集合，着裝的 3D 模型由 Meshy AI 生成，共 9 個組合（3 物種 × 3 著裝狀態）。

### 4.7 遊戲邏輯層

`src/game/` 目錄是純 TypeScript 模組，不引入任何 React 元件或原生模組，確保所有遊戲邏輯均可在 Node.js 環境中獨立測試：

```
src/game/
├── config.ts         ── GAME_CONFIG（所有數值常數的唯一來源）
├── bossFight.ts      ── 戰鬥傷害計算、HP 扣減邏輯
├── growthFormula.ts  ── 步行時間轉換為成長值（timeToGrowth）
├── petMood.ts        ── 依時段與活動解析顯示心情（resolveDisplayMood）
├── streaks.ts        ── 連打天數計算（computeStreak）
└── tokens.ts         ── 代幣獎勵計算、里程碑判斷
```

所有遊戲數值（代幣費率、頭目要求、商店售價、步行事件間隔等）均定義於 `GAME_CONFIG` 物件中，調整數值僅需修改此一檔案。

---

## 五、與現有技術之對比分析

### 5.1 與 Pokémon GO 之對比

Pokémon GO（2016，Niantic）是目前最成功的地理位置 AR 遊戲，PawStep 在設計上受其啟發，但在核心理念上有明確的差異化定位。

| 比較維度 | Pokémon GO | PawStep |
|---|---|---|
| **核心驅動** | 收集稀有寶可夢 | 養育單一寵物成長 |
| **情感投入** | 對特定個體的依附感較弱（追求稀有性） | 對唯一寵物有深度情感連結 |
| **運動動機** | 孵化蛋（步數門檻）為輔助機制 | 步行直接驅動寵物成長，核心機制 |
| **網路依賴** | 必須聯網，依賴 Niantic 伺服器 | 完全離線運作（本地 SQLite） |
| **AR 定位** | 寶可夢出現在現實環境 | 自己的寵物出現在現實環境 |
| **進度持久化** | 伺服器端，帳號刪除即失去 | 本地端，資料永久保存於裝置 |
| **個人化** | 有限（取決於捕獲的個體） | 深度個人化（物種、名字、裝備） |
| **目標受眾** | 廣泛的遊戲玩家 | 注重健康的用戶及寵物愛好者 |

**核心差異總結：** Pokémon GO 以「外部世界的收集」為樂趣核心，用戶的投入隨稀有寶可夢的獲取而波動；PawStep 以「一對一的情感養育」為核心，用戶的投入來自對唯一寵物持續成長的見證與參與。

### 5.2 與 Tamagotchi / 電子寵物之對比

| 比較維度 | Tamagotchi（電子雞） | PawStep |
|---|---|---|
| **活動連結** | 完全虛擬，與真實行為無關 | 步行直接驅動寵物成長 |
| **平台** | 專用硬體裝置 | 手機應用，門檻極低 |
| **AR 體驗** | 無 | 支援 ARCore/ARKit |
| **社交功能** | 有限的本地分享 | 未來可擴充排行榜 |
| **數據分析** | 無健康數據追蹤 | 完整的步數歷史、連打記錄 |
| **長期進度** | 循環輪迴（寵物死亡後重置） | 永久保存的成長歷程 |

### 5.3 與純健身應用之對比

| 比較維度 | Google Fit / Apple Health | PawStep |
|---|---|---|
| **核心定位** | 健康數據記錄與分析 | 遊戲化健身激勵 |
| **使用動機** | 理性（健康意識驅動） | 感性（情感連結驅動） |
| **遊戲元素** | 基本成就徽章 | 完整 RPG 元素（頭目、成長、裝備） |
| **堅持機制** | 提醒通知 | 寵物心情變化、連打獎勵 |
| **適用人群** | 已有健身習慣的用戶 | 需要外部動力開始運動的用戶 |
| **AR 功能** | 無 | 完整 AR 寵物互動 |

### 5.4 PawStep 的核心競爭優勢

綜合上述對比，PawStep 的差異化優勢體現在以下三點：

1. **情感＋健康的雙重驅動**：既有虛擬寵物帶來的情感連結（電子寵物的強項），又有真實步行資料的驅動（健身應用的強項），兩者有機結合而非簡單疊加。

2. **完全離線、隱私友善**：所有數據儲存於本地 SQLite，不依賴外部伺服器，用戶的健康數據不上傳至第三方，符合現代用戶對資料隱私的重視。

3. **低門檻高天花板**：新手用戶第一次步行即有反饋（First Walk 徽章 + 代幣），而資深用戶需要 30 天的堅持才能挑戰最終頭目，進度設計照顧到不同投入程度的玩家。

---

## 結語

PawStep 作為一個融合健身追蹤、虛擬寵物養成與擴增實境技術的創新應用，試圖解決現有健身應用「記錄容易，堅持困難」的核心問題。透過將真實世界的身體活動與用戶對虛擬寵物的情感投入相綁定，PawStep 建立了一套可持續的行為改變激勵機制。

在技術實作層面，系統採用 React Native New Architecture、離線優先的 SQLite 架構、反應式 Zustand 狀態管理，以及嚴格的模組隔離設計，確保應用在效能、可靠性與可維護性上達到生產級別的標準。

未來版本計劃引入社交排行榜、寵物間的互動功能、更多物種選擇，以及基於機器學習的個人化步行目標推薦，進一步深化 PawStep 在健康遊戲化領域的競爭優勢。

---

*本報告撰寫日期：2026 年 6 月 20 日*
*應用版本：PawStep v0.1.0*
*Bundle ID：com.pawstep.app*
