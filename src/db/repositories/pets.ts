import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { pets } from '@/db/schema';
import type { Pet, NewPet } from '@/db/schema';

export async function getActivePet(): Promise<Pet | null> {
  const rows = await db.select().from(pets).where(eq(pets.isActive, true)).limit(1);
  return rows[0] ?? null;
}

export async function getAllPets(): Promise<Pet[]> {
  return db.select().from(pets);
}

export async function insertPet(pet: NewPet): Promise<Pet> {
  await db.insert(pets).values(pet);
  const inserted = await db.select().from(pets).where(eq(pets.id, pet.id)).limit(1);
  if (!inserted[0]) throw new Error(`insertPet: failed to read back row for id ${pet.id}`);
  return inserted[0];
}

export async function updatePet(id: string, patch: Partial<Omit<NewPet, 'id'>>): Promise<Pet> {
  const now = Date.now();
  await db
    .update(pets)
    .set({ ...patch, updatedAt: now })
    .where(eq(pets.id, id));
  const updated = await db.select().from(pets).where(eq(pets.id, id)).limit(1);
  if (!updated[0]) throw new Error(`updatePet: failed to read back row for id ${id}`);
  return updated[0];
}
