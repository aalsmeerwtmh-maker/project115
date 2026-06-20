import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { badges } from '@/db/schema';
import type { Badge } from '@/db/schema';

export async function getBadge(id: string): Promise<Badge | null> {
  const row = await db.select().from(badges).where(eq(badges.id, id)).limit(1);
  return row[0] ?? null;
}

export async function getAllBadges(): Promise<Badge[]> {
  return db.select().from(badges);
}

/**
 * Marks the badge as achieved and returns true if it was newly achieved.
 * Returns false (no-op) if the badge was already achieved.
 */
export async function markBadgeAchieved(id: string, achievedAt: number): Promise<boolean> {
  const existing = await getBadge(id);
  if (existing?.achievedAt != null) return false;

  if (existing) {
    await db
      .update(badges)
      .set({ achievedAt, rewardClaimed: true })
      .where(eq(badges.id, id));
  } else {
    await db.insert(badges).values({ id, achievedAt, rewardClaimed: true });
  }
  return true;
}
