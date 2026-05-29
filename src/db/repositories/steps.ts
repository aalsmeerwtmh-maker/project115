import { eq, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import { steps } from '@/db/schema';
import type { StepDay, NewStepDay } from '@/db/schema';

export async function getStepDay(date: string): Promise<StepDay | null> {
  const row = await db.select().from(steps).where(eq(steps.date, date)).limit(1);
  return row[0] ?? null;
}

export async function upsertStepDay(
  date: string,
  patch: Partial<Omit<NewStepDay, 'date' | 'updatedAt'>>,
): Promise<StepDay> {
  const now = Date.now();
  const existing = await getStepDay(date);

  if (existing) {
    const goalReachedAt =
      patch.goalReachedAt !== undefined
        ? patch.goalReachedAt
        : patch.stepCount !== undefined &&
            existing.goalReachedAt === null &&
            patch.stepCount >= existing.goal
          ? now
          : existing.goalReachedAt;

    await db
      .update(steps)
      .set({ ...patch, goalReachedAt, updatedAt: now })
      .where(eq(steps.date, date));
  } else {
    const goal = patch.goal ?? 8000;
    const stepCount = patch.stepCount ?? 0;
    const goalReachedAt =
      patch.goalReachedAt !== undefined ? patch.goalReachedAt : stepCount >= goal ? now : null;

    await db.insert(steps).values({
      date,
      stepCount,
      distanceM: patch.distanceM ?? 0,
      calories: patch.calories ?? 0,
      foodEarned: patch.foodEarned ?? 0,
      goal,
      goalReachedAt,
      updatedAt: now,
    });
  }

  const updated = await getStepDay(date);
  if (!updated) throw new Error(`upsertStepDay: failed to read back row for ${date}`);
  return updated;
}

export async function getRecentStepDays(limit: number): Promise<StepDay[]> {
  return db.select().from(steps).orderBy(steps.date).limit(limit);
}

// Returns step rows for the 7 days starting from `fromDate` (inclusive), 'YYYY-MM-DD'.
export async function getStepDaysFrom(fromDate: string): Promise<StepDay[]> {
  return db.select().from(steps).where(gte(steps.date, fromDate)).orderBy(steps.date);
}
