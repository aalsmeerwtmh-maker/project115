// Zustand store for user settings (notifications, daily goal, etc.)
import { create } from 'zustand';

// TODO: replace with real fields in Phase 2
type SettingsState = Record<string, never>;

export const useSettingsStore = create<SettingsState>()(() => ({}));
