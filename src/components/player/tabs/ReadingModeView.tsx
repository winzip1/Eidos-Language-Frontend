/**
 * Eidos Language OS - Reading Mode View
 * Full-featured reading tab view with "Repeat Aloud" guidance, dynamic font size controller,
 * dual-translation visibility toggle, auto-scrolling synchronization with manual pause indicator,
 * single-touch replay segment, dedicated pronunciation drill trigger, and docked player padding.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Volume2, BookOpen, Eye, EyeOff, ArrowDown, Headphones } from 'lucide-react';
import type { Segment } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';
import { usePlayer } from '../../../context/PlayerContext';
import { FontSizeSelector, getStoredFontSize, setStoredFontSize, type ReadingFontSize } from './FontSizeSelector';
import { ReadingSentenceCard } from './ReadingSentenceCard';
import { EmptyState } from '../../common/EmptyState';
import { LoadingSkeleton } from '../../common/LoadingSkeleton';

export interface ReadingModeViewProps {
  segments?: Segment[];
  activeSegmentId?: string | null;
  isPlaying?: boolean;
  isLoading?: boolean;
  currentMs?: number;
  showTranslation?: boolean;
  autoScroll?: boolean;
  unitNumber?: number | null;
  hasTranscript?: boolean;
  onSwitchToListening?: () => void;
  onSeek?: (startMs: number) => void;
  onReplay?: (segment: Segment) => void;
  onPracticePronunciation?: (segment: Segment) => void;
  onOpenInspector?: (segment: Segment) => void;
  className?: string;
}

export const ReadingModeView: React.FC<ReadingModeViewProps> = (props) => {
  const { dict } = useDictionary();
  const player = usePlayer();

  // Resolved values: Explicit props take precedence, fallback to PlayerContext
  const segments = props.segments ?? player.currentUnit?.segments ?? [];
  const activeSegmentId = props.activeSegmentId ?? player.activeSegmentId;
  const isPlaying = props.isPlaying ?? player.isPlaying;
  const isLoading = props.isLoading ?? player.isLoadingUnit;
  const showTranslation = props.showTranslation ?? (player.showTranslation ?? true);
  const autoScroll = props.autoScroll ?? player.autoScroll;
  const currentMs = props.currentMs ?? player.currentMs;
  const unitNumber = props.unitNumber ?? player.unitNumber;
  const onSeek = props.onSeek ?? player.seek;
  const loopSegmentId = player.loopSegmentId;

  // Single Source of Truth for transcript status
  const hasTranscript = props.hasTranscript ?? Boolean(
    player.currentUnit?.hasTranscript ||
    (segments && segments.length > 0) ||
    (player.currentUnit?.segments && player.currentUnit.segments.length > 0)
  );
  const isAudioOnlyLesson = !hasTranscript || (segments.length === 0 && (player.currentUnit?.segments?.length ?? 0) === 0);

  // Dynamic Font Size state persisted in localStorage
  const [fontSize, setFontSize] = useState<ReadingFontSize>(() => getStoredFontSize());

  const handleFontSizeChange = useCallback((newSize: ReadingFontSize) => {
    setFontSize(newSize);
    setStoredFontSize(newSize);
  }, []);

  // Toggle translation visibility directly in reading flow
  const handleToggleTranslation = useCallback(() => {
    player.setShowTranslation(!showTranslation);
  }, [player, showTranslation]);

  // Robust resolved active segment ID: fallback to currentMs matching if activeSegmentId is briefly unset
  const resolvedActiveSegmentId = useMemo(() => {
    if (activeSegmentId) return activeSegmentId;
    if (!segments || segments.length === 0) return null;
    const time = currentMs + 50;
    const found = segments.find((s) => s.startMs <= time && s.endMs >= time);
    return found ? found.id : null;
  }, [activeSegmentId, segments, currentMs]);

  // Track manual user scrolling/navigation to avoid jumping while user is reading
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleUserInteraction = useCallback(() => {
    if (!autoScroll) return;
    setIsUserInteracting(true);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    userScrollTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 5000);
  }, [autoScroll]);

  // Detect scroll navigation keys (PageUp, PageDown, ArrowUp, ArrowDown)
  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (['PageUp', 'PageDown', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        handleUserInteraction();
      }
    },
    [handleUserInteraction]
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  // Smooth auto-scroll to active playing card centered in eye-level
  const scrollActiveIntoView = useCallback((segId: string) => {
    const activeEl = document.getElementById(`reading-seg-${segId}`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  useEffect(() => {
    if (autoScroll && resolvedActiveSegmentId && !isUserInteracting) {
      scrollActiveIntoView(resolvedActiveSegmentId);
    }
  }, [resolvedActiveSegmentId, autoScroll, isUserInteracting, scrollActiveIntoView]);

  // Manual resume auto-scroll button action
  const handleResumeAutoScroll = useCallback(() => {
    setIsUserInteracting(false);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    if (resolvedActiveSegmentId) {
      scrollActiveIntoView(resolvedActiveSegmentId);
    }
  }, [resolvedActiveSegmentId, scrollActiveIntoView]);

  // Handle sentence click: seek and ensure playback starts
  const handleSentenceSeek = useCallback(
    (startMs: number) => {
      onSeek(startMs);
      if (!isPlaying) {
        player.play();
      }
    },
    [isPlaying, onSeek, player]
  );

  // Handle single-touch replay sentence
  const handleReplaySentence = useCallback(
    (segment: Segment) => {
      if (props.onReplay) {
        props.onReplay(segment);
      } else {
        onSeek(segment.startMs);
        if (!isPlaying) {
          player.play();
        }
      }
    },
    [isPlaying, onSeek, player, props.onReplay]
  );

  // Retry handler if unit loading failed
  const handleRetryUnit = useCallback(() => {
    player.clearPlayerError();
    player.loadAndPlayUnit(unitNumber || 1, 0, false);
  }, [player, unitNumber]);

  const repeatPromptLabel = dict.player?.tabs?.repeatPrompt || dict.lessonPlayer.repeatPrompt;
  const totalSentencesLabel = dict.player?.tabs?.totalSentencesBadge || dict.lessonPlayer.totalSentencesBadge;
  const resumeAutoScrollLabel = dict.player?.tabs?.resumeAutoScroll || dict.player.resumeAutoScroll;

  return (
    <section
      aria-label={dict.player?.tabs?.readingTab || dict.lessonPlayer.readingTab}
      onWheel={handleUserInteraction}
      onTouchMove={handleUserInteraction}
      onKeyDown={handleContainerKeyDown}
      className={`relative w-full max-w-3xl mx-auto px-3 sm:px-6 ${props.className || ''}`}
    >
      {/* 1. Header Toolbar: Instruction Prompt, Translation Toggle & Font Size Selector */}
      <div className="flex items-center justify-between gap-2.5 py-3 sm:py-4 px-1 border-b border-sand-200/80 mb-4 sm:mb-5">
        {/* Left: Instruction prompt & sentence count badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-ocean-100/80 text-ocean-700 flex items-center justify-center shrink-0 border border-ocean-200/70 shadow-2xs">
            <Volume2 className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight truncate">
              {isAudioOnlyLesson && segments.length === 0 ? (dict.player?.dock?.audioImmersionBadge || 'Doğrudan Dinleme') : repeatPromptLabel}
            </h2>
            {segments.length > 0 && (
              <p className="text-[11px] text-slate-500 font-medium">
                {segments.length} {totalSentencesLabel}
              </p>
            )}
          </div>
        </div>

        {/* Right Controls: Translation Toggle & Font Size Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Dual-Translation Visibility Toggle */}
          <button
            type="button"
            onClick={segments.length === 0 ? undefined : handleToggleTranslation}
            disabled={isLoading || segments.length === 0}
            aria-disabled={segments.length === 0}
            aria-label={
              segments.length === 0
                ? dict.player?.dock?.translationDisabledHint
                : showTranslation
                ? (dict.player?.tabs?.hideTranslations || dict.player.hideTranslation)
                : (dict.player?.tabs?.showTranslations || dict.player.showTranslation)
            }
            title={
              segments.length === 0
                ? dict.player?.dock?.translationDisabledHint
                : showTranslation
                ? (dict.player?.tabs?.hideTranslations || dict.player.hideTranslation)
                : (dict.player?.tabs?.showTranslations || dict.player.showTranslation)
            }
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-xl border transition-all shadow-2xs select-none ${
              segments.length === 0
                ? 'opacity-40 cursor-not-allowed bg-sand-100 text-slate-400 border-sand-200/70'
                : showTranslation
                ? 'bg-white text-slate-700 border-sand-200/90 hover:bg-sand-50 hover:border-sand-300 cursor-pointer active:scale-95'
                : 'bg-sand-100 text-slate-500 border-sand-200/70 hover:bg-sand-200/80 hover:text-slate-700 cursor-pointer active:scale-95'
            }`}
          >
            {showTranslation && segments.length > 0 ? (
              <Eye className="w-3.5 h-3.5 text-ocean-600 shrink-0" aria-hidden="true" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            )}
            <span className="hidden sm:inline font-medium text-[11px] sm:text-xs">
              {dict.player.translationToggle}
            </span>
          </button>

          {/* Dynamic Font Size Selector */}
          <FontSizeSelector
            fontSize={fontSize}
            onChangeFontSize={handleFontSizeChange}
            disabled={isLoading || segments.length === 0}
          />
        </div>
      </div>

      {/* 2. Main Content Area */}
      {isLoading ? (
        /* Loading Skeleton State */
        <div className="space-y-4 pb-12">
          <LoadingSkeleton count={5} heightClass="h-24" />
        </div>
      ) : segments.length === 0 ? (
        /* Honest Empty State - Zero Fake Data with distinction between unparsed audio lesson vs no search matches */
        <div className="pb-12">
          {player.playerError ? (
            /* Fail-Loud Error State */
            <EmptyState
              title={dict.player?.errors?.audioLoadFailed || player.playerError}
              description={player.playerError}
              actionText={dict.player?.errors?.retryButton || dict.lessonPlayer.retryButton}
              onAction={handleRetryUnit}
              icon={<BookOpen className="w-7 h-7 text-rose-600" />}
            />
          ) : isAudioOnlyLesson ? (
            /* Calm Stripe/Linear Audio-Only Empty State with 1-Click Switch to Listening Mode */
            <EmptyState
              title={dict.player?.empty?.audioOnlyReadingTitle || 'Bu Ders İçin Transkript Hazırlanıyor'}
              description={dict.player?.empty?.audioOnlyReadingDesc || 'Ses kaydı hazırdır. Dersi dinleyerek çalışabilir, telaffuz ve anlama pratiğinizi doğrudan dinleme ile sürdürebilirsiniz.'}
              actionText={props.onSwitchToListening ? (dict.player?.empty?.switchToListeningMode || dict.player?.switchToListeningMode || '🎧 Dinleme Moduna Geç') : undefined}
              onAction={props.onSwitchToListening}
              icon={<Headphones className="w-8 h-8 text-ocean-600" />}
            />
          ) : (
            /* Search / Filter mismatch on parsed lesson */
            <EmptyState
              title={dict.player?.empty?.noMatchingSentences || dict.lessonPlayer.noSentencesFound}
              description={dict.player?.empty?.noMatchingSentences || dict.player.noMatchingSegments}
              icon={<BookOpen className="w-7 h-7 text-ocean-600" />}
            />
          )}
        </div>
      ) : (
        /* Spacious Sentence Cards List */
        <div className="space-y-3.5 sm:space-y-4 pb-10 sm:pb-14" role="feed" aria-busy={isLoading}>
          {segments.map((segment, index) => {
            const isActive = resolvedActiveSegmentId === segment.id;
            const isLooped = loopSegmentId === segment.id;

            return (
              <ReadingSentenceCard
                key={segment.id || `sentence-${index}`}
                segment={segment}
                index={index}
                isActive={isActive}
                fontSize={fontSize}
                isPlaying={isPlaying}
                isLooped={isLooped}
                showTranslation={showTranslation}
                unitNumber={unitNumber}
                onSeek={handleSentenceSeek}
                onReplay={handleReplaySentence}
                onPracticePronunciation={props.onPracticePronunciation}
                onOpenInspector={props.onOpenInspector}
              />
            );
          })}
        </div>
      )}

      {/* 3. Floating "Resume Auto-Scroll" Quick Chip (Shown when user scrolled manually) */}
      {isUserInteracting && autoScroll && resolvedActiveSegmentId && (
        <div className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-20 animate-slide-up">
          <button
            type="button"
            onClick={handleResumeAutoScroll}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-white rounded-full text-xs font-semibold shadow-soft-lg transition-all active:scale-95 cursor-pointer border border-slate-700/50 backdrop-blur-md"
          >
            <ArrowDown className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span>{resumeAutoScrollLabel}</span>
          </button>
        </div>
      )}
    </section>
  );
};
