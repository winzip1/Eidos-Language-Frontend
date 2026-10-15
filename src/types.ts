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
  hasTranscript?: boolean;
  transcriptCount?: number;
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
  languageName?: string;
  levelId: string;
  level?: string;
  courseTitle: string;
  levelTitle: string;
  flag: string;
  totalUnits?: number;
  levels?: CourseLevelMeta[];
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

/**
 * Pimsleur Pedagogy Segment Classification:
 * - NARRATOR_INSTRUCTION: English instructor context, cue, or grammar prompt
 * - DIALOGUE_FULL: Complete target conversation or full dialogue turn
 * - DRILL_FRAGMENT: Isolated syllable or morpheme spoken for back-chaining repetition (e.g. "sie", "digen")
 * - DRILL_BUILDUP: Intermediate progressive phrase construction (e.g. "Entschuldigen")
 * - DRILL_TARGET: The completed full target word/phrase following the drill
 * - INTERACTIVE_PROMPT: Question/answer pause encouraging the learner to speak before the native model
 */
export type SegmentType =
  | 'NARRATOR_INSTRUCTION'
  | 'DIALOGUE_FULL'
  | 'DRILL_FRAGMENT'
  | 'DRILL_BUILDUP'
  | 'DRILL_TARGET'
  | 'INTERACTIVE_PROMPT';

/**
 * Functional role of a syllable or word fragment within its target word/phrase:
 * - prefix: Prefix morpheme (e.g. "ver-", "ent-")
 * - root: Root word / core syllable (e.g. "schuld")
 * - end_syllable: Terminal syllable in back-chaining (e.g. "digen", "sie")
 * - compound_part: Sub-element in compound nouns
 * - inflection: Case/tense/gender grammatical suffix
 */
export type FragmentRole =
  | 'prefix'
  | 'root'
  | 'end_syllable'
  | 'compound_part'
  | 'inflection'
  | string;

/**
 * Acoustic F0 pitch analysis result for a segment or audio interval
 */
export interface PitchAnalysis {
  f0MedianHz: number;
  f0MeanHz: number;
  f0StdHz?: number;
  voicedRatio: number;
  isVoiced: boolean;
  estimatedGender: 'MALE' | 'FEMALE' | 'AMBIGUOUS' | 'UNVOICED' | string;
  sampleCount?: number;
}

/**
 * Result of bilingual language detection (en / de)
 */
export interface BilingualDetectionResult {
  language: 'en' | 'de' | string;
  confidence: number;
  method: 'lexical_en' | 'lexical_de' | 'pedagogical_cue' | 'german_char' | 'acoustic_whisper' | 'tie_break' | 'empty_default' | string;
  enScore: number;
  deScore: number;
  rationale: string;
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

  // Diarization & Bilingual Acoustic Properties
  /** Acoustic F0 fundamental frequency and vocal profile */
  pitch?: PitchAnalysis;
  /** Bilingual language detection result and lexical scoring */
  bilingualDetection?: BilingualDetectionResult;

  // Pimsleur Pedagogy & Back-Chaining Drill Properties
  /** Pedagogical classification of this segment */
  segmentType?: SegmentType;
  /** True if this segment represents an isolated syllable or drill piece rather than a full independent sentence */
  isFragment?: boolean;
  /** The parent word or phrase this fragment belongs to (e.g. "Entschuldigen Sie") */
  targetPhrase?: string;
  /** Morphological/phonetic role of this fragment in the back-chaining sequence */
  fragmentRole?: FragmentRole;
  /** Contextual explanation displayed in the UI (e.g. "«Entschuldigen Sie» ifadesinin parçası") */
  displayContext?: string;
  /** Pipeline audit & processing flags (e.g. ["DRILL_RESPELLED", "DRILL_FRAGMENT"]) */
  flags?: string[];
  /** Backward compatibility reference used in legacy parsed units (e.g. "Entschuldigen Sie.") */
  fragmentOf?: string;
}

/**
 * Type guard to determine if a segment is a drill fragment
 */
export function isFragmentSegment(segment?: Partial<Segment> | null): boolean {
  if (!segment) return false;
  if (segment.segmentType === 'DRILL_TARGET' || segment.segmentType === 'NARRATOR_INSTRUCTION' || segment.segmentType === 'DIALOGUE_FULL') {
    return false;
  }
  if (segment.isFragment === true || segment.segmentType === 'DRILL_FRAGMENT') {
    return true;
  }
  if (Array.isArray(segment.flags) && segment.flags.includes('DRILL_FRAGMENT')) {
    return true;
  }
  if (segment.isFragment === false) {
    return false;
  }
  const cleanTarget = (segment.targetPhrase || segment.fragmentOf || '').replace(/[.!?,"']/g, '').trim().toLowerCase();
  const cleanRaw = (segment.rawText || '').replace(/[.!?,"']/g, '').trim().toLowerCase();
  return Boolean(cleanTarget && cleanRaw && cleanTarget !== cleanRaw);
}

/**
 * Type guard to determine if a segment is any part of a drill sequence
 */
export function isDrillSegment(segment: Segment): boolean {
  return (
    isFragmentSegment(segment) ||
    segment.segmentType === 'DRILL_BUILDUP' ||
    segment.segmentType === 'DRILL_TARGET'
  );
}

/**
 * Resolves localized human-readable label for a morphological fragment role.
 * Zero hardcode: Falls back to dynamic dictionary keys.
 */
export function getFragmentRoleLabel(
  role: FragmentRole | undefined,
  dictPlayer?: Partial<DictionaryBundle['player']> | Record<string, any>
): string {
  if (!role) return '';
  if (!dictPlayer) return role;

  switch (role) {
    case 'prefix':
      return dictPlayer.fragmentRolePrefix || 'Önek';
    case 'root':
      return dictPlayer.fragmentRoleRoot || 'Kelime Kökü';
    case 'end_syllable':
      return dictPlayer.fragmentRoleEndSyllable || 'Son Hece';
    case 'compound_part':
      return dictPlayer.fragmentRoleCompoundPart || 'Bileşik Parçası';
    case 'inflection':
      return dictPlayer.fragmentRoleInflection || 'Çekim Eki';
    default:
      return role;
  }
}

/**
 * Normalizes a segment to guarantee consistent pedagogical properties.
 * Infers isFragment from segmentType or targetPhrase when missing,
 * migrates legacy fragmentOf, and sets default displayContext.
 */
export function normalizeSegment(segment: Segment): Segment {
  const isFrag = isFragmentSegment(segment);
  const targetPhrase = segment.targetPhrase || (isFrag && segment.fragmentOf ? segment.fragmentOf : undefined);

  let segType = segment.segmentType;
  if (!segType) {
    if (isFrag) {
      segType = 'DRILL_FRAGMENT';
    } else if (segment.speaker === 'NARRATOR') {
      segType = 'NARRATOR_INSTRUCTION';
    } else {
      segType = 'DIALOGUE_FULL';
    }
  }

  let displayContext = segment.displayContext;
  if (!displayContext && targetPhrase && isFrag) {
    displayContext = `«${targetPhrase}» ifadesinin parçası`;
  }

  return {
    ...segment,
    isFragment: isFrag,
    segmentType: segType,
    targetPhrase,
    displayContext,
  };
}


export interface UnitSummary {
  id: string;
  unitNumber: number;
  title: string;
  audioFileName: string;
  audioDurationMs: number;
  totalSegments: number;
  audioFileSize: number;
  hasTranscript?: boolean;
  transcriptStatus?: 'ready' | 'pending' | 'none';
  audioAvailable?: boolean;
  estimatedDurationMinutes?: number;
}

export interface UnitDetail extends UnitSummary {
  audioUrl?: string;
  segments: Segment[];
  hasTranscript?: boolean;
  transcriptStatus?: 'ready' | 'pending' | 'none';
  audioAvailable?: boolean;
  estimatedDurationMinutes?: number;
}

export interface UnitUserProgress {
  unitNumber: number;
  courseId?: string;
  completed: boolean;
  lastPositionMs: number;
  totalListenedMs: number;
  completedAt?: string;
  updatedAt?: string;
}

export interface OverallProgressData {
  userId: string;
  courseId?: string | null;
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
    resumeLearningLabel: string;
    startLessonButton: string;
    startLesson: string;
    continueLessonButton: string;
    starterPackageTitle: string;
    starterPackageSubtitle: string;
    advancedPackageTitle: string;
    advancedPackageSubtitle: string;
    levelTotalLessons: string;
    activeLevelBadge: string;
    changeLanguageAction: string;
    viewLessonsAction: string;
    lessonListHeading: string;
    streakDaysContinuous: string;
    streakTitle: string;
    levelProgressFormat: string;
    levelA1Title: string;
    levelA1Desc: string;
    levelA2Title: string;
    levelA2Desc: string;
    levelB1Title: string;
    levelB1Desc: string;
    levelB2Title: string;
    levelB2Desc: string;
    levelC1Title: string;
    levelC1Desc: string;
    levelC2Title: string;
    levelC2Desc: string;
    dayBadge: string;
    lessonBadge: string;
    comingSoonBadge: string;
    progressAvailableBadge: string;
    listeningTrackBadge: string;
    readingTrackBadge: string;
    expandFolder: string;
    collapseFolder: string;
    folderLessonsCount: string;
    folderCompletedCount: string;
    levelNotPublishedTitle: string;
    levelNotPublishedDesc: string;
    resumePillBadge: string;
    noUnitsFoundDesc: string;
    audioOnlyBadge: string;
    fullTranscriptBadge: string;
    transcriptPendingBadge: string;
    audioImmersionMode: string;
    audioEstimatedDuration: string;
    audioOnlyLesson: string;
    listeningPractice: string;
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
    italianCourseTitle: string;
    italianCourseDesc: string;
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
    germanLevel3: string;
    germanLevel4: string;
    germanLevel5: string;
    germanLevelPlus: string;
    italianLevel1: string;
    italianLevel2: string;
    italianLevel3: string;
    italianLevel4: string;
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
    filterSpeaker: string;
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
    emptySubtitle?: string;
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
    audioOnlyBadge: string;
    fullTranscriptBadge: string;
    transcriptPendingBadge: string;
    audioImmersionMode: string;
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
    drillFragmentLabel: string;
    targetPhraseLabel: string;
    listenAndRepeatLabel: string;
    syllableBreakdownLabel: string;
    segmentTypeNarratorInstruction: string;
    segmentTypeDialogueFull: string;
    segmentTypeDrillFragment: string;
    segmentTypeDrillBuildup: string;
    segmentTypeDrillTarget: string;
    segmentTypeInteractivePrompt: string;
    fragmentRolePrefix: string;
    fragmentRoleRoot: string;
    fragmentRoleEndSyllable: string;
    fragmentRoleCompoundPart: string;
    fragmentRoleInflection: string;
    partOfTargetPhrase: string;
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
    languageGerman: string;
    languageEnglish: string;
    languageBadgeDe: string;
    languageBadgeEn: string;
    pitchF0Label: string;
    pitchVoicedRatioLabel: string;
    pitchGenderLabel: string;
    pitchVocalProfileMale: string;
    pitchVocalProfileFemale: string;
    pitchVocalProfileUnvoiced: string;
    pitchVocalProfileAmbiguous: string;
    bilingualDetectionLabel: string;
    audioImmersionMode: string;
    audioImmersionBadge: string;
    audioImmersionNotice: string;
    audioOnlyFocusTitle: string;
    audioOnlyFocusDesc: string;
    switchToListeningMode: string;
    dock: {
      play: string;
      pause: string;
      seekBackward10s: string;
      seekForward10s: string;
      speedSelect: string;
      speedNormal: string;
      speedOption: string;
      loopAB: string;
      loopActive: string;
      loopDisabled: string;
      volume: string;
      mute: string;
      unmute: string;
      trackTranscript: string;
      toggleTranslation: string;
      showTranslation: string;
      hideTranslation: string;
      shortcutsButton: string;
      shortcutsHint: string;
      shortcutsModalTitle: string;
      elapsedTime: string;
      remainingTime: string;
      unitBadge: string;
      activeSentenceCounter: string;
      scrubberAriaLabel: string;
      togglePlayAriaLabel: string;
      seekBackwardAriaLabel: string;
      seekForwardAriaLabel: string;
      speedAriaLabel: string;
      volumeAriaLabel: string;
      audioImmersionBadge: string;
      loopDisabledHint: string;
      inspectorDisabledHint: string;
      translationDisabledHint: string;
      inspectorTitle: string;
    };
    tabs: {
      listeningTab: string;
      readingTab: string;
      listeningTitle: string;
      listeningDesc: string;
      listeningFocusTip: string;
      activeSpeakerLabel: string;
      userPromptYourTurn: string;
      visualizerRhythm: string;
      readingTitle: string;
      readingDesc: string;
      fontSizeLabel: string;
      fontSizeSmall: string;
      fontSizeNormal: string;
      fontSizeLarge: string;
      showTranslations: string;
      hideTranslations: string;
      autoScroll: string;
      autoScrollPaused: string;
      resumeAutoScroll: string;
      clickToPlaySentence: string;
      activeSentenceBadge: string;
      replaySentence: string;
      practicePronunciation: string;
      openInspector: string;
      copySentence: string;
      sentenceCopied: string;
      saveToVocabulary: string;
      addedToVocabulary: string;
      totalSentencesBadge: string;
      repeatPrompt: string;
      syllableBreakdownLabel: string;
      targetPhraseLabel: string;
      partOfTargetPhrase: string;
      listenAndRepeatLabel: string;
    };
    empty: {
      noLessonLoaded: string;
      audioPreparing: string;
      audioBuffering: string;
      noTranscriptAvailable: string;
      noMatchingSentences: string;
      selectUnitPrompt: string;
      returnToLibrary: string;
      emptyHistory: string;
      audioOnlyReadingTitle: string;
      audioOnlyReadingDesc: string;
      audioOnlyReadingHint: string;
      switchToListeningMode: string;
    };
    errors: {
      audioLoadFailed: string;
      audioStreamFailed: string;
      lessonNotFound: string;
      transcriptLoadFailed: string;
      networkTimeout: string;
      serverError: string;
      retryButton: string;
      dismissError: string;
      formatStatus: string;
    };
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
    tabAccount: string;
    tabBackup: string;
    tabUsers: string;
    tabMaintenance: string;
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
    languageSwitchedToast: string;
  };
  lessonPlayer: {
    listeningTab: string;
    readingTab: string;
    repeatPrompt: string;
    drillFragment: string;
    drillFragmentLabel: string;
    targetPhraseLabel: string;
    listenAndRepeatLabel: string;
    syllableBreakdownLabel: string;
    fontSizeLabel: string;
    fontSizeSmall: string;
    fontSizeNormal: string;
    fontSizeLarge: string;
    rewind10s: string;
    forward10s: string;
    rewind10sBadge: string;
    forward10sBadge: string;
    remainingTimePrefix: string;
    speedLabel: string;
    playAction: string;
    pauseAction: string;
    listeningFocusTitle: string;
    listeningFocusSubtitle: string;
    listenCarefullyTip: string;
    activeSpeakerLabel: string;
    noSentencesFound: string;
    audioLoadFailed: string;
    dayPrefix: string;
    unitPrefix: string;
    lessonTitle: string;
    optionsMenu: string;
    downloadAudio: string;
    markCompleted: string;
    markIncomplete: string;
    completedBadge: string;
    playbackSpeedTitle: string;
    audioLoading: string;
    audioBuffering: string;
    retryButton: string;
    backToDesk: string;
    currentTimeLabel: string;
    remainingTimeLabel: string;
    scrubberAriaLabel: string;
    togglePlayAriaLabel: string;
    rewind10sAriaLabel: string;
    forward10sAriaLabel: string;
    speedSelectAriaLabel: string;
    fontSizeSelectAriaLabel: string;
    dismissError: string;
    completingAction: string;
    keyboardShortcuts: string;
    activeSentenceBadge: string;
    clickToPlaySentence: string;
    totalSentencesBadge: string;
    repeatSentence: string;
    partOfTargetPhrase: string;
    selectLevelAndLesson: string;
    levelLessonsModalTitle: string;
    levelLessonsModalSubtitle: string;
    levelBadgeA1: string;
    levelBadgeA2: string;
    levelBadgeB1: string;
    levelBadgeB2: string;
    levelBadgeC1: string;
    levelBadgeC2: string;
    comingSoonLevel: string;
    currentlyPlayingLesson: string;
    lessonNumberPrefix: string;
    totalLessonsCount: string;
    closeModal: string;
    audioImmersionMode?: string;
  };
  pipeline: {
    thresholds: {
      vadThreshold: number;
      minSilenceDurationMs: number;
      minSpeechDurationMs: number;
      speechPadMs: number;
      silenceGapMinDurationMs: number;
      asrModelName: string;
      beamSize: number;
      malePitchMaxHz: number;
      femalePitchMinHz: number;
      pitchMinVoicedRatio: number;
      pitchVoicedThreshold: number;
      pitchFminHz: number;
      pitchFmaxHz: number;
      pitchFrameMs: number;
      pitchHopMs: number;
      temperature: number;
      repetitionPenalty: number;
      noRepeatNgramSize: number;
    };
    speakers: {
      NARRATOR: string;
      GERMAN_MALE: string;
      GERMAN_FEMALE: string;
      UNKNOWN: string;
    };
    bilingual: {
      enStopwords: string[];
      deStopwords: string[];
      pedagogicalCues: string[];
    };
    cliMessages: {
      loadingModel: string;
      cudaAvailable: string;
      cudaFallbackCpu: string;
      vadProcessing: string;
      vadComplete: string;
      audioLoaded: string;
      audioFormatStandardized: string;
      transcriptionProgress: string;
      alignmentComplete: string;
      speakerDiarizationDone: string;
      bilingualDetectionStarted: string;
      bilingualDetectionComplete: string;
      pitchExtractionStarted: string;
      pitchExtractionComplete: string;
      speakerClassificationStarted: string;
      speakerClassificationComplete: string;
      audioNotFound: string;
      invalidUnit: string;
      executionSuccess: string;
      failLoudError: string;
      asrProcessing: string;
      asrComplete: string;
      modelLoaded: string;
      monotonicityVerified: string;
      hallucinationShieldActive: string;
    };
    verification: {
      reportTitle: string;
      summaryTitle: string;
      unitLabel: string;
      audioLabel: string;
      rawAsrLabel: string;
      durationLabel: string;
      totalSegmentsLabel: string;
      totalWordsLabel: string;
      statusPass: string;
      statusFail: string;
      statusWarn: string;
      statusSkipped: string;
      tableHeaderIndex: string;
      tableHeaderMetric: string;
      tableHeaderTarget: string;
      tableHeaderActual: string;
      tableHeaderStatus: string;
      metricMonotonicity: string;
      metricSilenceShield: string;
      metricBilingualSeparation: string;
      metricSpeakerDiversity: string;
      metricPitchBoundaries: string;
      metricUtf8Integrity: string;
      metricWordCoverage: string;
      descMonotonicity: string;
      descSilenceShield: string;
      descBilingualSeparation: string;
      descSpeakerDiversity: string;
      descPitchBoundaries: string;
      descUtf8Integrity: string;
      descWordCoverage: string;
      targetMonotonicity: string;
      targetSilenceShield: string;
      targetBilingual: string;
      targetSpeakerDiversity: string;
      targetPitchBoundaries: string;
      targetUtf8: string;
      targetWordCoverage: string;
      allChecksPassed: string;
      verificationFailed: string;
    };
  };
  emptyStates: {
    noLessonsFound: string;
    noUnitsAvailable: string;
    noTranscriptAvailable: string;
    noProgressRecorded: string;
    noVocabularyFound: string;
    dialoguesPendingTranscript: string;
    vocabularyPendingTranscript: string;
    dialoguesPendingTranscriptDesc: string;
    vocabularyPendingTranscriptDesc: string;
    backToStudyDesk: string;
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
    asrModelLoadFailed: string;
    vadProcessingFailed: string;
    audioFileNotFound: string;
    invalidUnitRange: string;
    cudaNotAvailable: string;
    alignmentFailed: string;
    pitchExtractionFailed: string;
    bilingualDetectionFailed: string;
    diarizationFailed: string;
    verificationFailed: string;
    monotonicityViolation: string;
    silenceGapViolation: string;
    bilingualMismatch: string;
    speakerDiversityMissing: string;
    pitchBoundaryViolation: string;
    mojibakeDetected: string;
    unexpected: string;
    uiErrorTitle: string;
    uiErrorDesc: string;
    reloadPage: string;
    audioDiagnosticsFailed: string;
    progressSaveFailed: string;
    syncUnauthorized: string;
    syncMisconfigured: string;
    syncHashMismatch: string;
    syncSizeMismatch: string;
    syncPathTraversal: string;
    syncUploadFailed: string;
    syncFileTooLarge: string;
    syncFileNotFound: string;
  };
  adminSync: {
    unauthorized: string;
    missingAuthHeader: string;
    invalidCredentials: string;
    invalidToken: string;
    serverMisconfigured: string;
    authSuccess: string;
    manifestSuccess: string;
    uploadSuccess: string;
    verifySuccess: string;
    hashMismatch: string;
    sizeMismatch: string;
    pathTraversalBlocked: string;
    invalidParams: string;
    streamError: string;
    syncStatusTitle: string;
    syncStatusDesc: string;
    tokenPlaceholder: string;
    testTokenButton: string;
    testTokenTesting: string;
    syncActiveUnits: string;
    syncStoragePath: string;
    fileDeletedSuccess: string;
    fileNotFound: string;
    cliConnecting: string;
    cliConnected: string;
    cliManifestFetched: string;
    cliLocalScanning: string;
    cliComparing: string;
    cliAllUpToDate: string;
    cliQueueSummary: string;
    cliDryRunNotice: string;
    cliUploadProgress: string;
    cliBatchVerifying: string;
    cliSyncComplete: string;
    cliSyncFailed: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    submitLogin: string;
    submitRegister: string;
    loggingIn: string;
    registering: string;
    logoutAction: string;
    logoutConfirmTitle: string;
    logoutConfirmMessage: string;
    logoutConfirmButton: string;
    logoutCancelButton: string;
    loggedOutSuccess: string;
    sessionExpired: string;
    sessionExpiredDesc: string;
    loginSuccess: string;
    registerSuccess: string;
    accountSuspended: string;
    accountSuspendedDesc: string;
    registrationDisabled: string;
    registrationDisabledDesc: string;
    welcomeBack: string;
    createAccountPrompt: string;
    alreadyHaveAccountPrompt: string;
    forgotPassword: string;
    forgotPasswordNotice: string;
    guestModeTitle: string;
    guestModeDesc: string;
    switchToGuest: string;
    continueAsGuest: string;
    guestBannerPrompt: string;
    guestBannerLoginAction: string;
    rememberMe: string;
    passwordMismatchError: string;
    passwordMinLengthError: string;
    emailInvalidError: string;
    nameRequiredError: string;
    authRequiredTitle: string;
    authRequiredDesc: string;
    showPassword: string;
    hidePassword: string;
  };
  userManagement: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterRoleAll: string;
    filterRoleAdmin: string;
    filterRoleUser: string;
    filterStatusAll: string;
    filterStatusActive: string;
    filterStatusSuspended: string;
    addUserButton: string;
    editUserButton: string;
    deleteUserButton: string;
    resetPasswordButton: string;
    suspendUserButton: string;
    activateUserButton: string;
    roleLabel: string;
    statusLabel: string;
    lastLoginLabel: string;
    createdAtLabel: string;
    actionsLabel: string;
    userListHeader: string;
    roleAdminBadge: string;
    roleUserBadge: string;
    statusActiveBadge: string;
    statusSuspendedBadge: string;
    emptyStateTitle: string;
    emptyStateDesc: string;
    loadingUsers: string;
    refreshingUsers: string;
    modalCreateTitle: string;
    modalCreateSubtitle: string;
    modalEditTitle: string;
    modalEditSubtitle: string;
    modalResetPasswordTitle: string;
    modalResetPasswordSubtitle: string;
    newPasswordLabel: string;
    newPasswordPlaceholder: string;
    modalDeleteTitle: string;
    modalDeleteMessage: string;
    modalDeleteWarning: string;
    confirmDeleteButton: string;
    cancelDeleteButton: string;
    modalSuspendTitle: string;
    modalSuspendMessage: string;
    confirmSuspendButton: string;
    cancelSuspendButton: string;
    modalActivateTitle: string;
    modalActivateMessage: string;
    confirmActivateButton: string;
    cannotDeleteSelf: string;
    cannotSuspendSelf: string;
    userCreatedSuccess: string;
    userUpdatedSuccess: string;
    userDeletedSuccess: string;
    passwordResetSuccess: string;
    statusChangedSuccess: string;
    totalUsersCount: string;
    activeUsersCount: string;
    suspendedUsersCount: string;
    adminUsersCount: string;
    statsUnitsCompleted: string;
    statsWordsMastered: string;
    paginationPrevious: string;
    paginationNext: string;
    paginationPage: string;
    selfBadge: string;
    viewDetailButton: string;
    modalDetailTitle: string;
    modalDetailSubtitle: string;
    statsTotalListenedMinutes: string;
    statsBookmarksCount: string;
    statsTotalAttempted: string;
  };
  accountSettings: {
    title: string;
    subtitle: string;
    tabProfile: string;
    tabSecurity: string;
    profileInfoTitle: string;
    profileInfoSubtitle: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    roleLabel: string;
    accountStatusLabel: string;
    memberSinceLabel: string;
    lastLoginLabel: string;
    updateProfileButton: string;
    updatingProfile: string;
    profileUpdatedSuccess: string;
    securityTitle: string;
    securitySubtitle: string;
    changePasswordTitle: string;
    changePasswordSubtitle: string;
    currentPasswordLabel: string;
    currentPasswordPlaceholder: string;
    newPasswordLabel: string;
    newPasswordPlaceholder: string;
    confirmNewPasswordLabel: string;
    confirmNewPasswordPlaceholder: string;
    changePasswordButton: string;
    changingPassword: string;
    passwordChangedSuccess: string;
    errorCurrentPasswordIncorrect: string;
    errorPasswordMismatch: string;
    errorPasswordLength: string;
    errorSamePassword: string;
    noChangesToSave: string;
    passwordMatchSuccess: string;
    passwordRequirementsHint: string;
    copyUserId: string;
    userIdCopied: string;
    guestRegisterAction: string;
    logoutSectionTitle: string;
    logoutSectionDesc: string;
    logoutButton: string;
  };
  systemMaintenance: {
    title: string;
    subtitle: string;
    tabTelemetry: string;
    tabDatabase: string;
    tabBackups: string;
    tabLogs: string;
    telemetryTitle: string;
    telemetrySubtitle: string;
    serverUptimeLabel: string;
    nodeVersionLabel: string;
    platformLabel: string;
    memoryRssLabel: string;
    memoryHeapTotalLabel: string;
    memoryHeapUsedLabel: string;
    memoryUsagePercent: string;
    dbStatsTitle: string;
    dbStatsSubtitle: string;
    dbFileSizeBytes: string;
    walFileSizeBytes: string;
    dbIntegrityLabel: string;
    dbIntegrityOk: string;
    dbIntegrityFailed: string;
    tableStatsTitle: string;
    tableUsersLabel: string;
    tableProgressLabel: string;
    tableVocabLabel: string;
    tableBookmarksLabel: string;
    tableLogsLabel: string;
    tableStateLabel: string;
    tableSettingsLabel: string;
    totalRecordsLabel: string;
    vacuumTitle: string;
    vacuumSubtitle: string;
    vacuumButton: string;
    vacuuming: string;
    vacuumSuccessTitle: string;
    vacuumSuccessDesc: string;
    vacuumFreedBytesLabel: string;
    backupsTitle: string;
    backupsSubtitle: string;
    createBackupButton: string;
    creatingBackup: string;
    backupCreatedSuccess: string;
    backupsListTitle: string;
    backupFilenameHeader: string;
    backupSizeHeader: string;
    backupDateHeader: string;
    backupActionsHeader: string;
    downloadBackupAction: string;
    restoreBackupAction: string;
    deleteBackupAction: string;
    restoreConfirmTitle: string;
    restoreConfirmMessage: string;
    restoreWarningNotice: string;
    confirmRestoreButton: string;
    cancelRestoreButton: string;
    restoring: string;
    restoreSuccessTitle: string;
    restoreSuccessDesc: string;
    deleteBackupConfirmTitle: string;
    deleteBackupConfirmMessage: string;
    confirmDeleteBackupButton: string;
    deleteBackupSuccess: string;
    logsTitle: string;
    logsSubtitle: string;
    refreshLogsButton: string;
    clearLogsButton: string;
    clearingLogs: string;
    logsClearedSuccess: string;
    filterLevelAll: string;
    filterLevelInfo: string;
    filterLevelWarn: string;
    filterLevelError: string;
    searchLogsPlaceholder: string;
    noLogsFoundTitle: string;
    noLogsFoundDesc: string;
    emergencyBackupNotice: string;
    tableRecordsFormat: string;
    bytesFormatted: string;
    autoRefreshLabel: string;
    lastUpdatedLabel: string;
    reclaimableSpaceBadge: string;
    databaseOptimizedBadge: string;
    totalBackupsStorageLabel: string;
    restoreCheckboxConfirmLabel: string;
    pruneOldBackupsButton: string;
    pruneSuccessDesc: string;
    copyDetailsAction: string;
    detailsCopiedSuccess: string;
    exportLogsAction: string;
    clearOnlyInfoWarnPrompt: string;
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

/**
 * Multi-User, Authentication & RBAC Data Types (Phase 2+)
 */
export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'suspended';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt: string | null;
  completedUnitsCount?: number;
  wordsMasteredCount?: number;
}

/**
 * Operational Database & System Maintenance Types
 */
export interface DbStats {
  tables: Record<string, number>;
  totalRecords: number;
  fileSizeBytes: number;
  walSizeBytes: number;
  integrity: string;
  pageSize?: number;
  pageCount?: number;
  reclaimableBytes?: number;
}

export interface VacuumResult {
  beforeBytes: number;
  afterBytes: number;
  freedBytes: number;
  durationMs: number;
}

export interface SystemHealthTelemetry {
  uptimeSeconds: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external?: number;
  };
  os: {
    platform: string;
    release: string;
    arch: string;
    nodeVersion: string;
    cpuCount?: number;
    loadAvg?: number[];
  };
  db: {
    fileSizeBytes: number;
    walSizeBytes: number;
    totalRecords: number;
    pageSize?: number;
    pageCount?: number;
    reclaimableBytes?: number;
  };
  timestamp: string;
}

export interface DbBackupItem {
  filename: string;
  sizeBytes: number;
  createdAt: string;
  path?: string;
}

export interface SystemLogItem {
  id: number;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  details?: string | null;
  createdAt: string;
}

export interface SystemLogsSummary {
  total: number;
  info: number;
  warn: number;
  error: number;
}

export interface PaginatedSystemLogsResponse extends PaginatedResponse<SystemLogItem> {
  summary?: SystemLogsSummary;
}

export interface PruneBackupsResult {
  deletedCount: number;
  reclaimedBytes: number;
  deletedFiles: string[];
  remainingCount: number;
}

/**
 * Authentication DTOs & API Request/Response Schemas
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface UpdateProfileRequest {
  displayName: string;
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Admin User Management DTOs
 */
export interface AdminCreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
}

export interface AdminUpdateUserRequest {
  displayName?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface AdminResetPasswordRequest {
  newPassword: string;
}

export interface AdminUsersListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * System Maintenance DTOs
 */
export interface SystemLogsQueryParams {
  level?: 'INFO' | 'WARN' | 'ERROR';
  search?: string;
  page?: number;
  limit?: number;
}

export interface RestoreBackupRequest {
  filename: string;
}

export interface DbBackupsListResponse {
  backups: DbBackupItem[];
  totalSizeBytes: number;
  backupCount: number;
}



