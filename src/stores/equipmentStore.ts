import { create } from 'zustand';
import { getOwnedEquipment, getEquippedItems } from '@/db/repositories/equipment';

interface EquipmentState {
  owned: string[];
  equipped: string[];
  hydrated: boolean;
  hydrate: (petId: string) => Promise<void>;
  refresh: (petId: string) => Promise<void>;
}

export const useEquipmentStore = create<EquipmentState>((set) => ({
  owned: [],
  equipped: [],
  hydrated: false,

  async hydrate(petId: string) {
    const [allOwned, equippedItems] = await Promise.all([
      getOwnedEquipment(),
      getEquippedItems(petId),
    ]);
    set({
      owned: allOwned.map((e) => e.catalogId),
      equipped: equippedItems.map((e) => e.catalogId),
      hydrated: true,
    });
  },

  async refresh(petId: string) {
    const [allOwned, equippedItems] = await Promise.all([
      getOwnedEquipment(),
      getEquippedItems(petId),
    ]);
    set({
      owned: allOwned.map((e) => e.catalogId),
      equipped: equippedItems.map((e) => e.catalogId),
    });
  },
}));
