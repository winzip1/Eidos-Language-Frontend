/**
 * Eidos Language OS - Central Type Definitions
 * Single Source of Truth for frontend state, layout models, and API schemas.
 */

export type SupportedLocale = 'tr' | 'en' | 'de';

export interface LocaleOption {
  id: SupportedLocale;
  label: string;
  code: string;
  flag: string;
  nativeLabel: string;
}

export const supportedLocalesList: readonly LocaleOption[] = [
  { id: 'tr', label: 'Türkçe', code: 'TR', flag: '🇹🇷', nativeLabel: 'Türkçe' },
  { id: 'en', label: 'English', code: 'EN', flag: '🇬🇧', nativeLabel: 'English' },
  { id: 'de', label: 'Deutsch', code: 'DE', flag: '🇩🇪', nativeLabel: 'Deutsch' },
] as const;

export function isSupportedLocale(val: unknown): val is SupportedLocale {
  return typeof val === 'string' && ['tr', 'en', 'de'].includes(val.trim().toLowerCase());
}

export type SpeakerRole = 'NARRATOR' | 'GERMAN_MALE' | 'GERMAN_FEMALE' | 'UNKNOWN';

export type SidebarNavKey =
  | 'studyDesk'
  | 'player'
  | 'dialogues'
  | 'vocabulary'
  | 'progress'
  | 'languageHub'
  | 'settings'
  | 'library';

export type AppView = SidebarNavKey;

export function isSidebarNavKey(val: unknown): val is SidebarNavKey {
  return (
    typeof val === 'string' &&
    ['studyDesk', 'player', 'dialogues', 'vocabulary', 'progress', 'languageHub', 'settings', 'library'].includes(val)
  );
}

export function isAppView(val: unknown): val is AppView {
  return isSidebarNavKey(val);
}

export interface CourseLevelMeta {
  id: string;
  name: string;
  cefrLevel: string;
  totalUnits: number;
  totalSegments: number;
  totalAudioDurationMs: number;
  isAvailable: boolean;
}

export interface LanguageCourseMeta {
  id: string;
  languageId: string;
  languageName: string;
  nativeLanguageName: string;
  flag: string;
  description: string;
  isAvailable: boolean;
  levels: CourseLevelMeta[];
}

export interface ActiveLanguageState {
  courseId: string;
  languageId: string;
  levelId: string;
  courseTitle: string;
  levelTitle: string;
  flag: string;
}

export type RightPanelTab = 'overview' | 'transcript' | 'vocabulary' | 'dailyStudy';

export function isRightPanelTab(val: unknown): val is RightPanelTab {
  return typeof val === 'string' && ['overview', 'transcript', 'vocabulary', 'dailyStudy'].includes(val);
}

export interface RightPanelState {
  isOpen: boolean;
  activeTab: RightPanelTab;
  isPinned: boolean;
  width?: number;
}

export interface UserPreferences {
  locale: SupportedLocale;
  autoScroll: boolean;
  showTranslation: boolean;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  rightPanelOpen: boolean;
  activeRightPanelTab: RightPanelTab;
  sidebarCollapsed: boolean;
}

export interface WordToken {
  t: string;
  s: number;
  e: number;
  p?: number;
}

export interface Segment {
  id: string;
  segmentIndex: number;
  startMs: number;
  endMs: number;
  durationMs: number;
  startTimeFormatted: string;
  endTimeFormatted: string;
  speaker: SpeakerRole;
  speakerDisplayName: string;
  textLanguage: string;
  rawText: string;
  englishText?: string;
  turkishText?: string;
  words?: WordToken[];
}

export interface UnitSummary {
  id: string;
  unitNumber: number;
  title: string;
  audioFileName: string;
  audioDurationMs: number;
  totalSegments: number;
  audioFileSize: number;
}

export interface UnitDetail extends UnitSummary {
  segments: Segment[];
}

export interface UnitUserProgress {
  unitNumber: number;
  completed: boolean;
  lastPositionMs: number;
  totalListenedMs: number;
  completedAt?: string;
  updatedAt?: string;
}

export interface OverallProgressData {
  userId: string;
  totalUnits: number;
  completedUnitsCount: number;
  overallCompletionRate: number;
  totalListenedMinutes: number;
  streakDays?: number;
  vocabulary: {
    mastered: number;
    learning: number;
    totalPracticed: number;
  };
  units: Record<number, UnitUserProgress>;
}

export interface VocabularyItem {
  id: string;
  unitNumber: number;
  german: string;
  turkish: string;
  english: string;
  speaker: string;
  startMs: number;
  endMs: number;
  status?: 'learning' | 'mastered' | 'unseen';
}

export interface RemoteConfig {
  playbackSpeeds: number[];
  defaultPlaybackSpeed: number;
  seekStepSeconds: number;
  audioChunkSizeBytes: number;
  autoScrollDelayMs: number;
  karaokeLeadTimeMs: number;
  drillAutoRepeatCount: number;
  maxRecentUnitsDisplay: number;
  dailyGoalMinutes: number;
}

export interface DictionaryBundle {
  meta: {
    locale: SupportedLocale;
    version: string;
    lastUpdated: string;
  };
  navigation: {
    studyDesk: string;
    library: string;
    player: string;
    vocabulary: string;
    dialogues: string;
    progress: string;
    languageHub: string;
    settings: string;
  };
  studyDesk: {
    title: string;
    subtitle: string;
    streakCount: string;
    streakDaysSuffix: string;
    dailyGoal: string;
    goalMinutesSuffix: string;
    recommendedLesson: string;
    continueLesson: string;
    startUnitOne: string;
    unitStreamTitle: string;
    allUnits: string;
    filterAll: string;
    filterCompleted: string;
    filterInProgress: string;
    filterNotStarted: string;
    unitCardPrefix: string;
    durationLabel: string;
    segmentsLabel: string;
    completedBadge: string;
    inProgressBadge: string;
    notStartedBadge: string;
    listenNowAction: string;
    searchPlaceholder: string;
    noUnitsFound: string;
    activeCourseBadge: string;
    switchCourseAction: string;
    todayProgress: string;
    totalUnitsFormat: string;
    masterySummary: string;
    quickResumeTitle: string;
    completedUnits: string;
    activeListening: string;
    recentActivityTitle: string;
    recentActivitySubtitle: string;
    noRecentActivity: string;
    noRecentActivityDesc: string;
    jumpToUnit: string;
    lastPositionLabel: string;
    allCompletedCelebration: string;
    restartCourseAction: string;
    levelPrefix: string;
    dailyGoalAchieved: string;
    dailyGoalProgress: string;
    clearFilters: string;
    unitsFound: string;
    filterCountLabel: string;
    listenResumeAction: string;
    activePlayingBadge: string;
    practiceVocabAction: string;
    viewDialoguesAction: string;
    wordsMasteredLabel: string;
    openPlayerAction: string;
    pauseLessonAction: string;
    keyboardShortcutHint: string;
    viewAllAnalytics: string;
    viewAllVocab: string;
    unitCompletedTitle: string;
    minutesShort: string;
    secondsShort: string;
  };
  languageHub: {
    title: string;
    subtitle: string;
    activeLanguageLabel: string;
    selectActiveButton: string;
    currentlyActiveBadge: string;
    exploreUnitsButton: string;
    cefrLevelLabel: string;
    totalUnitsLabel: string;
    totalAudioLabel: string;
    completionRateLabel: string;
    searchLanguages: string;
    availableCourses: string;
    comingSoonCourses: string;
    comingSoonBadge: string;
    germanCourseTitle: string;
    germanCourseDesc: string;
    englishCourseTitle: string;
    englishCourseDesc: string;
    spanishCourseTitle: string;
    spanishCourseDesc: string;
    frenchCourseTitle: string;
    frenchCourseDesc: string;
    courseSwitchedToast: string;
    allCoursesTab: string;
    availableTab: string;
    comingSoonTab: string;
    noCoursesFoundTitle: string;
    noCoursesFoundDesc: string;
    clearSearch: string;
    levelCountBadge: string;
    unitsSuffix: string;
    switchLanguageHeader: string;
    statsTotalLanguages: string;
    statsActiveCourses: string;
    statsUpcomingLanguages: string;
    statsTotalAudioHours: string;
    statsTotalUnitsCount: string;
    statsYourProgress: string;
    hoursShort: string;
    switchLevel: string;
    levelSelected: string;
    lockedLevel: string;
    availableLevels: string;
    listeningTime: string;
    progressPercent: string;
    notStarted: string;
    completedBadge: string;
    inProgressBadge: string;
    selectAndGoStudyDesk: string;
    requestLanguageTitle: string;
    requestLanguageSubtitle: string;
    requestButton: string;
    languageNameLabel: string;
    languageNamePlaceholder: string;
    targetLevelLabel: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    submitRequest: string;
    submitting: string;
    requestSuccessTitle: string;
    requestSuccessDesc: string;
    upcomingPlannedRoadmap: string;
    votesCount: string;
    cancel: string;
    close: string;
    requestLanguageBadge: string;
    plannedTracks: string;
    voteForTrack: string;
    votedBadge: string;
    errorLanguageRequired: string;
  };
  globalPlayer: {
    nowPlaying: string;
    noActiveTrack: string;
    selectUnitToPlay: string;
    startFirstUnit: string;
    playbackSpeedTitle: string;
    liveBadge: string;
    emptyPrompt: string;
    playAction: string;
    pauseAction: string;
    seekBack5s: string;
    seekForward5s: string;
    speedLabel: string;
    volumeLabel: string;
    muteAction: string;
    unmuteAction: string;
    expandToFullPlayer: string;
    collapsePlayer: string;
    activeSentence: string;
    loopAB: string;
    loopActive: string;
    loopDisabled: string;
    previousUnit: string;
    nextUnit: string;
    unitBadge: string;
    buffering: string;
  };
  activeCourse: {
    germanLevel1: string;
    germanLevel2: string;
    englishB1: string;
    spanishA1: string;
    currentCourse: string;
    allCourses: string;
  };
  dialogueStudy: {
    title: string;
    subtitle: string;
    allUnitsTab: string;
    cheatSheetTab: string;
    unitChipPrefix: string;
    listenAllButton: string;
    stopAudioButton: string;
    playingAudioLabel: string;
    listenLineButton: string;
    slowSpeedBadge: string;
    normalSpeedBadge: string;
    fastSpeedBadge: string;
    speedSelectorLabel: string;
    searchPlaceholder: string;
    contextLabel: string;
    germanTextLabel: string;
    turkishTextLabel: string;
    englishExplanationLabel: string;
    keyVocabularyHeading: string;
    cheatSheetTitle: string;
    cheatSheetSubtitle: string;
    cheatSheetSearchPlaceholder: string;
    emptySearchTitle: string;
    emptySearchDesc: string;
    jumpToUnitPlayer: string;
    memorizationTip: string;
    audioNativeBadge: string;
    totalUnitsCount: string;
    dialogueLengthLabel: string;
    practiceSentencesLabel: string;
    speakerAll: string;
    speakerMale: string;
    speakerFemale: string;
    speakerNarrator: string;
    roleplayMode: string;
    roleplayFemalePrompt: string;
    roleplayMalePrompt: string;
    roleplayDesc: string;
    practiceLine: string;
    saveToVocab: string;
    savedToVocab: string;
    viewFullUnit: string;
    dialogueSummaryHeading: string;
    activeLineIndicator: string;
    repeatLine: string;
  };
  sidebar: {
    brandTitle: string;
    brandSubtitle: string;
    labTag: string;
    systemStatus: string;
    userProfileTitle: string;
    userProfileRole: string;
    collapseSidebar: string;
    expandSidebar: string;
    navHeading: string;
    analyticsHeading: string;
  };
  rightPanel: {
    title: string;
    toggleButton: string;
    closeButton: string;
    pinButton: string;
    unpinButton: string;
    tabs: {
      overview: string;
      transcript: string;
      vocabulary: string;
      dailyStudy: string;
    };
    emptyOverview: string;
    emptyTranscript: string;
    emptyVocabulary: string;
    emptyDailyStudy: string;
    overviewDetails: {
      currentUnit: string;
      unitDuration: string;
      totalSegmentsCount: string;
      difficultyLevel: string;
      cefrLevel: string;
      resumeAction: string;
      jumpToPlayer: string;
    };
    transcriptDetails: {
      liveSync: string;
      currentSpeaker: string;
      speedControl: string;
    };
    dailyStudyDetails: {
      streakCount: string;
      streakDaysSuffix: string;
      dailyGoal: string;
      goalMinutesSuffix: string;
      progressPercent: string;
      wordsPracticedToday: string;
    };
  };
  badges: {
    completed: string;
    inProgress: string;
    notStarted: string;
    mastered: string;
    learning: string;
    unseen: string;
    online: string;
    offline: string;
    active: string;
    synced: string;
    beginnerA1: string;
  };
  buttons: {
    save: string;
    cancel: string;
    close: string;
    back: string;
    next: string;
    play: string;
    pause: string;
    resume: string;
    reset: string;
    retry: string;
    search: string;
    filter: string;
    clear: string;
    apply: string;
    flip: string;
    listen: string;
    settings: string;
    logout: string;
    login: string;
    expand: string;
    collapse: string;
    toggle: string;
  };
  tooltips: {
    toggleSidebar: string;
    toggleRightPanel: string;
    playbackSpeed: string;
    autoScroll: string;
    karaokeMode: string;
    soundToggle: string;
    loopAB: string;
    jump10sBack: string;
    jump10sForward: string;
    pinPanel: string;
    flipFlashcard: string;
  };
  library: {
    title: string;
    subtitle: string;
    levelSelectLabel: string;
    unitCardPrefix: string;
    durationLabel: string;
    segmentsLabel: string;
    completedBadge: string;
    inProgressBadge: string;
    notStartedBadge: string;
    startLessonButton: string;
    resumeLessonButton: string;
    totalUnitsFormat: string;
    searchPlaceholder: string;
    filterAll: string;
    filterCompleted: string;
    filterInProgress: string;
    filterNotStarted: string;
    unitsFound: string;
    noUnitsFoundTitle: string;
    noUnitsFoundDesc: string;
    totalDuration: string;
    courseProgress: string;
    levelPrefix: string;
    levelSubtitleTag: string;
    clearFilters: string;
    continueLastLesson: string;
    startUnitOne: string;
    unitsCompletedStat: string;
    totalTimeStat: string;
    levelCefrBadge: string;
    activePlayingBadge: string;
    unitProgressLabel: string;
    filterCountLabel: string;
    listenNowAction: string;
    allCompletedCelebration: string;
    restartCourseAction: string;
    keyboardShortcutHint: string;
  };
  player: {
    nowPlaying: string;
    speedButtonLabel: string;
    seekBackwardLabel: string;
    seekForwardLabel: string;
    playLabel: string;
    pauseLabel: string;
    transcriptHeading: string;
    karaokeMode: string;
    originalAudio: string;
    translationToggle: string;
    showTranslation: string;
    hideTranslation: string;
    autoScroll: string;
    volume: string;
    mute: string;
    unmute: string;
    drillFragment: string;
    searchTranscript: string;
    jumpToSegment: string;
    unitOverview: string;
    totalSegments: string;
    audioLoading: string;
    audioBuffering: string;
    endOfLesson: string;
    nextUnitButton: string;
    previousUnitButton: string;
    loopMode: string;
    loopActive: string;
    loopTooltip: string;
    repeatSentence: string;
    drillPracticeTitle: string;
    saveToVocabulary: string;
    addedToVocabulary: string;
    markLessonComplete: string;
    unitCompletedTitle: string;
    returnToLibrary: string;
    noMatchingSegments: string;
    clearSearch: string;
    filterSegmentCount: string;
    allSpeakers: string;
    filterBySpeaker: string;
    karaokeHighlight: string;
    interactiveKaraoke: string;
    pronounceAudio: string;
    audioProgress: string;
    activeSegmentBadge: string;
    speedPill: string;
    progressFormat: string;
    keyboardShortcuts: string;
    shortcutsHint: string;
    inspectorTitle: string;
    inspectorSubtitle: string;
    wordBreakdown: string;
    openInspector: string;
    closeInspector: string;
    practicePronunciation: string;
    voicePracticeTitle: string;
    voicePracticeDesc: string;
    startRecording: string;
    stopRecording: string;
    listeningVoice: string;
    voiceNotSupported: string;
    voiceMatchScore: string;
    voiceHeard: string;
    slowSpeed: string;
    normalSpeed: string;
    streamSubtitle: string;
    focusStudio: string;
    seekToWord: string;
    audioTrackInfo: string;
    backToStudyDesk: string;
    fullFocusMode: string;
    segmentCopied: string;
    copySentence: string;
    listenWord: string;
    wordTiming: string;
    sentenceLength: string;
    unitLessonBadge: string;
    autoScrollPaused: string;
    resumeAutoScroll: string;
    wordAlreadySaved: string;
    pressSlashToSearch: string;
  };
  speakers: {
    NARRATOR: string;
    GERMAN_MALE: string;
    GERMAN_FEMALE: string;
    UNKNOWN: string;
  };
  vocabulary: {
    title: string;
    subtitle: string;
    contextBanner: string;
    searchPlaceholder: string;
    cardFlipInstruction: string;
    masteredButton: string;
    learningButton: string;
    totalWordsCount: string;
    allUnits: string;
    filterAll: string;
    filterMastered: string;
    filterLearning: string;
    filterUnseen: string;
    unitSelectorLabel: string;
    statusFilterLabel: string;
    playPronunciation: string;
    playingAudio: string;
    flipCard: string;
    frontSide: string;
    backSide: string;
    contextExample: string;
    unitBadge: string;
    drillFragmentBadge: string;
    dialogueBadge: string;
    cardCountFormat: string;
    masteredCountLabel: string;
    learningCountLabel: string;
    unseenCountLabel: string;
    accuracyRateLabel: string;
    viewModeGrid: string;
    viewModeSingle: string;
    nextCard: string;
    prevCard: string;
    emptyTitle: string;
    emptyDesc: string;
    showAllUnits: string;
    noVocabForFilter: string;
    resetFilter: string;
    practiceAll: string;
    jumpToPlayer: string;
    deckCompletedTitle: string;
    deckCompletedDesc: string;
    restartDeck: string;
    shuffleDeck: string;
    cardOfFormat: string;
    clearSearch: string;
    tapToFlipHint: string;
    unseenBadge: string;
    sortLabel: string;
    sortDefault: string;
    sortAlphabetical: string;
    sortStatus: string;
    keyboardShortcuts: string;
    shortcutSpaceFlip: string;
    shortcutArrows: string;
    shortcutMastered: string;
    unitWordCount: string;
    viewModeSrs: string;
    srsDueTitle: string;
    srsDueSubtitle: string;
    srsDueCountLabel: string;
    srsEmptyTitle: string;
    srsEmptyDesc: string;
    masteryRateLabel: string;
    hardButton: string;
    goodButton: string;
    easyButton: string;
    srsStageNew: string;
    srsStageLearning: string;
    srsStageMastered: string;
    accuracyPercentage: string;
    shortcutFlip: string;
    shortcutNav: string;
    shortcutGrade: string;
    filterUnitAll: string;
    statsSummaryTitle: string;
  };
  progress: {
    title: string;
    subtitle: string;
    overallCompletion: string;
    timeListened: string;
    unitsCompleted: string;
    currentStreak: string;
    lastActive: string;
    minutesFormat: string;
    hoursFormat: string;
    streakDays: string;
    streakDescription: string;
    statsSummary: string;
    recentUnitsTitle: string;
    resumeButton: string;
    startListening: string;
    syncingProgress: string;
    progressSynced: string;
    offlineCached: string;
    quickActions: string;
    unitList: string;
    completionRate: string;
    totalUnitsFormat: string;
    noRecentActivity: string;
    noRecentActivityDesc: string;
    practiceVocabulary: string;
    targetLanguage: string;
    allCaughtUp: string;
    lastListenedPrefix: string;
    activeStreakLabel: string;
    dailyGoalLabel: string;
    radarTitle: string;
    radarSubtitle: string;
    radarCompletionAxis: string;
    radarListeningAxis: string;
    radarLegendCompletion: string;
    radarLegendListening: string;
    radarSelectedUnit: string;
    radarHoverHint: string;
    unitUnitPrefix: string;
    unitAxisShortPrefix: string;
    readyToStart: string;
    streakHeroBadge: string;
    masteryHigh: string;
    masteryMedium: string;
    masteryLow: string;
    emptyProgressNotice: string;
    levelA1Heading: string;
    tenUnitsTotal: string;
    listeningGoalProgress: string;
    exploreLibrary: string;
    masteryCompletedDesc: string;
    masteryInProgressPrefix: string;
    masteryInProgressSuffix: string;
    masteryNotStartedDesc: string;
    cefrRadarTitle: string;
    cefrRadarSubtitle: string;
    radarTabUnits: string;
    radarTabCefr: string;
    cefrListening: string;
    cefrVocabulary: string;
    cefrPronunciation: string;
    cefrDialogue: string;
    cefrCompletion: string;
    achievementsTitle: string;
    achievementsSubtitle: string;
    badgeUnlocked: string;
    badgeLocked: string;
    badgeFirstStepTitle: string;
    badgeFirstStepDesc: string;
    badgeFirstMilestoneTitle: string;
    badgeFirstMilestoneDesc: string;
    badgeAudioExplorerTitle: string;
    badgeAudioExplorerDesc: string;
    badgeAudioMasterTitle: string;
    badgeAudioMasterDesc: string;
    badgeVocabHunterTitle: string;
    badgeVocabHunterDesc: string;
    badgeVocabMasterTitle: string;
    badgeVocabMasterDesc: string;
    badgeStreakChampionTitle: string;
    badgeStreakChampionDesc: string;
    badgeHalfwayHeroTitle: string;
    badgeHalfwayHeroDesc: string;
    badgeGraduateTitle: string;
    badgeGraduateDesc: string;
    recentActivityTitle: string;
    recentActivitySubtitle: string;
    jumpToLesson: string;
    lastListenedTime: string;
  };
  settings: {
    title: string;
    subtitle: string;
    languageLabel: string;
    languageDesc: string;
    serverUrlLabel: string;
    serverUrlPlaceholder: string;
    serverUrlDesc: string;
    activeServerLabel: string;
    savedSuccess: string;
    systemInfoTitle: string;
    systemInfoDesc: string;
    resetButton: string;
    audioPrefsTitle: string;
    audioPrefsSubtitle: string;
    autoScrollLabel: string;
    autoScrollDesc: string;
    showTranslationLabel: string;
    showTranslationDesc: string;
    defaultSpeedLabel: string;
    defaultSpeedDesc: string;
    defaultVolumeLabel: string;
    defaultVolumeDesc: string;
    testConnectionButton: string;
    testConnectionTesting: string;
    testConnectionSuccess: string;
    testConnectionFailed: string;
    systemInfoArchitecture: string;
    systemInfoArchitectureValue: string;
    systemInfoEngine: string;
    systemInfoEngineValue: string;
    systemInfoPlatform: string;
    systemInfoPlatformValue: string;
    systemInfoPrinciples: string;
    systemInfoPrinciplesValue: string;
    systemInfoStatus: string;
    systemInfoLatency: string;
    systemInfoVersion: string;
    tabGeneral: string;
    tabPlayback: string;
    tabBackup: string;
    tabSystem: string;
    backupTitle: string;
    backupSubtitle: string;
    exportBackupLabel: string;
    exportBackupDesc: string;
    exportButton: string;
    importBackupLabel: string;
    importBackupDesc: string;
    importButton: string;
    importSuccess: string;
    importError: string;
    resetDataLabel: string;
    resetDataDesc: string;
    resetConfirmTitle: string;
    resetConfirmMessage: string;
    resetConfirmButton: string;
    resetCancelButton: string;
    resetSuccess: string;
  };
  emptyStates: {
    noLessonsFound: string;
    noUnitsAvailable: string;
    noTranscriptAvailable: string;
    noProgressRecorded: string;
    noVocabularyFound: string;
  };
  errors: {
    networkError: string;
    unitNotFound: string;
    audioStreamFailed: string;
    rangeNotSatisfiable: string;
    invalidUnitNumber: string;
    invalidLanguageLevel: string;
    internalServerError: string;
    serverUnreachable: string;
  };
}

export interface DialogueLine {
  id: string;
  segmentIndex: number;
  startMs: number;
  endMs: number;
  durationMs: number;
  speaker: SpeakerRole;
  speakerDisplayName: string;
  germanText: string;
  turkishText: string;
  englishExplanation: string;
}

export interface DialogueVocabItem {
  term: string;
  tr: string;
  en: string;
}

export interface UnitDialogue {
  unitNumber: number;
  title: string;
  contextTr: string;
  contextEn: string;
  contextDe: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  audioFileName: string;
  lines: DialogueLine[];
  keyVocab: DialogueVocabItem[];
}

export interface DialoguesApiResponse {
  totalUnits: number;
  units: UnitDialogue[];
}

