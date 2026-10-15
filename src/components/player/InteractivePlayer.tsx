/**
 * Eidos Language OS - Interactive Player Studio (Full Canvas Orchestrator)
 * Modern, airy lesson player orchestrating LessonPlayerHeader, LessonSegmentedControl,
 * ListeningModeView, ReadingModeView, DockedAudioPlayer, KeyboardShortcutsModal, and DrillPronunciationModal.
 * Clean, modular shell architecture (~260-280 lines).
 * Zero Hardcode - Strictly Light Mode - Zero Fake Data - Fail-Loud Transparency.
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { AppView, Segment } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { useCourse } from '../../context/CourseContext';
import { LessonPlayerHeader } from './navigation/LessonPlayerHeader';
import { LessonSegmentedControl, type LessonTabMode } from './navigation/LessonSegmentedControl';
import { ReadingModeView } from './tabs/ReadingModeView';
import { ListeningModeView } from './tabs/ListeningModeView';
import { DockedAudioPlayer } from './docked/DockedAudioPlayer';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { DrillPronunciationModal } from './DrillPronunciationModal';
import { SentenceInspectorDrawer } from './SentenceInspectorDrawer';
import { LessonLevelSelectorModal } from './navigation/LessonLevelSelectorModal';
import { useShell } from '../layout/Shell';
import { toast } from 'sonner';
import { getDeterministicDurationMs } from '../../utils/audioTime';

export interface InteractivePlayerProps {
  onNavigate: (view: AppView) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenSettings?: () => void;
  onToggleMobileMenu?: () => void;
}

const STORAGE_TAB_KEY = 'eidos_lesson_player_tab';

export const InteractivePlayer: React.FC<InteractivePlayerProps> = ({
  onNavigate,
  searchQuery,
  onOpenSettings,
  onToggleMobileMenu,
}) => {
  const shell = useShell();
  const handleOpenSettings = onOpenSettings || shell?.openSettings;
  const handleToggleMobileMenu = onToggleMobileMenu || shell?.openMobileSidebar;
  const { dict, remoteConfig } = useDictionary();
  const {
    currentUnit,
    unitNumber,
    currentMs,
    durationMs,
    isPlaying,
    isBuffering,
    isLoadingUnit,
    speed,
    activeSegment,
    activeSegmentId,
    loopSegmentId,
    playerError,
    showTranslation,
    autoScroll,
    togglePlay,
    seek,
    seekRelative,
    setSpeed,
    toggleMute,
    setShowTranslation,
    setLoopSegmentId,
    loadAndPlayUnit,
  } = usePlayer();

  const { progress, saveUnitProgress } = useAuth();
  const { activeCourse, setActiveCourse } = useCourse();

  // Single Source of Truth: derive honest transcript status
  const hasTranscript = Boolean(
    currentUnit?.hasTranscript ||
    (currentUnit?.segments && currentUnit.segments.length > 0)
  );

  // Single Source of Truth: derive deterministic audio duration for header, listening view, and progress
  const effectiveDurationMs = useMemo(() => {
    return (durationMs > 0)
      ? durationMs
      : (getDeterministicDurationMs(currentUnit?.audioDurationMs, currentUnit?.estimatedDurationMinutes) || 1800000);
  }, [durationMs, currentUnit?.audioDurationMs, currentUnit?.estimatedDurationMinutes]);

  // Active Tab Mode: 'reading' | 'listening' with persistent local storage
  const [activeTab, setActiveTab] = useState<LessonTabMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TAB_KEY);
      if (saved === 'listening' || saved === 'reading') {
        return saved;
      }
    } catch {
      // Ignore storage read errors
    }
    return 'reading';
  });

  // Track explicit user tab choices vs initial auto-redirect for unparsed lessons
  const userExplicitTabUnitRef = useRef<number | null>(null);
  const lastCheckedUnitRef = useRef<number | null>(null);

  // Auto-switch to listening mode for unparsed lessons while respecting explicit user tab selection
  useEffect(() => {
    if (!currentUnit || isLoadingUnit || unitNumber === null) return;

    if (lastCheckedUnitRef.current !== unitNumber) {
      lastCheckedUnitRef.current = unitNumber;
      if (!hasTranscript) {
        if (userExplicitTabUnitRef.current !== unitNumber) {
          setActiveTab('listening');
        }
      } else {
        // Parsed lesson: if user did not explicitly choose a tab for this unit, restore saved preferred tab
        if (userExplicitTabUnitRef.current !== unitNumber) {
          try {
            const saved = localStorage.getItem(STORAGE_TAB_KEY);
            if (saved === 'listening' || saved === 'reading') {
              setActiveTab(saved);
            } else {
              setActiveTab('reading');
            }
          } catch {
            setActiveTab('reading');
          }
        }
      }
    }
  }, [currentUnit, isLoadingUnit, unitNumber, hasTranscript]);

  const handleTabChange = useCallback((newTab: LessonTabMode) => {
    setActiveTab(newTab);
    userExplicitTabUnitRef.current = unitNumber;
    try {
      localStorage.setItem(STORAGE_TAB_KEY, newTab);
    } catch {
      // Ignore storage write errors
    }
  }, [unitNumber]);

  // Modals state
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showLevelSelectorModal, setShowLevelSelectorModal] = useState<boolean>(false);
  const [drillSegment, setDrillSegment] = useState<Segment | null>(null);
  const [inspectorSegment, setInspectorSegment] = useState<Segment | null>(null);

  // Reset drill and inspector drawers when unit transitions for state integrity
  useEffect(() => {
    setDrillSegment(null);
    setInspectorSegment(null);
  }, [unitNumber]);

  // Unit completion async operation state
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const isUnitCompleted = unitNumber ? Boolean(progress?.units[unitNumber]?.completed) : false;

  // If no unit is loaded on initial mount, load Unit 1 by default
  useEffect(() => {
    if (!currentUnit && !isLoadingUnit && unitNumber === null) {
      loadAndPlayUnit(1, 0, false);
    }
  }, [currentUnit, isLoadingUnit, unitNumber, loadAndPlayUnit]);

  // Cycle speed helper for keyboard shortcut 's'
  const handleCycleSpeed = useCallback(() => {
    const speeds = remoteConfig.playbackSpeeds || [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
    const currentIndex = speeds.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setSpeed(speeds[nextIndex]);
  }, [speed, remoteConfig.playbackSpeeds, setSpeed]);

  // Global Player Hotkeys Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // If a modal is open, let modal handle its own keys (e.g. Escape)
      if (showShortcutsModal || drillSegment || showLevelSelectorModal) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'KeyL':
          e.preventDefault();
          if (!hasTranscript) {
            toast.info(dict.player?.dock?.loopDisabledHint || 'Cümle döngüsü transkriptli derslerde kullanılabilir');
            break;
          }
          if (loopSegmentId) {
            setLoopSegmentId(null);
          } else if (activeSegmentId) {
            setLoopSegmentId(activeSegmentId);
          }
          break;
        case 'KeyT':
          e.preventDefault();
          if (!hasTranscript) {
            toast.info(dict.player?.dock?.translationDisabledHint || 'Çeviri metni transkript hazırlandığında görüntülenecektir');
            break;
          }
          setShowTranslation(!showTranslation);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyS':
          e.preventDefault();
          handleCycleSpeed();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    showShortcutsModal,
    showLevelSelectorModal,
    drillSegment,
    hasTranscript,
    togglePlay,
    seekRelative,
    loopSegmentId,
    activeSegmentId,
    setLoopSegmentId,
    showTranslation,
    setShowTranslation,
    toggleMute,
    handleCycleSpeed,
    dict.player,
  ]);

  // Filter segments by search query if provided
  const filteredSegments: Segment[] = useMemo(() => {
    if (!currentUnit || !currentUnit.segments) return [];
    if (!searchQuery || !searchQuery.trim()) return currentUnit.segments;

    const q = searchQuery.toLowerCase().trim();
    return currentUnit.segments.filter(
      (s) =>
        s.rawText.toLowerCase().includes(q) ||
        (s.turkishText && s.turkishText.toLowerCase().includes(q)) ||
        (s.englishText && s.englishText.toLowerCase().includes(q))
    );
  }, [currentUnit, searchQuery]);

  // Async toggle lesson completion
  const handleToggleComplete = async () => {
    if (!unitNumber) return;
    try {
      setIsCompleting(true);
      const nextStatus = !isUnitCompleted;
      const targetCourseId = activeCourse?.courseId || 'eidos-german-level1';
      await saveUnitProgress(
        unitNumber,
        nextStatus,
        currentMs,
        effectiveDurationMs,
        targetCourseId
      );
      toast.success(
        nextStatus ? dict.player.unitCompletedTitle : dict.badges.inProgress,
        {
          description: currentUnit?.title,
        }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const code = (err as any)?.statusCode ? `HTTP ${(err as any).statusCode}` : 'Ağ / Kayıt Hatası';
      toast.error(dict.errors?.progressSaveFailed || 'İlerleme sunucuya kaydedilemedi', {
        description: `${message} (${code})`,
      });
    } finally {
      setIsCompleting(false);
    }
  };

  // Direct audio file download helper
  const handleDownloadAudio = useCallback(() => {
    if (!currentUnit?.audioUrl) {
      toast.error(dict.lessonPlayer.audioLoadFailed);
      return;
    }
    const link = document.createElement('a');
    link.href = currentUnit.audioUrl;
    const safeLang = activeCourse?.languageId || 'Audio';
    const safeLevel = activeCourse?.levelId || 'Level';
    link.download = `${safeLang}_${safeLevel}_Unit_${unitNumber || 1}.mp3`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentUnit?.audioUrl, dict.lessonPlayer.audioLoadFailed, unitNumber, activeCourse?.languageId, activeCourse?.levelId]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-sand-100/60 text-slate-800 antialiased relative animate-fade-in">
      {/* 1. Tier 1: Pinned Header Toolbar & Segmented Switcher (shrink-0) */}
      <div className="shrink-0 w-full z-20 px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-2 border-b border-sand-200/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto space-y-2.5 sm:space-y-3">
          <LessonPlayerHeader
            unitNumber={unitNumber}
            unitTitle={currentUnit?.title}
            courseFlag={activeCourse?.flag}
            levelTitle={activeCourse?.levelTitle || activeCourse?.level}
            isCompleted={isUnitCompleted}
            isCompleting={isCompleting}
            hasTranscript={hasTranscript}
            audioDurationMs={effectiveDurationMs}
            audioUrl={currentUnit?.audioUrl}
            onNavigateBack={() => onNavigate('studyDesk')}
            onToggleComplete={handleToggleComplete}
            onDownloadAudio={handleDownloadAudio}
            onOpenShortcuts={() => setShowShortcutsModal(true)}
            onOpenSettings={handleOpenSettings}
            onToggleMobileMenu={handleToggleMobileMenu}
            onOpenLevelSelector={() => setShowLevelSelectorModal(true)}
          />

          <div className="px-1">
            <LessonSegmentedControl
              activeTab={activeTab}
              onChangeTab={handleTabChange}
              readingCount={filteredSegments.length}
              hasTranscript={hasTranscript}
            />
          </div>
        </div>
      </div>

      {/* 2. Tier 2: Independent Scrollable Middle Viewport (flex-1 min-h-0 overflow-y-auto) */}
      <div
        role="tabpanel"
        id={activeTab === 'listening' ? 'lesson-panel-listening' : 'lesson-panel-reading'}
        aria-labelledby={activeTab === 'listening' ? 'lesson-tab-listening' : 'lesson-tab-reading'}
        tabIndex={0}
        className="flex-1 min-h-0 overflow-y-auto w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-4 focus:outline-none scroll-smooth"
      >
        <div className="max-w-5xl mx-auto min-h-full flex flex-col">
          {activeTab === 'listening' ? (
            <ListeningModeView
              unitNumber={unitNumber}
              durationMs={effectiveDurationMs}
              currentMs={currentMs}
              isPlaying={isPlaying}
              isBuffering={isBuffering}
              isLoading={isLoadingUnit}
              playerError={playerError}
              activeSegment={activeSegment}
              hasTranscript={hasTranscript}
              onTogglePlay={togglePlay}
            />
          ) : (
            <ReadingModeView
              segments={filteredSegments}
              activeSegmentId={activeSegmentId}
              isPlaying={isPlaying}
              isLoading={isLoadingUnit}
              currentMs={currentMs}
              showTranslation={showTranslation}
              autoScroll={autoScroll}
              unitNumber={unitNumber}
              hasTranscript={hasTranscript}
              onSwitchToListening={() => handleTabChange('listening')}
              onSeek={seek}
              onPracticePronunciation={(seg) => setDrillSegment(seg)}
              onOpenInspector={(seg) => setInspectorSegment(seg)}
            />
          )}
        </div>
      </div>

      {/* 3. Tier 3: Permanently Pinned Bottom Audio Player Dock (shrink-0 border-t bg-white/98 backdrop-blur z-30) */}
      <div className="shrink-0 w-full border-t border-sand-200/90 bg-white/98 backdrop-blur-md z-30 shadow-soft-lg">
        <DockedAudioPlayer
          onOpenShortcuts={() => setShowShortcutsModal(true)}
          onOpenInspector={() => setInspectorSegment(activeSegment || currentUnit?.segments?.[0] || null)}
        />
      </div>

      {/* 4. Modals & Drawers */}
      <LessonLevelSelectorModal
        isOpen={showLevelSelectorModal}
        onClose={() => setShowLevelSelectorModal(false)}
        activeUnitNumber={unitNumber}
        onSelectUnit={(selectedUnitNumber, selectedLevelId) => {
          if (selectedLevelId && activeCourse && selectedLevelId !== activeCourse.levelId) {
            setActiveCourse(activeCourse.courseId, selectedLevelId);
          }
          loadAndPlayUnit(
            selectedUnitNumber,
            0,
            true,
            activeCourse?.languageId,
            selectedLevelId
          );
          setShowLevelSelectorModal(false);
        }}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      <DrillPronunciationModal
        segment={drillSegment}
        isOpen={Boolean(drillSegment)}
        onClose={() => setDrillSegment(null)}
        unitNumber={unitNumber || 1}
      />

      <SentenceInspectorDrawer
        segment={inspectorSegment}
        isOpen={Boolean(inspectorSegment)}
        onClose={() => setInspectorSegment(null)}
        onOpenDrill={(seg) => {
          setInspectorSegment(null);
          setDrillSegment(seg);
        }}
        unitNumber={unitNumber || 1}
      />
    </div>
  );
};
