import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync } from 'expo-sqlite';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

import journal from './drizzle/meta/_journal.json';
import { m0000 } from './migrations';

const migrationFiles: Record<string, string> = {
  m0000,
};

// Lazily initialized — opened inside initDb() so module evaluation never throws.
let _db: ExpoSQLiteDatabase<typeof schema> | null = null;

export function getDb(): ExpoSQLiteDatabase<typeof schema> {
  if (!_db) throw new Error('getDb() called before initDb()');
  return _db;
}

// Alias so existing `import { db }` call sites keep working after migration to lazy init.
export const db: ExpoSQLiteDatabase<typeof schema> = new Proxy(
  {} as ExpoSQLiteDatabase<typeof schema>,
  {
    get(_target, prop) {
      return getDb()[prop as keyof ExpoSQLiteDatabase<typeof schema>];
    },
  },
);

// Call once on app start. Applies any pending migrations in order, then no-ops on repeat.
// Seeds a default pet if none exists so the Home screen has something to display.
export async function initDb(): Promise<void> {
  const expo = openDatabaseSync('pawstep.db', { enableChangeListener: true });
  _db = drizzle(expo, { schema });
  await migrate(_db, { journal, migrations: migrationFiles });
  await seedDefaultPet();
}

async function seedDefaultPet(): Promise<void> {
  const existing = await db.select().from(schema.pets).limit(1);
  if (existing.length > 0) return;

  const { randomUUID } = await import('expo-crypto');
  const now = Date.now();
  await db.insert(schema.pets).values({
    id: randomUUID(),
    name: 'Paws',
    species: 'dog',
    stage: 'baby',
    stamina: 50,
    affection: 0,
    growthValue: 0,
    mood: 'normal',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
}
