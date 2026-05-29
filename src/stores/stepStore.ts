// Zustand store for step / distance tracking state
import { create } from 'zustand';

// TODO: replace with real fields in Phase 1
type StepState = Record<string, never>;

export const useStepStore = create<StepState>()(() => ({}));
