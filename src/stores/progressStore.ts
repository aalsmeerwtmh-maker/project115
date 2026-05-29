// Zustand store for streaks, tokens, and unlocked map progress
import { create } from 'zustand';

// TODO: replace with real fields in Phase 3
type ProgressState = Record<string, never>;

export const useProgressStore = create<ProgressState>()(() => ({}));
