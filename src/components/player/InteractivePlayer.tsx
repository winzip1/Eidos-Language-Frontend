/**
 * Eidos Language OS - Interactive Player Studio (Full Canvas)
 * Luxury, full-width focus player studio with karaoke synchronization, sentence inspector drawer, and pronunciation drills.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Keyboard } from 'lucide-react';
import type { Segment, AppView, SpeakerRole } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { useCourse } from '../../context/CourseContext';
import { PlayerStudioHeader } from './PlayerStudioHeader';
import { TranscriptStream } from './TranscriptStream';
import { PlayerControls } from './PlayerControls';
import { SentenceInspectorDrawer } from './SentenceInspectorDrawer';
import { DrillPronunciationModal } from './DrillPronunciationModal';
import { ErrorToast } from '../common/ErrorToast';
import { toast } from 'sonner';

interface InteractivePlayerProps {
  onNavigate: (view: AppView) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const InteractivePlayer: React.FC<InteractivePlayerProps> = ({
  onNavigate,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
}) => {
  const { dict, remoteConfig } = useDictionary();
  const {
    currentUnit,
    unitNumber,
    currentMs,
    speed,
    activeSegmentId,
    loopSegmentId,
    isLoadingUnit,
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
  const { activeCourse } = useCourse();

  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = externalOnSearchChange || setInternalSearchQuery;

  const [selectedSpeaker, setSelectedSpeaker] = useState<SpeakerRole | 'ALL'>('ALL');
  const [drillSegment, setDrillSegment] = useState<Segment | null>(null);
  const [inspectorSegment, setInspectorSegment] = useState<Segment | null>(null);

  // If no unit is loaded, load Unit 1 by default
  useEffect(() => {
    if (!currentUnit && !isLoadingUnit && unitNumber === null) {
      loadAndPlayUnit(1, 0, false);
    }
  }, [currentUnit, isLoadingUnit, unitNumber, loadAndPlayUnit]);

  // Cycle speed helper for hotkey 's'
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

      // If modal or drawer is open, don't interfere
      if (drillSegment || inspectorSegment) return;

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
          if (loopSegmentId) {
            setLoopSegmentId(null);
          } else if (activeSegmentId) {
            setLoopSegmentId(activeSegmentId);
          }
          break;
        case 'KeyT':
          e.preventDefault();
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
    drillSegment,
    inspectorSegment,
    togglePlay,
    seekRelative,
    loopSegmentId,
    activeSegmentId,
    setLoopSegmentId,
    showTranslation,
    setShowTranslation,
    toggleMute,
    handleCycleSpeed,
  ]);

  // Filtered segments based on search query & speaker filter
  const filteredSegments = useMemo(() => {
    if (!currentUnit || !currentUnit.segments) return [];

    let list = currentUnit.segments;

    if (selectedSpeaker !== 'ALL') {
      list = list.filter((s) => s.speaker === selectedSpeaker);
    }

    if (activeSearchQuery.trim()) {
      const q = activeSearchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.rawText.toLowerCase().includes(q) ||
          (s.turkishText && s.turkishText.toLowerCase().includes(q)) ||
          (s.englishText && s.englishText.toLowerCase().includes(q))
      );
    }

    return list;
  }, [currentUnit, activeSearchQuery, selectedSpeaker]);

  const handleToggleLoop = (segmentId: string) => {
    setLoopSegmentId(loopSegmentId === segmentId ? null : segmentId);
  };

  const isUnitCompleted = unitNumber ? Boolean(progress?.units[unitNumber]?.completed) : false;

  const handleToggleComplete = () => {
    if (unitNumber) {
      const nextStatus = !isUnitCompleted;
      saveUnitProgress(unitNumber, nextStatus, currentMs, currentUnit?.audioDurationMs || 60000);
      toast.success(
        nextStatus ? dict.player.unitCompletedTitle : dict.badges.inProgress,
        {
          description: currentUnit?.title,
        }
      );
    }
  };

  const totalSegmentsCount = currentUnit?.segments?.length || 0;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto space-y-4 animate-fade-in pb-4">
      {/* 1. Header Toolbar with Unit Info, Search, and Speaker Filters */}
      <PlayerStudioHeader
        unitNumber={unitNumber}
        unitTitle={currentUnit?.title}
        isUnitCompleted={isUnitCompleted}
        searchQuery={activeSearchQuery}
        onSearchChange={handleSearchChange}
        selectedSpeaker={selectedSpeaker}
        onSelectSpeaker={setSelectedSpeaker}
        totalSegmentsCount={totalSegmentsCount}
        filteredSegmentsCount={filteredSegments.length}
        onToggleComplete={handleToggleComplete}
        onNavigateBack={() => onNavigate('studyDesk')}
        audioDurationMs={currentUnit?.audioDurationMs}
      />

      {/* Fail-Loud Error Surface */}
      {playerError && <ErrorToast message={playerError} />}

      {/* 2. Scrollable Interactive Karaoke Transcript Stream */}
      <TranscriptStream
        segments={filteredSegments}
        isLoading={isLoadingUnit}
        activeSegmentId={activeSegmentId}
        loopSegmentId={loopSegmentId}
        showTranslation={showTranslation}
        autoScroll={autoScroll}
        currentMs={currentMs}
        unitNumber={unitNumber}
        onSeek={seek}
        onToggleLoop={handleToggleLoop}
        onOpenDrill={(seg) => setDrillSegment(seg)}
        onOpenInspector={(seg) => setInspectorSegment(seg)}
        onClearFilters={() => {
          handleSearchChange('');
          setSelectedSpeaker('ALL');
        }}
      />

      {/* 3. Sticky Player Controls Bar */}
      <PlayerControls />

      {/* 4. Keyboard Shortcuts Hint Banner */}
      <div className="flex items-center justify-center gap-2 text-center text-[11px] text-slate-400 py-1 select-none">
        <Keyboard className="w-3.5 h-3.5 text-slate-400" />
        <span>{dict.player.shortcutsHint}</span>
      </div>

      {/* 5. In-Depth Sentence Inspector Drawer */}
      <SentenceInspectorDrawer
        segment={inspectorSegment}
        isOpen={Boolean(inspectorSegment)}
        onClose={() => setInspectorSegment(null)}
        onOpenDrill={(seg) => {
          setInspectorSegment(null);
          setDrillSegment(seg);
        }}
        unitNumber={unitNumber}
      />

      {/* 6. Interactive Drill Pronunciation Modal */}
      <DrillPronunciationModal
        segment={drillSegment}
        isOpen={Boolean(drillSegment)}
        onClose={() => setDrillSegment(null)}
      />
    </div>
  );
};
