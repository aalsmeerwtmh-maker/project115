// Zustand store for the active pet state
import { create } from 'zustand';

// TODO: replace with real fields in Phase 2
type PetState = Record<string, never>;

export const usePetStore = create<PetState>()(() => ({}));
