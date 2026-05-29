export const en = {
  // Home screen
  home: {
    stepsToGo: (n: number) => `${n.toLocaleString()} steps to go`,
    goalReached: 'Goal reached! Great job!',
    todaySteps: 'Today',
    stepUnit: 'steps',
    moodLabel: 'Mood',
    petSensor: 'Step sensor unavailable on this device.',
  },

  // Goals screen
  goals: {
    title: 'Goals',
    currentStreak: (n: number) => `${n}-day streak`,
    streakSectionTitle: 'Weekly Progress',
    nextGoal: (n: number) => `Next goal: ${n.toLocaleString()} steps`,
    badgesTitle: 'Badges',
    badgePlaceholder: 'Coming soon',
    streakDayLabel: (day: string) => day,
  },

  // Profile screen
  profile: {
    title: 'Profile',
    petsSection: 'My Pets',
    settingsSection: 'Settings',
    aboutSection: 'About',
    notificationsLabel: 'Daily reminders',
    dailyGoalLabel: 'Daily step goal',
    appName: 'PawStep',
    appVersion: '0.1.0',
    petStage: (stage: string) => stage.charAt(0).toUpperCase() + stage.slice(1),
  },

  // Pet moods
  mood: {
    happy: 'Happy',
    normal: 'Normal',
    sad: 'Sad',
    excited: 'Excited!',
  },

  // Pet species
  species: {
    dog: 'Dog',
    cat: 'Cat',
    fox: 'Fox',
  },

  // Walks screen
  walks: {
    title: 'Walks',
    startWalk: 'Start Walk',
    stopWalk: 'Stop Walk',
    enterAR: 'Enter AR',
    steps: 'Steps',
    distance: (km: number) => `${km.toFixed(2)} km`,
    elapsed: 'Time',
    pastWalksTitle: 'Past Walks',
    noPastWalks: 'No walks yet. Start your first walk!',
    locationDenied: 'Location permission is required to track walks.',
    walkDate: (dateMs: number) =>
      new Date(dateMs).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    walkSummary: (distKm: number, steps: number) =>
      `${distKm.toFixed(2)} km · ${steps.toLocaleString()} steps`,
  },

  // AR screen
  ar: {
    enterAR: 'Enter AR',
    exitAR: 'Exit AR',
    arPaused: 'AR paused',
    tapToResume: 'Tap to resume',
    deviceWarm: 'Device getting warm',
    planeDetecting: 'Point camera at a flat surface…',
  },
} as const;
