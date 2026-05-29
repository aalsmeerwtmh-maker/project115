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

export async function getRecentWalkSessions(limit = 5): Promise<Event[]> {
  return db
    .select()
    .from(events)
    .where(eq(events.type, 'exploration'))
    .orderBy(desc(events.triggeredAt))
    .limit(limit);
}
