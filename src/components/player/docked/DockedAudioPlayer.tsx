/**
 * Eidos Language OS - Unified Docked Audio Player Dock
 * Modern, airy bottom-docked audio control bar replacing floating/fragmented overlays.
 * 3 Ergonomic Zones:
 *  - Left: Unit badge, active sentence counter, elapsed / remaining time (Mobile: Speed & Translation)
 *  - Center: -10s skip, Hero circular play/pause button (hover/press anims), +10s skip
 *  - Right: Speed selector, A-B loop toggle, translation toggle, volume/mute control, keyboard shortcuts (Mobile: Loop & Volume)
 * Full-width precision scrubber with segment cue points (dots) and boundary snapping.
 * Strictly Light Mode - Zero Hardcode - Fail-Loud Error Transparency - 360dp Mobile Optimized.
 */
import React, { useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Loader2,
  Repeat,
  Languages,
  Keyboard,
  AlertCircle,
  X,
  SkipBack,
  SkipForward,
  Headphones,
  BookOpen,
} from 'lucide-react';
import { useDictionary } from '../../../context/DictionaryContext';
import { usePlayer } from '../../../context/PlayerContext';
import { useCourse } from '../../../context/CourseContext';
import { formatElapsed, formatRemaining, getDeterministicDurationMs } from '../../../utils/audioTime';
import { DockedPlayerScrubber } from './DockedPlayerScrubber';
import { DockedSpeedSelector } from './DockedSpeedSelector';
import { DockedVolumeControl } from './DockedVolumeControl';

export interface DockedAudioPlayerProps {
  className?: string;
  onOpenShortcuts?: () => void;
  onOpenInspector?: () => void;
}

export const DockedAudioPlayer: React.FC<DockedAudioPlayerProps> = ({
  className = '',
  onOpenShortcuts,
  onOpenInspector,
}) => {
  const { dict } = useDictionary();
  const { activeLevel, activeCourse } = useCourse();
  const {
    currentUnit,
    unitNumber,
    currentMs,
    durationMs,
    isPlaying,
    isBuffering,
    isLoadingUnit,
    speed,
    volume,
    isMuted,
    showTranslation,
    loopSegmentId,
    activeSegmentId,
    playerError,
    clearPlayerError,
    retryLoadUnit,
    loadAndPlayUnit,
    togglePlay,
    seek,
    seekRelative,
    setSpeed,
    setVolume,
    toggleMute,
    setShowTranslation,
    setLoopSegmentId,
    playPreviousUnit,
    playNextUnit,
  } = usePlayer();

  const isBusy = isLoadingUnit || isBuffering;
  const isLoopActive = Boolean(loopSegmentId);
  const totalUnits = activeLevel?.totalUnits || activeCourse?.totalUnits || 30;
  const segments = currentUnit?.segments || [];

  // Single Source of Truth / Zero Hardcode: derive deterministic duration (default 30m / 1,800,000ms)
  const rawDurationMs = durationMs;
  const effectiveDurationMs = (rawDurationMs !== undefined && rawDurationMs > 0)
    ? rawDurationMs
    : (currentUnit?.audioDurationMs || getDeterministicDurationMs(0, currentUnit?.estimatedDurationMinutes) || 1800000);

  // Active sentence index calculation
  const activeSentenceIndex = useMemo(() => {
    if (!activeSegmentId || segments.length === 0) return 0;
    const idx = segments.findIndex((s) => s.id === activeSegmentId);
    return idx >= 0 ? idx + 1 : 0;
  }, [activeSegmentId, segments]);

  // Robust loop toggling with segment-1 fallback if at lesson start
  const handleToggleLoop = () => {
    if (loopSegmentId) {
      setLoopSegmentId(null);
    } else {
      const targetId = activeSegmentId || segments[0]?.id || null;
      if (targetId) {
        setLoopSegmentId(targetId);
      }
    }
  };

  const handleRewind = () => {
    seekRelative(-10);
  };

  const handleForward = () => {
    seekRelative(10);
  };

  const handleToggleTranslation = () => {
    setShowTranslation(!showTranslation);
  };

  const handleRetry = () => {
    clearPlayerError();
    retryLoadUnit();
  };

  return (
    <section
      aria-label={dict.lessonPlayer.lessonTitle}
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}
      className={`w-full bg-white/98 backdrop-blur-md border-t border-sand-200/90 shadow-soft-lg select-none pb-1 sm:pb-2 ${className}`}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-2 sm:pt-3 flex flex-col gap-1.5 sm:gap-2">
        {/* Screen Reader Live Status Announcement */}
        <div className="sr-only" aria-live="polite">
          {isBusy ? (isLoadingUnit ? dict.lessonPlayer.audioLoading : dict.lessonPlayer.audioBuffering) : ''}
        </div>

        {/* Fail-Loud Error Alert Banner with Self-Healing Retry */}
        {playerError && (
          <div className="flex items-center justify-between gap-2 p-2 sm:p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 animate-slide-up">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="truncate font-medium">{playerError}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleRetry}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-[11px] transition-colors shadow-2xs active:scale-95 cursor-pointer"
              >
                {dict.lessonPlayer.retryButton}
              </button>
              <button
                type="button"
                onClick={clearPlayerError}
                className="p-1 hover:bg-rose-100 rounded-lg text-rose-600 transition-colors cursor-pointer"
                aria-label={dict.lessonPlayer.dismissError}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Header Row (Visible on screens < 640px to give maximum breathing room to scrubber & controls) */}
        <div className="flex sm:hidden items-center justify-between gap-2 text-xs">
          {/* Left: Unit badge & Sentence Counter / Audio Immersion Badge */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-ocean-50 border border-ocean-200/80 rounded-md text-[11px] font-bold text-ocean-900 font-mono shrink-0">
              <Headphones className="w-3 h-3 text-ocean-600" />
              {dict.player.dock.unitBadge} {unitNumber ? String(unitNumber).padStart(2, '0') : '--'}
            </span>
            {segments.length > 0 ? (
              <span className="text-[11px] font-mono text-slate-500 font-medium truncate">
                {activeSentenceIndex > 0 ? activeSentenceIndex : '-'}/{segments.length}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-ocean-50 text-ocean-700 border border-ocean-200/80 rounded-md text-[11px] font-semibold truncate">
                <Headphones className="w-3 h-3 text-ocean-600" />
                {dict.player.dock.audioImmersionBadge}
              </span>
            )}
          </div>

          {/* Right: Elapsed & Remaining Time */}
          <div className="flex items-center gap-1 font-mono text-[11px] tabular-nums shrink-0">
            <span className="font-semibold text-slate-700">
              {formatElapsed(currentMs)}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500">
              {formatRemaining(currentMs, effectiveDurationMs, '-')}
            </span>
          </div>
        </div>

        {/* Full-Width Precision Scrubber with Segment Cue Points (Dots) & Snapping */}
        <DockedPlayerScrubber
          currentMs={currentMs}
          durationMs={effectiveDurationMs}
          onSeek={seek}
          segments={segments}
          activeSegmentId={activeSegmentId}
          disabled={effectiveDurationMs <= 0}
        />

        {/* Main 3 Ergonomic Control Zones: Symmetric Left/Right flex-1 ensures Center Zone stays pixel-perfect centered */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 pt-0.5">
          {/* ZONE 1: SOL BÖLGE (Desktop: Ders & Süre Bilgisi | Mobil: Hız & Çeviri) */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 justify-start">
            {/* Desktop View: Unit Badge & Active Sentence / Segment Counter & Time Info */}
            <div className="hidden sm:flex items-center gap-3 min-w-0">
              {/* Unit Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-ocean-50/90 border border-ocean-200/80 rounded-xl shadow-2xs shrink-0">
                <Headphones className="w-3.5 h-3.5 text-ocean-600" />
                <span className="text-xs font-mono font-bold text-ocean-900 whitespace-nowrap">
                  {dict.player.dock.unitBadge} {unitNumber ? String(unitNumber).padStart(2, '0') : '--'}
                </span>
              </div>

              {/* Active Sentence / Segment Counter & Time Info */}
              <div className="flex flex-col min-w-0">
                {segments.length > 0 ? (
                  <span className="text-[11px] font-semibold text-slate-700 truncate">
                    {dict.player.dock.activeSentenceCounter}:{' '}
                    <span className="font-mono font-bold text-orange-600">
                      {activeSentenceIndex > 0 ? activeSentenceIndex : '-'}
                    </span>
                    <span className="text-slate-400">/{segments.length}</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-ocean-50 text-ocean-700 border border-ocean-200/80 rounded-md text-[11px] font-semibold">
                      <Headphones className="w-3 h-3 text-ocean-600" />
                      {dict.player.dock.audioImmersionBadge}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1 font-mono text-xs tabular-nums text-slate-500">
                  <span className="font-bold text-slate-800">{formatElapsed(currentMs)}</span>
                  <span className="text-slate-300">/</span>
                  <span className="font-medium text-slate-500">{formatRemaining(currentMs, effectiveDurationMs, '-')}</span>
                </div>
              </div>
            </div>

            {/* Mobile View: Speed & Translation (min 44px touch targets) */}
            <div className="flex sm:hidden items-center gap-1.5">
              <DockedSpeedSelector
                speed={speed}
                onSetSpeed={setSpeed}
                disabled={effectiveDurationMs <= 0}
              />
              <button
                type="button"
                onClick={handleToggleTranslation}
                disabled={segments.length === 0}
                aria-pressed={showTranslation}
                aria-label={
                  segments.length === 0
                    ? dict.player.dock.translationDisabledHint
                    : dict.player.dock.toggleTranslation
                }
                title={
                  segments.length === 0
                    ? dict.player.dock.translationDisabledHint
                    : showTranslation
                    ? dict.player.dock.hideTranslation
                    : dict.player.dock.showTranslation
                }
                className={`min-w-[44px] min-h-[44px] p-2.5 rounded-xl border flex items-center justify-center transition-all active:scale-95 shadow-2xs focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                  showTranslation && segments.length > 0
                    ? 'bg-ocean-50 border-ocean-200 text-ocean-700 font-bold'
                    : 'bg-sand-50/90 border-sand-200 text-slate-600 hover:bg-sand-100 hover:text-slate-800'
                }`}
              >
                <Languages className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ZONE 2: ORTA BÖLGE (Ana Kontroller: -10s, Hero Dairesel Play/Pause, +10s) */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 shrink-0">
            {/* Desktop Previous Unit Button */}
            <button
              type="button"
              onClick={playPreviousUnit}
              disabled={!unitNumber || unitNumber <= 1 || isBusy}
              aria-label={dict.globalPlayer.previousUnit}
              title={dict.globalPlayer.previousUnit}
              className="hidden lg:flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 text-slate-400 hover:text-slate-800 hover:bg-sand-100 rounded-full transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* -10s Skip Backward Button */}
            <button
              type="button"
              onClick={handleRewind}
              disabled={effectiveDurationMs <= 0 || isBusy}
              aria-label={dict.player.dock.seekBackwardAriaLabel || dict.lessonPlayer.rewind10sAriaLabel}
              title={dict.player.dock.seekBackward10s || dict.lessonPlayer.rewind10s}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 px-3 py-2 rounded-full border border-sand-200 bg-sand-50/90 hover:bg-sand-100 active:scale-95 text-slate-700 transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-700 shrink-0" />
              <span className="text-[11px] font-mono font-bold text-slate-700">
                10
              </span>
            </button>

            {/* Hero Circular Play / Pause Button with Pulsing & Pressed Animations */}
            <div className="relative flex items-center justify-center">
              {isPlaying && !isBusy && (
                <div className="absolute inset-0 rounded-full bg-orange-400 opacity-20 animate-ping pointer-events-none" />
              )}

              <button
                type="button"
                onClick={togglePlay}
                disabled={effectiveDurationMs <= 0 && !isPlaying && !currentUnit}
                aria-pressed={isPlaying}
                aria-label={isPlaying ? dict.player.dock.pause : dict.player.dock.play}
                title={isPlaying ? dict.player.dock.pause : dict.player.dock.play}
                className={`relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white shadow-soft transition-all duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                  isPlaying
                    ? 'bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 shadow-md ring-4 ring-orange-200/80 hover:brightness-105'
                    : 'bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 ring-2 ring-orange-100 shadow-soft-lg'
                }`}
              >
                {isBusy ? (
                  <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-white" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                ) : (
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
                )}
              </button>
            </div>

            {/* +10s Skip Forward Button */}
            <button
              type="button"
              onClick={handleForward}
              disabled={effectiveDurationMs <= 0 || isBusy}
              aria-label={dict.player.dock.seekForwardAriaLabel || dict.lessonPlayer.forward10sAriaLabel}
              title={dict.player.dock.seekForward10s || dict.lessonPlayer.forward10s}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 px-3 py-2 rounded-full border border-sand-200 bg-sand-50/90 hover:bg-sand-100 active:scale-95 text-slate-700 transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="text-[11px] font-mono font-bold text-slate-700">
                10
              </span>
              <RotateCw className="w-4 h-4 text-slate-700 shrink-0" />
            </button>

            {/* Desktop Next Unit Button */}
            <button
              type="button"
              onClick={playNextUnit}
              disabled={!unitNumber || unitNumber >= totalUnits || isBusy}
              aria-label={dict.globalPlayer.nextUnit}
              title={dict.globalPlayer.nextUnit}
              className="hidden lg:flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 text-slate-400 hover:text-slate-800 hover:bg-sand-100 rounded-full transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* ZONE 3: SAĞ BÖLGE (Desktop: İkincil Araçlar | Mobil: Döngü & Ses) */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 min-w-0 flex-1">
            {/* Desktop Speed Selector */}
            <div className="hidden sm:block">
              <DockedSpeedSelector
                speed={speed}
                onSetSpeed={setSpeed}
                disabled={effectiveDurationMs <= 0}
              />
            </div>

            {/* A-B Segment Drill Loop Toggle */}
            <button
              type="button"
              onClick={handleToggleLoop}
              disabled={segments.length === 0 || isBusy}
              aria-pressed={isLoopActive}
              aria-label={
                segments.length === 0
                  ? dict.player.dock.loopDisabledHint
                  : isLoopActive
                  ? dict.player.dock.loopActive
                  : dict.player.dock.loopAB
              }
              title={
                segments.length === 0
                  ? dict.player.dock.loopDisabledHint
                  : isLoopActive
                  ? dict.player.dock.loopActive
                  : dict.player.dock.loopAB
              }
              className={`min-w-[44px] min-h-[44px] p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                isLoopActive
                  ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-100 font-bold'
                  : 'bg-sand-50/90 border-sand-200 text-slate-600 hover:bg-sand-100 hover:text-slate-800'
              }`}
            >
              <Repeat
                className={`w-4 h-4 ${
                  isLoopActive ? 'animate-spin-slow text-amber-600' : 'text-slate-600'
                }`}
              />
              <span className="hidden xl:inline text-[11px]">
                {isLoopActive ? dict.player.dock.loopActive : dict.player.dock.loopAB}
              </span>
            </button>

            {/* Desktop Translation Show/Hide Toggle */}
            <button
              type="button"
              onClick={handleToggleTranslation}
              disabled={segments.length === 0}
              aria-pressed={showTranslation}
              aria-label={
                segments.length === 0
                  ? dict.player.dock.translationDisabledHint
                  : dict.player.dock.toggleTranslation
              }
              title={
                segments.length === 0
                  ? dict.player.dock.translationDisabledHint
                  : showTranslation
                  ? dict.player.dock.hideTranslation
                  : dict.player.dock.showTranslation
              }
              className={`hidden sm:flex min-w-[44px] min-h-[44px] p-2.5 rounded-xl border items-center justify-center transition-all active:scale-95 shadow-2xs focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                showTranslation && segments.length > 0
                  ? 'bg-ocean-50 border-ocean-200 text-ocean-700 font-bold'
                  : 'bg-sand-50/90 border-sand-200 text-slate-600 hover:bg-sand-100 hover:text-slate-800'
              }`}
            >
              <Languages className="w-4 h-4" />
            </button>

            {/* Volume & Mute Control */}
            <DockedVolumeControl
              volume={volume}
              isMuted={isMuted}
              onSetVolume={setVolume}
              onToggleMute={toggleMute}
              disabled={effectiveDurationMs <= 0}
            />

            {/* Sentence Inspector Dialog Button (Visible on lg+ screens) */}
            {onOpenInspector && (
              <button
                type="button"
                onClick={segments.length === 0 ? undefined : onOpenInspector}
                disabled={segments.length === 0}
                aria-disabled={segments.length === 0}
                aria-label={
                  segments.length === 0
                    ? dict.player.dock.inspectorDisabledHint
                    : (dict.player.dock.inspectorTitle || 'Cümle Müfettişi')
                }
                title={
                  segments.length === 0
                    ? dict.player.dock.inspectorDisabledHint
                    : (dict.player.dock.inspectorTitle || 'Cümle Müfettişi')
                }
                className={`hidden lg:flex min-w-[44px] min-h-[44px] p-2.5 rounded-xl border items-center justify-center transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-orange-400 ${
                  segments.length === 0
                    ? 'opacity-40 cursor-not-allowed bg-sand-50/90 border-sand-200 text-slate-400'
                    : 'cursor-pointer active:scale-95 bg-sand-50/90 border-sand-200 text-slate-600 hover:bg-sand-100 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
              </button>
            )}

            {/* Keyboard Shortcuts Dialog Button (Visible on sm+ screens) */}
            {onOpenShortcuts && (
              <button
                type="button"
                onClick={onOpenShortcuts}
                aria-label={dict.player.dock.shortcutsButton}
                title={dict.player.dock.shortcutsButton}
                className="hidden md:flex min-w-[44px] min-h-[44px] p-2.5 rounded-xl border border-sand-200 bg-sand-50/90 text-slate-600 hover:bg-sand-100 hover:text-slate-800 items-center justify-center transition-all active:scale-95 shadow-2xs focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
