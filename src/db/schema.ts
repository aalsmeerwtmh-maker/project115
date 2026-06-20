import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

// One row per pet. Only one pet has isActive = true at a time.
export const pets = sqliteTable('pets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  species: text('species').notNull(),
  stage: text('stage', { enum: ['baby', 'child', 'adult', 'elder'] })
    .notNull()
    .default('baby'),
  stamina: integer('stamina').notNull().default(50),
  affection: integer('affection').notNull().default(0),
  growthValue: integer('growth_value').notNull().default(0),
  mood: text('mood', { enum: ['happy', 'normal', 'sad', 'excited'] })
    .notNull()
    .default('normal'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// One row per calendar day. Step counter writes to this throughout the day.
export const steps = sqliteTable('steps', {
  date: text('date').primaryKey(), // 'YYYY-MM-DD' in local time
  stepCount: integer('step_count').notNull().default(0),
  distanceM: real('distance_m').notNull().default(0),
  calories: real('calories').notNull().default(0),
  foodEarned: integer('food_earned').notNull().default(0),
  goal: integer('goal').notNull().default(8000),
  goalReachedAt: integer('goal_reached_at'), // unix ms, null if not yet reached
  updatedAt: integer('updated_at').notNull(),
});

// Key-value store for cross-cutting state: streak count, token balance, unlocked map IDs.
// Stored as JSON strings — stable fields can be migrated to typed columns later.
export const progress = sqliteTable('progress', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON-encoded
  updatedAt: integer('updated_at').notNull(),
});

// Story, exploration, boss, and check-in events triggered during use.
export const events = sqliteTable(
  'events',
  {
    id: text('id').primaryKey(),
    type: text('type', { enum: ['exploration', 'boss', 'story', 'checkin'] }).notNull(),
    triggeredAt: integer('triggered_at').notNull(),
    latitude: real('latitude'), // null for non-location events
    longitude: real('longitude'),
    payload: text('payload').notNull(), // JSON: dialogue, rewards, metadata
    resolved: integer('resolved', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => [index('idx_events_type_time').on(table.type, table.triggeredAt)],
);

// Achievement badges. One row per badge ID once earned; absent = not yet achieved.
export const badges = sqliteTable('badges', {
  id: text('id').primaryKey(),
  achievedAt: integer('achieved_at'),
  rewardClaimed: integer('reward_claimed', { mode: 'boolean' }).notNull().default(false),
});

// Equipment and cosmetics owned by the user.
// petId is null when the item is in inventory (not equipped on any pet).
export const equipment = sqliteTable(
  'equipment',
  {
    id: text('id').primaryKey(),
    catalogId: text('catalog_id').notNull(),
    petId: text('pet_id').references(() => pets.id, { onDelete: 'set null' }),
    acquiredAt: integer('acquired_at').notNull(),
    source: text('source', { enum: ['token', 'iap', 'reward'] }).notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [index('idx_equipment_pet').on(table.petId)],
);

// Convenience type exports — use these in repository functions and stores
export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;
export type Pet = typeof pets.$inferSelect;
export type NewPet = typeof pets.$inferInsert;
export type StepDay = typeof steps.$inferSelect;
export type NewStepDay = typeof steps.$inferInsert;
export type ProgressEntry = typeof progress.$inferSelect;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Equipment = typeof equipment.$inferSelect;
export type NewEquipment = typeof equipment.$inferInsert;
