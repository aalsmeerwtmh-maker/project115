import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { progress } from '@/db/schema';

export async function getProgress<T>(key: string): Promise<T | null> {
  const row = await db.select().from(progress).where(eq(progress.key, key)).limit(1);
  if (!row[0]) return null;
  return JSON.parse(row[0].value) as T;
}

export async function setProgress<T>(key: string, value: T): Promise<void> {
  const encoded = JSON.stringify(value);
  const now = Date.now();

  const existing = await db.select().from(progress).where(eq(progress.key, key)).limit(1);

  if (existing[0]) {
    await db.update(progress).set({ value: encoded, updatedAt: now }).where(eq(progress.key, key));
  } else {
    await db.insert(progress).values({ key, value: encoded, updatedAt: now });
  }
}

// ---------------------------------------------------------------------------
// Daily check-in helpers
// ---------------------------------------------------------------------------

const LAST_CHECKIN_DATE_KEY = 'last_checkin_date';

/** Returns the last check-in date string ('YYYY-MM-DD') or null if never checked in. */
export async function getLastCheckinDate(): Promise<string | null> {
  return getProgress<string>(LAST_CHECKIN_DATE_KEY);
}

/** Persists today's date as the last check-in date ('YYYY-MM-DD'). */
export async function setLastCheckinDate(date: string): Promise<void> {
  await setProgress(LAST_CHECKIN_DATE_KEY, date);
}
