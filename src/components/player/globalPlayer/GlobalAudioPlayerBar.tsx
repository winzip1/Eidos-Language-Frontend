import React from 'react';
import { Maximize2, Headphones, AlertCircle, Sparkles, RefreshCw, X } from 'lucide-react';
import { useDictionary } from '../../../context/DictionaryContext';
import { usePlayer } from '../../../context/PlayerContext';
import { useCourse } from '../../../context/CourseContext';
import { useGlobalPlayerKeyboardShortcuts } from '../../../hooks/useGlobalPlayerKeyboardShortcuts';
import type { AppView } from '../../../types';
import { GlobalPlayerScrubber } from './GlobalPlayerScrubber';
import { GlobalPlayerControls } from './GlobalPlayerControls';
import { GlobalPlayerTranscriptTicker } from './GlobalPlayerTranscriptTicker';
import { GlobalPlayerSpeedVolume } from './GlobalPlayerSpeedVolume';

interface GlobalAudioPlayerBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  className?: string;
}

export const GlobalAudioPlayerBar: React.FC<GlobalAudioPlayerBarProps> = ({
  currentView,
  onNavigate,
  className = '',
}) => {
  const { dict, remoteConfig } = useDictionary();
  const { activeCourse } = useCourse();
  const {
    currentUnit,
    unitNumber,
    currentMs,
    durationMs,
    isPlaying,
    isBuffering,
    speed,
    volume,
    isMuted,
    showTranslation,
    activeSegment,
    activeSegmentId,
    loopSegmentId,
    playerError,
    clearPlayerError,
    togglePlay,
    seek,
    seekRelative,
    setSpeed,
    setVolume,
    toggleMute,
    setLoopSegmentId,
    playNextUnit,
    playPreviousUnit,
    loadAndPlayUnit,
  } = usePlayer();

  const hasActiveAudio = unitNumber !== null && durationMs > 0;
  const isCurrentlyInPlayerView = currentView === 'player';

  // Activate Global Workstation Keyboard Shortcuts (Space, Arrows, M, L, [, ])
  useGlobalPlayerKeyboardShortcuts({ enabled: hasActiveAudio });

  const handleToggleLoop = () => {
    if (loopSegmentId) {
      setLoopSegmentId(null);
    } else if (activeSegmentId) {
      setLoopSegmentId(activeSegmentId);
    }
  };

  const handleOpenFullPlayer = () => {
    onNavigate('player');
  };

  const handleRetryLoading = () => {
    if (unitNumber) {
      loadAndPlayUnit(unitNumber, currentMs, true);
    } else {
      loadAndPlayUnit(1, 0, true);
    }
  };

  // Responsibility boundary: Background mini player only renders when active audio is playing/loaded
  if (!hasActiveAudio) {
    return null;
  }

  return (
    <aside
      aria-label={dict.globalPlayer.nowPlaying}
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}
      className={`w-full bg-white/95 backdrop-blur-md border-t border-sand-200/90 shadow-soft-lg transition-all duration-200 z-30 ${className}`}
    >
      {/* 1. Fail-Loud Error Notification Ribbon with Retry and Dismiss */}
      {playerError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-800 animate-fade-in gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold truncate">{playerError}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRetryLoading}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold text-[11px] transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{dict.buttons.retry}</span>
            </button>
            <button
              type="button"
              onClick={clearPlayerError}
              aria-label={dict.buttons.close}
              className="p-1 hover:bg-rose-200/60 rounded-lg text-rose-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Top-Edge High-Precision Scrubber Bar */}
      <div className="w-full px-0 -mt-0.5">
        <GlobalPlayerScrubber
          currentMs={currentMs}
          durationMs={durationMs}
          onSeek={seek}
          disabled={!hasActiveAudio}
        />
      </div>

      {/* 3. Main Player Bar Control Deck */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-1.5 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Left Section: Active Unit Badge & Full-Surface Clickable Return to Lesson Card */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          {hasActiveAudio ? (
            <div
              role="button"
              tabIndex={0}
              onClick={handleOpenFullPlayer}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenFullPlayer();
                }
              }}
              className="flex items-center gap-1.5 sm:gap-2 min-w-0 w-full cursor-pointer group py-0.5 rounded-xl transition-all hover:bg-sand-50/80 active:scale-[0.99] select-none"
              title={`${dict.globalPlayer.returnToLesson} (${dict.globalPlayer.unitBadge} ${String(unitNumber).padStart(2, '0')})`}
              aria-label={dict.globalPlayer.expandToFullPlayer}
            >
              {/* Unit Tag Pill with Flag */}
              <div className="shrink-0 flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-ocean-50/90 border border-ocean-200 rounded-xl group-hover:bg-ocean-100 transition-colors shadow-2xs">
                <span className="text-xs leading-none">{activeCourse?.flag || '🎧'}</span>
                <span className="text-[11px] font-extrabold text-ocean-900 font-mono">
                  {dict.globalPlayer.unitBadge} {String(unitNumber).padStart(2, '0')}
                </span>
              </div>

              {/* Live Mini Transcript Stream / Title */}
              <div className="min-w-0 flex-1">
                <GlobalPlayerTranscriptTicker
                  activeSegment={activeSegment}
                  unitNumber={unitNumber}
                  unitTitle={currentUnit?.title || activeCourse.courseTitle}
                  isPlaying={isPlaying}
                  showTranslation={showTranslation}
                  onClick={handleOpenFullPlayer}
                />
              </div>

              {/* Visual "Derse Dön" Badge on Mobile */}
              <div className="shrink-0 hidden xs:flex sm:hidden items-center gap-0.5 px-1.5 py-0.5 bg-ocean-50 text-ocean-700 border border-ocean-200/80 rounded-lg text-[10px] font-bold">
                <span>{dict.globalPlayer.returnToLesson}</span>
                <span>↗</span>
              </div>
            </div>
          ) : (
            /* Honest Empty / Standby State */
            <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
              <div className="w-8 h-8 rounded-xl bg-sand-100 border border-sand-200 flex items-center justify-center text-slate-400 shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-slate-700 truncate">
                  {dict.globalPlayer.noActiveTrack}
                </span>
                <span className="text-[11px] text-slate-400 truncate hidden xs:inline">
                  {dict.globalPlayer.selectUnitToPlay}
                </span>
              </div>
              <button
                type="button"
                onClick={() => loadAndPlayUnit(1, 0, true)}
                className="ml-2 hidden sm:flex items-center gap-1 px-2.5 py-1 bg-ocean-50 hover:bg-ocean-100 text-ocean-700 border border-ocean-200 rounded-xl text-[11px] font-bold transition-all shadow-2xs active:scale-95"
              >
                <Sparkles className="w-3 h-3 text-ocean-600" />
                <span>{dict.globalPlayer.startFirstUnit}</span>
              </button>
            </div>
          )}
        </div>

        {/* Center Section: Core Playback Controls (Play, -5s/+5s, Prev, Next) */}
        <div className="shrink-0 flex items-center justify-center">
          <GlobalPlayerControls
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            currentMs={currentMs}
            durationMs={durationMs}
            unitNumber={unitNumber}
            totalUnits={activeCourse?.totalUnits || remoteConfig.maxRecentUnitsDisplay || 30}
            onTogglePlay={togglePlay}
            onSeekRelative={seekRelative}
            onPlayPreviousUnit={playPreviousUnit}
            onPlayNextUnit={playNextUnit}
            disabled={!hasActiveAudio}
          />
        </div>

        {/* Right Section: A-B Loop, Speed/Volume Popovers, and Full Player Expand */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Speed & Volume Deck (Desktop/Tablet md+) */}
          <GlobalPlayerSpeedVolume
            speed={speed}
            volume={volume}
            isMuted={isMuted}
            loopSegmentId={loopSegmentId}
            activeSegmentId={activeSegmentId}
            onSetSpeed={setSpeed}
            onSetVolume={setVolume}
            onToggleMute={toggleMute}
            onToggleLoop={handleToggleLoop}
            disabled={!hasActiveAudio}
          />

          {/* Full Player Expansion Action / Derse Dön */}
          <button
            type="button"
            onClick={handleOpenFullPlayer}
            aria-label={dict.globalPlayer.returnToLesson}
            title={dict.globalPlayer.expandToFullPlayer}
            className={`p-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 focus-visible:ring-2 focus-visible:ring-ocean-500 ${
              isCurrentlyInPlayerView
                ? 'bg-ocean-50 border-ocean-200 text-ocean-700 font-bold'
                : 'bg-ocean-50/80 border-ocean-200/80 text-ocean-700 hover:bg-ocean-100 hover:text-ocean-900'
            }`}
          >
            <Maximize2 className="w-4 h-4 text-ocean-700" />
            <span className="hidden lg:inline text-[11px] font-bold">
              {dict.globalPlayer.returnToLesson}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};
