import { create } from 'zustand';
import type { StepDay } from '@/db/schema';

interface StepState {
  today: StepDay | null;
  isAvailable: boolean;

  setToday: (day: StepDay) => void;
  setIsAvailable: (available: boolean) => void;
}

export const useStepStore = create<StepState>()((set) => ({
  today: null,
  isAvailable: false,

  setToday: (day) => set({ today: day }),
  setIsAvailable: (available) => set({ isAvailable: available }),
}));
