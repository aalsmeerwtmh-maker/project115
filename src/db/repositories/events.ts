import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { events } from '@/db/schema';
import type { Event, NewEvent } from '@/db/schema';

export type WalkPayload = {
  polyline: Array<{ lat: number; lng: number }>;
  distanceM: number;
  durationSeconds: number;
  stepCount: number;
};

export type CheckinPayload = {
  cellKey: string;
  tokensAwarded: number;
};

export async function insertExplorationEvent(
  id: string,
  payload: WalkPayload,
  lat: number,
  lng: number,
): Promise<void> {
  const row: NewEvent = {
    id,
    type: 'exploration',
    triggeredAt: Date.now(),
    latitude: lat,
    longitude: lng,
    payload: JSON.stringify(payload),
    resolved: false,
  };
  await db.insert(events).values(row);
}

export async function insertCheckinEvent(
  id: string,
  lat: number,
  lng: number,
  payload: CheckinPayload,
): Promise<void> {
  const row: NewEvent = {
    id,
    type: 'checkin',
    triggeredAt: Date.now(),
    latitude: lat,
    longitude: lng,
    payload: JSON.stringify(payload),
    resolved: false,
  };
  await db.insert(events).values(row);
}

export async function getCheckinEvents(): Promise<Event[]> {
  return db
    .select()
    .from(events)
    .where(eq(events.type, 'checkin'))
    .orderBy(desc(events.triggeredAt));
}

export async function getRecentWalkSessions(limit = 5): Promise<Event[]> {
  return db
    .select()
    .from(events)
    .where(eq(events.type, 'exploration'))
    .orderBy(desc(events.triggeredAt))
    .limit(limit);
}

// ---------------------------------------------------------------------------
// Boss events
// ---------------------------------------------------------------------------

export type BossPayload = {
  bossId: string;
  won: boolean;
  tokensEarned: number;
  retryUntil?: number; // unix ms; present on loss rows
  petSnapshot: {
    stamina: number;
    growthValue: number;
    stage: string;
    streakDays: number;
  };
};

export async function getBossEvents(): Promise<Event[]> {
  return db.select().from(events).where(eq(events.type, 'boss')).orderBy(desc(events.triggeredAt));
}

export async function insertBossEvent(
  id: string,
  payload: BossPayload,
  won: boolean,
): Promise<void> {
  const row: NewEvent = {
    id,
    type: 'boss',
    triggeredAt: Date.now(),
    latitude: null,
    longitude: null,
    payload: JSON.stringify(payload),
    resolved: won,
  };
  await db.insert(events).values(row);
}

// ---------------------------------------------------------------------------
// Story events
// ---------------------------------------------------------------------------

export type StoryPayload = {
  bossId: string;
  dialogueLine: string;
  /** Origin of the story event — 'boss' for boss victories, 'random_walk' for timed walk events. */
  source?: 'boss' | 'random_walk';
};

export async function insertStoryEvent(id: string, payload: StoryPayload): Promise<void> {
  const row: NewEvent = {
    id,
    type: 'story',
    triggeredAt: Date.now(),
    latitude: null,
    longitude: null,
    payload: JSON.stringify(payload),
    resolved: false,
  };
  await db.insert(events).values(row);
}

export async function resolveEvent(id: string): Promise<void> {
  await db.update(events).set({ resolved: true }).where(eq(events.id, id));
}
