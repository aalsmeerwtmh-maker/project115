// Route param types for React Navigation.
// `undefined` means the screen takes no params.
// Import these wherever you call navigation.navigate() or useRoute().

// Top-level stack — sits above the tab bar so ARWalk can cover the whole screen.
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  ARWalk: { sessionId: string }; // links the AR session back to a walk record in the DB
  Boss: undefined;
  Shop: undefined;
  ExplorationMap: undefined;
};

// The four bottom tabs.
export type MainTabParamList = {
  Home: undefined;
  Walks: undefined;
  Goals: undefined;
  Profile: undefined;
};
