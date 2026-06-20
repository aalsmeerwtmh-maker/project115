export const zhTW = {
  // Home screen
  home: {
    stepsToGo: (n: number) => `還需 ${n.toLocaleString()} 步`,
    goalReached: '目標達成！做得好！',
    todaySteps: '今日',
    stepUnit: '步',
    moodLabel: '心情',
    petSensor: '此裝置無法使用步數感應器。',
  },

  // Goals screen
  goals: {
    title: '目標',
    currentStreak: (n: number) => `連續 ${n} 天`,
    streakSectionTitle: '本週進度',
    nextGoal: (n: number) => `下一目標：${n.toLocaleString()} 步`,
    badgesTitle: '徽章',
    badgePlaceholder: '即將推出',
    streakDayLabel: (day: string) => day,
    badge_first_walk: '第一次散步',
    badge_first_walk_desc: '完成你的第一次散步',
    badge_streak_7: '連續 7 天',
    badge_streak_7_desc: '連續散步 7 天',
    badge_streak_30: '連續 30 天',
    badge_streak_30_desc: '連續散步 30 天',
    badge_steps_100k: '10 萬步',
    badge_steps_100k_desc: '累計步數達 100,000 步',
    badgeEarned: (n: number) => `獲得 +${n} 代幣`,
    badgeAchievedAt: (dateStr: string) => `達成於 ${dateStr}`,
    badgeLocked: '尚未達成',
  },

  // Profile screen
  profile: {
    title: '個人資料',
    petsSection: '我的寵物',
    settingsSection: '設定',
    aboutSection: '關於',
    notificationsLabel: '每日提醒',
    dailyGoalLabel: '每日步數目標',
    appName: 'PawStep',
    appVersion: '0.1.0',
    petStage: (stage: string) => stage.charAt(0).toUpperCase() + stage.slice(1),
    localeLabel: '語言',
    localeEn: 'English',
    localeZhTw: '繁體中文',
    quietHoursLabel: '免打擾時段',
    quietHoursStart: '開始',
    quietHoursEnd: '結束',
    privacyPolicy: '隱私權政策',
    termsOfUse: '使用條款',
  },

  // Legal screens
  legal: {
    privacyPolicyTitle: '隱私權政策',
    termsTitle: '使用條款',
    backButton: '返回',
  },

  // Pet moods (DB moods + time-based display moods)
  mood: {
    happy: '開心',
    normal: '普通',
    sad: '難過',
    excited: '興奮！',
    sleeping: '睡覺中',
    eating: '吃東西中',
    walking: '散步中',
  },

  // Pet species
  species: {
    dog: '狗',
    cat: '貓',
    bird: '鳥',
  },

  // Walks screen
  walks: {
    title: '散步',
    startWalk: '開始散步',
    stopWalk: '停止散步',
    enterAR: '進入 AR',
    steps: '步數',
    distance: (km: number) => `${km.toFixed(2)} 公里`,
    elapsed: '時間',
    pastWalksTitle: '過去的散步',
    noPastWalks: '還沒有散步紀錄。開始你的第一次散步！',
    locationDenied: '追蹤散步需要位置權限。',
    walkDate: (dateMs: number) =>
      new Date(dateMs).toLocaleDateString('zh-TW', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    walkSummary: (distKm: number, steps: number) =>
      `${distKm.toFixed(2)} 公里 · ${steps.toLocaleString()} 步`,
    discoveryBanner: (tokens: number) => `+${tokens} 代幣 — 發現新地點！`,
    explorationMapTitle: '探索地圖',
    randomEventTitle: '發生了一件事！',
    randomEventDismiss: '知道了！',
  },

  // Boss screen
  boss: {
    title: '挑戰頭目',
    challengeButton: '挑戰',
    defeatedBadge: '已打敗',
    retryCountdown: (h: number, m: number) => `${h} 小時 ${m} 分後重試`,
    requirementsMet: '準備好了',
    requirementsNotMet: '尚未準備好',
    reqStreak: (n: number) => `連續 ${n} 天`,
    reqGrowth: (n: number) => `成長值 ${n}`,
    reqStage: (s: string) => `階段：${s.charAt(0).toUpperCase() + s.slice(1)}`,
    reqStamina: (n: number) => `體力 ${n}`,
    winTitle: '勝利！',
    lossTitle: '差一點…',
    lossMessage: '繼續訓練，再試一次。',
    tokensEarned: (n: number) => `+${n} 代幣`,
    closeButton: '關閉',
  },

  // Shop screen
  shop: {
    title: '商店',
    tokenBalance: (n: number) => `${n} 代幣`,
    earnSection: '獲得更多代幣',
    equipmentSection: '裝備',
    buyButton: '購買',
    equipButton: '裝備',
    unequipButton: '卸下',
    ownedBadge: '已擁有',
    equippedBadge: '已裝備',
    insufficientTokens: '代幣不足',
    foodSection: '食物與恢復',
    restorePurchases: '恢復購買',
    iapBuyButton: '購買',
    categoryHat: '帽子',
    categoryAccessory: '配件',
    categoryBackground: '背景',
  },

  // AR screen
  ar: {
    enterAR: '進入 AR',
    exitAR: '離開 AR',
    arPaused: 'AR 已暫停',
    tapToResume: '點擊繼續',
    deviceWarm: '裝置溫度升高',
    planeDetecting: '請將相機對準平面…',
    scanning: '正在掃描平面…',
    tapToPlace: '點擊放置你的寵物',
    placing: '正在放置你的寵物…',
    placed: '寵物已放置！',
  },

  // Onboarding
  onboarding: {
    welcome: '歡迎使用 PawStep！走路探索世界，陪伴你的虛擬寵物成長。',
    chooseSpecies: '選擇你的寵物',
    setGoal: '設定每日目標',
    permissionsTitle: '需要幾個權限',
    permissionsBody: 'PawStep 需要存取你的位置、動作感應器和通知，以追蹤散步並提醒你保持活躍。',
    allowNotifications: '允許通知',
    allowLocation: '允許位置',
    allowMotion: '允許動作',
    skip: '跳過',
    next: '下一步',
    finish: '出發！',
    dogName: '狗',
    catName: '貓',
    birdName: '鳥',
  },

  // Daily check-in
  checkin: {
    dailyCheckinTitle: '每日打卡',
    streakDay: (n: number) => `第 ${n} 天`,
    rewardEarned: (n: number) => `+${n} 代幣`,
    claimButton: '領取獎勵',
  },

  // Pet rename
  rename: {
    title: '命名你的寵物',
    placeholder: '輸入名字…',
    costLabel: '費用',
    costFree: '免費！',
    costTokens: (n: number) => `${n} 代幣`,
    insufficientTokens: '代幣不足',
    save: '儲存',
    cancel: '取消',
  },

  // Status Check screen
  statusCheck: {
    title: '狀態查看',
    moodMessage: {
      sleeping: (name: string) => `${name} 正在睡覺`,
      eating: (name: string) => `${name} 正在吃東西`,
      walking: (name: string) => `${name} 正在散步！`,
      happy: (name: string) => `${name} 很開心！`,
      normal: (name: string) => `${name} 狀態良好`,
      sad: (name: string) => `${name} 感到難過`,
      excited: (name: string) => `${name} 好興奮！`,
    },
    greeting: {
      morning: '早安！',
      afternoon: '午安！',
      evening: '晚安！',
      night: '晚安！',
    },
    stamina: '體力',
    affection: '親密度',
    feedSection: (name: string) => `餵食 ${name}`,
    feedButton: '餵食',
    foodStats: (stamina: number, affection: number) => `+${stamina} 體力 · +${affection} 親密度`,
    insufficientTokens: '代幣不足',
    fedToast: (name: string, food: string) => `${name} 很喜歡這份 ${food}！`,
    visitShop: '前往商店',
    tokenBalance: (n: number) => `${n} 代幣`,
    foodBread: '麵包',
    foodMilk: '牛奶',
    foodFeeds: '飼料',
  },

  // Walk boss encounter
  walkBoss: {
    encounterTitle: '遭遇強敵！',
    bossName: '野生頭目',
    fightCount: (n: number) => `第 ${n + 1} 次遭遇`,
    bossHpLabel: '頭目 HP',
    petHpLabel: (name: string) => `${name} 的 HP`,
    dmgLabel: '傷害',
    attackButton: '攻擊！',
    winTitle: '勝利！',
    winReward: (n: number) => `獲得 +${n} 代幣！`,
    loseTitle: '你的寵物精疲力竭了！',
    loseMessage: '前往商店購買食物，恢復寵物體力。',
    shopButton: '購買食物復活寵物',
    shopTitle: '復活你的寵物',
    shopSubtitle: '購買食物恢復 HP，繼續戰鬥。',
    shopExitButton: '暫不購買',
    continueButton: '繼續散步',
    giveUpButton: '放棄挑戰',
    exitButton: '離開',
    exitConfirmTitle: '離開挑戰？',
    exitConfirmMessage: '你的進度將遺失。',
    exitConfirmYes: '離開',
    exitConfirmNo: '留下',
    challengeBossButton: '挑戰頭目',
  },

  // Badge earned celebration
  badge: {
    unlocked: '徽章解鎖！',
    tokensEarned: (n: number) => `獲得 +${n} 代幣！`,
    celebrate: '太厲害了！',
  },

  // Pet stage-up celebration
  stageUp: {
    levelUp: '等級提升！',
    evolvedInto: (name: string, stage: string) => `${name} 進化為 ${stage}！`,
    child: '繼續散步——你的寵物才剛起步！',
    adult: '驚人的進步！你的努力在每一步中閃耀。',
    elder: '你的寵物已達到最終形態。真正的傳說！',
    celebrate: '太棒了！',
  },

  // Common / shared
  common: {
    offlineBanner: '您目前離線',
    retry: '重試',
    errorGeneric: '發生了一些錯誤。',
    emptyGeneric: '這裡還什麼都沒有。',
  },
} as const;
