# Game Systems

All game logic lives in `src/game/`. Every file in that folder is pure TypeScript: no React, no SQLite, no native modules. This makes the math unit-testable in plain Node with Jest.

---

## Pet lifecycle

### Stages

A pet progresses through four stages over its lifetime. Stage transitions are driven exclusively by `growth_value`.

| Stage     | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| `'baby'`  | Starting stage. Limited expressions and moves.                           |
| `'child'` | Unlocked after sufficient growth. More animations, first boss available. |
| `'adult'` | Full expression set, all maps accessible.                                |
| `'elder'` | Final stage. The pet gains elder-specific appearance and dialogue.       |

The thresholds that map `growth_value` to stage boundaries are defined in `src/game/growthFormula.ts`. The 90-day lifecycle target (reaching `elder` after ~90 days of consistent 8,000-step days) is the calibration anchor for those thresholds.

### `growth_value`

`growth_value` on the `pets` table row is the cumulative total growth the pet has received since creation. It only increases. When `growth_value` crosses a stage threshold, the `stage` column is updated and a stage-transition event is written to the `events` table.

The pet's `stage` and `growth_value` are read from the `pets` repository into `petStore` on app start.

---

## Step-to-growth formula

Implemented in `src/game/growthFormula.ts`.

### Flow

```
daily step_count
       │
       ▼ apply anti-cheat cap and streak multiplier
       │
       ▼
food_earned   (intermediate unit; stored in steps table)
       │
       ▼
growth_value  (added to the pet's cumulative total)
```

### Calibration targets

| Target                         | Value                                                          |
| ------------------------------ | -------------------------------------------------------------- |
| Daily step goal                | 8,000 steps                                                    |
| Full lifecycle (baby → elder)  | ~90 days of consistent goal completion                         |
| Streak multiplier applied from | Day 2 of a consecutive streak                                  |
| Anti-cheat cap                 | Max steps per minute delta (exact value in `growthFormula.ts`) |

### Streak multiplier

A consecutive-day streak increases `food_earned` per step:

- Baseline (no streak or day 1): multiplier = 1.0×
- Each additional consecutive day adds a multiplier increment (see `src/game/streaks.ts`).
- The multiplier is capped to prevent infinite scaling.

### Bonus for exceeding the daily goal

Completing the daily goal (default: 8,000 steps) earns bonus `food_earned` on top of the base conversion. Steps above the goal threshold continue to earn food, but at a reduced per-step rate to encourage consistency over single-day grinding.

### Anti-cheat cap

The step counter subscription reports deltas. If a delta exceeds the maximum physically plausible steps-per-minute for a human (running pace), the excess is discarded before the delta is applied to `step_count`. This prevents sensor glitches or manual step injection from distorting `growth_value`.

---

## Mood system

The pet's current mood is stored in `pets.mood`. There are four possible values:

| Mood        | Trigger conditions                                                 |
| ----------- | ------------------------------------------------------------------ |
| `'happy'`   | User completed yesterday's step goal; recent check-in              |
| `'normal'`  | Default baseline; no strong positive or negative signals           |
| `'sad'`     | Goal not reached for 2+ consecutive days; long absence from app    |
| `'excited'` | Goal exceeded significantly; boss just defeated; new stage reached |

Mood affects the pet's displayed sprite animation and the dialogue lines the pet delivers. The mapping from mood to dialogue lives in `src/i18n/en.ts` (user-visible strings belong there, not in game logic files).

Mood is recalculated by `petStore` each time step data or streak data is updated. It is a derived value — it is written to `pets.mood` for persistence, but it is always recalculated from the underlying data rather than modified directly.

---

## Streaks

Implemented in `src/game/streaks.ts`.

### What counts as a streak

A streak is the number of consecutive calendar days on which the user reached their daily step goal. "Calendar day" means midnight to midnight in local time.

### Breaking a streak

A streak is broken when a calendar day passes without the goal being reached. The check happens on the first app open of a new day. If `streak_current` in the `progress` table is N but the previous calendar day has no `goal_reached_at` value in the `steps` table, `streak_current` resets to 0.

### Multiplier formula

The streak multiplier feeds into `growthFormula.ts`:

```
multiplier = 1.0 + (streak_days - 1) * INCREMENT
```

where `INCREMENT` and the cap are defined in `src/game/streaks.ts`. At the cap, additional days do not increase the multiplier further.

### Stored values

Streaks are stored in the `progress` KV table:

| Key              | Meaning                                |
| ---------------- | -------------------------------------- |
| `streak_current` | Days in the current active streak      |
| `streak_best`    | All-time best streak (never decreases) |

---

## Token economy

Implemented in `src/game/tokens.ts`.

### Earning tokens

| Source          | Condition                                                       |
| --------------- | --------------------------------------------------------------- |
| Time in app     | Passive earn rate per minute of active app use                  |
| Boss completion | Fixed reward per boss, scales with boss difficulty              |
| Streak bonus    | Bonus tokens awarded at streak milestones (e.g., 7-day, 30-day) |

### Spending tokens

| Destination    | Description                                                         |
| -------------- | ------------------------------------------------------------------- |
| Equipment shop | Cosmetic items for the pet; each has a `catalog_id` and token price |
| IAP bundles    | Real-money token bundles supplement the earn rate (Phase 5)         |

### Balance

The current token balance is stored in `progress` under the key `'tokens'` as a JSON-encoded number. Token transactions are performed by the `progress` repository: read balance → apply delta → write balance, within a single SQLite transaction to prevent double-spend on concurrent updates.

The shop catalog (item definitions and prices) is a hard-coded constant in `src/game/tokens.ts`. Items are not stored in the database; only the user's owned instances (rows in `equipment`) are stored.

---

## Boss challenges

Implemented in `src/game/bosses.ts`.

### Structure of a boss

Each boss definition contains:

| Field            | Description                                                                        |
| ---------------- | ---------------------------------------------------------------------------------- |
| Unlock condition | The prerequisite (e.g., "walk 8,000 steps for 7 consecutive days")                 |
| Challenge        | What the user must do to fight (e.g., "complete today's step goal within 2 hours") |
| Failure penalty  | Consequence of losing (e.g., pet stamina reduced; streak unaffected)               |
| Success reward   | Tokens awarded and any permanent unlock (e.g., new map, cosmetic item)             |

### Difficulty progression

There are 5 boss difficulty tiers. Bosses unlock sequentially — you cannot challenge Boss 2 without defeating Boss 1.

| Boss   | Approximate unlock condition        |
| ------ | ----------------------------------- |
| Boss 1 | 7-day streak at goal                |
| Boss 2 | 14-day streak at goal               |
| Boss 3 | 30-day streak at goal               |
| Boss 4 | 60-day streak at goal               |
| Boss 5 | 90-day streak at goal (elder stage) |

Exact thresholds are defined in `src/game/bosses.ts`. Boss progress (attempts, defeated status) is stored in the `progress` table under the key `'boss_progress'`.

---

## Exploration events

Exploration events are stored in the `events` table with `type = 'exploration'`.

### GPS grid cells

During a walk session, the user's location is monitored via `expo-location`. The world is divided into a grid of approximately 50-metre cells. When the user enters a cell they have not visited before, an exploration event is created.

Each cell is identified by a discrete grid coordinate derived from the GPS coordinates. The set of visited cells is persisted in the `events` table (each entry is a visited-cell record) or in `progress.unlocked_map_ids` depending on the type.

### Event types

| Type            | Trigger                                              | Reward                                               |
| --------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| `'exploration'` | Entering a new ~50m grid cell                        | Token reward; cell marked as discovered              |
| `'story'`       | Scripted triggers (location + progression condition) | Pet dialogue snippet; no token reward                |
| `'checkin'`     | User manually triggers a daily check-in              | Streak maintained; small token bonus                 |
| `'boss'`        | Boss challenge initiated                             | Stored as an event with challenge state in `payload` |

### Event payload

The `payload` column is a JSON object. Its shape varies by event type:

```jsonc
// exploration event
{ "cell_id": "42:108", "reward_tokens": 10 }

// story event
{ "dialogue": ["Your pet sniffs curiously.", "A breeze carries an unfamiliar scent."] }

// boss event
{ "boss_id": "boss_1", "started_at": 1716800000000, "outcome": null }
```

### Event lifecycle

Events are created with `resolved = 0`. After the user dismisses or completes the event in the UI, the repository sets `resolved = 1`. Unresolved events appear as pending notifications or in-game banners; resolved events are kept for history but not shown in the active event feed.

---

## Pending (Phase 7)

All game systems described in this document are implemented as of Phase 6. The following items remain for Phase 7 (release prep):

| Item | Notes |
|---|---|
| Analytics provider | `src/services/analytics.ts` is a no-op stub; provider to be chosen in Phase 7 |
| Real AR image markers | `assets/ar/markers/` contains placeholder PNGs; real markers must be substituted before demo |
| Equipment sprites | `assets/equipment/` does not exist yet; `ShopItemCard.tsx` renders a placeholder view |
| 3D pet model | `assets/ar/pet.glb` not yet delivered; AR shows a placeholder orange sphere |
| Store submission | EAS Submit not yet run for either platform |
