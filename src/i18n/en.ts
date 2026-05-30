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
    localeLabel: 'Language',
    localeEn: 'English',
    localeZhTw: '繁體中文',
    quietHoursLabel: 'Quiet hours',
    quietHoursStart: 'Start',
    quietHoursEnd: 'End',
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
    discoveryBanner: (tokens: number) => `+${tokens} tokens — New location discovered!`,
    explorationMapTitle: 'Exploration Map',
    randomEventTitle: 'Something happened!',
    randomEventDismiss: 'Got it!',
  },

  // Boss screen
  boss: {
    title: 'Boss Challenges',
    challengeButton: 'Challenge',
    defeatedBadge: 'Defeated',
    retryCountdown: (h: number, m: number) => `Try again in ${h}h ${m}m`,
    requirementsMet: 'Ready',
    requirementsNotMet: 'Not ready',
    reqStreak: (n: number) => `${n}-day streak`,
    reqGrowth: (n: number) => `Growth ${n}`,
    reqStage: (s: string) => `Stage: ${s.charAt(0).toUpperCase() + s.slice(1)}`,
    reqStamina: (n: number) => `Stamina ${n}`,
    winTitle: 'Victory!',
    lossTitle: 'Not quite...',
    lossMessage: 'Keep training and try again.',
    tokensEarned: (n: number) => `+${n} tokens`,
    closeButton: 'Close',
  },

  // Shop screen
  shop: {
    title: 'Shop',
    tokenBalance: (n: number) => `${n} tokens`,
    earnSection: 'Earn More Tokens',
    equipmentSection: 'Equipment',
    buyButton: 'Buy',
    equipButton: 'Equip',
    unequipButton: 'Unequip',
    ownedBadge: 'Owned',
    equippedBadge: 'Equipped',
    insufficientTokens: 'Not enough tokens',
    restorePurchases: 'Restore Purchases',
    iapBuyButton: 'Buy',
    categoryHat: 'Hats',
    categoryAccessory: 'Accessories',
    categoryBackground: 'Backgrounds',
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

  // Onboarding
  onboarding: {
    welcome: 'Welcome to PawStep! Walk the world and grow your pet companion.',
    chooseSpecies: 'Choose your pet',
    setGoal: 'Set your daily goal',
    permissionsTitle: 'A few permissions needed',
    permissionsBody:
      'PawStep needs access to your location, motion sensors, and notifications to track walks and remind you to stay active.',
    allowNotifications: 'Allow Notifications',
    allowLocation: 'Allow Location',
    allowMotion: 'Allow Motion',
    skip: 'Skip',
    next: 'Next',
    finish: "Let's go!",
    dogName: 'Dog',
    catName: 'Cat',
    foxName: 'Fox',
  },

  // Daily check-in
  checkin: {
    dailyCheckinTitle: 'Daily Check-in',
    streakDay: (n: number) => `Day ${n}`,
    rewardEarned: (n: number) => `+${n} tokens`,
    claimButton: 'Claim Reward',
  },

  // Common / shared
  common: {
    offlineBanner: 'You are offline',
    retry: 'Retry',
    errorGeneric: 'Something went wrong.',
    emptyGeneric: 'Nothing here yet.',
  },
} as const;
