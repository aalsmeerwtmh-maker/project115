import { create } from 'zustand';
import { getActivePet, updatePet } from '@/db/repositories/pets';
import type { Pet } from '@/db/schema';

interface PetState {
  activePet: Pet | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setActivePet: (pet: Pet) => void;
  updateActivePet: (patch: Partial<Omit<Pet, 'id' | 'createdAt'>>) => Promise<void>;
}

export const usePetStore = create<PetState>()((set, get) => ({
  activePet: null,
  hydrated: false,

  hydrate: async () => {
    const pet = await getActivePet();
    set({ activePet: pet, hydrated: true });
  },

  setActivePet: (pet) => set({ activePet: pet }),

  updateActivePet: async (patch) => {
    const { activePet } = get();
    if (!activePet) return;
    const updated = await updatePet(activePet.id, patch);
    set({ activePet: updated });
  },
}));
