// Repository — CRUD operations for the equipment table
import { eq, isNull, isNotNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { equipment } from '@/db/schema';
import type { Equipment, NewEquipment } from '@/db/schema';

/**
 * Returns all equipment rows owned by the user (equipped and in inventory).
 */
export async function getOwnedEquipment(): Promise<Equipment[]> {
  return db.select().from(equipment);
}

/**
 * Returns equipment currently equipped on the given pet.
 */
export async function getEquippedItems(petId: string): Promise<Equipment[]> {
  return db.select().from(equipment).where(eq(equipment.petId, petId));
}

/**
 * Returns equipment that is in the user's inventory (not equipped on any pet).
 */
export async function getInventory(): Promise<Equipment[]> {
  return db.select().from(equipment).where(isNull(equipment.petId));
}

/**
 * Inserts a new equipment row representing a purchase.
 * `id` is caller-supplied (use generateId() from utils/id).
 */
export async function purchaseEquipment(
  catalogId: string,
  source: 'token' | 'iap' | 'reward',
  id: string,
): Promise<Equipment> {
  const now = Date.now();
  const row: NewEquipment = {
    id,
    catalogId,
    petId: null,
    acquiredAt: now,
    source,
    updatedAt: now,
  };
  await db.insert(equipment).values(row);
  const inserted = await db.select().from(equipment).where(eq(equipment.id, id));
  if (!inserted[0]) throw new Error(`purchaseEquipment: failed to retrieve row id=${id}`);
  return inserted[0];
}

/**
 * Equips an item onto a pet by writing `petId` to the row.
 */
export async function equipItem(equipmentId: string, petId: string): Promise<void> {
  await db
    .update(equipment)
    .set({ petId, updatedAt: Date.now() })
    .where(eq(equipment.id, equipmentId));
}

/**
 * Unequips an item by clearing `petId` (item goes back to inventory).
 */
export async function unequipItem(equipmentId: string): Promise<void> {
  await db
    .update(equipment)
    .set({ petId: null, updatedAt: Date.now() })
    .where(eq(equipment.id, equipmentId));
}

/**
 * Returns true if the user already owns any equipment with the given catalogId.
 */
export async function ownsItem(catalogId: string): Promise<boolean> {
  const rows = await db.select().from(equipment).where(eq(equipment.catalogId, catalogId)).limit(1);
  return rows.length > 0;
}

/**
 * Returns equipment that is not null equipped on any pet
 * (alias for getInventory, used internally).
 */
export async function getUnequippedEquipment(): Promise<Equipment[]> {
  return db.select().from(equipment).where(isNotNull(equipment.petId));
}
