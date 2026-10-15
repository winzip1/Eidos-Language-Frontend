/**
 * Eidos Language OS - Listening Mode View
 * Tranquil, distraction-free listening view designed for auditory immersion & pronunciation drill.
 * Features centered whitespace, active lesson & duration badges, organic visualizer card,
 * and soothing focus guidance cards.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React from 'react';
import { Headphones, Sparkles, Clock, BookOpen, RotateCcw } from 'lucide-react';
import type { Segment } from '../../../types';
import { isFragmentSegment } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';
import { usePlayer } from '../../../context/PlayerContext';
import { useCourse } from '../../../context/CourseContext';
import { formatElapsed, getDeterministicDurationMs } from '../../../utils/audioTime';
import { ListeningVisualizerCard } from './ListeningVisualizerCard';

export interface ListeningModeViewProps {
  unitNumber?: number | null;
  durationMs?: number;
  currentMs?: number;
  isPlaying?: boolean;
  isBuffering?: boolean;
  isLoading?: boolean;
  playerError?: string | null;
  activeSegment?: Segment | null;
  hasTranscript?: boolean;
  onTogglePlay?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const ListeningModeView: React.FC<ListeningModeViewProps> = (props) => {
  const { dict } = useDictionary();
  const player = usePlayer();
  const { activeCourse } = useCourse();

  // Resolved values: Explicit props take precedence, fallback to PlayerContext
  const unitNumber = props.unitNumber ?? player.unitNumber;
  const rawDurationMs = props.durationMs ?? player.durationMs;
  const effectiveDurationMs = (rawDurationMs !== undefined && rawDurationMs > 0)
    ? rawDurationMs
    : (getDeterministicDurationMs(0, player.currentUnit?.estimatedDurationMinutes) || 1800000);
  const durationMs = effectiveDurationMs;
  const currentMs = props.currentMs ?? player.currentMs;
  const isPlaying = props.isPlaying ?? player.isPlaying;
  const isBuffering = props.isBuffering ?? player.isBuffering;
  const isLoading = props.isLoading ?? player.isLoadingUnit;
  const playerError = props.playerError !== undefined ? props.playerError : player.playerError;
  const activeSegment = props.activeSegment ?? player.activeSegment;
  const hasTranscript = props.hasTranscript ?? Boolean(player.currentUnit?.hasTranscript || (player.currentUnit?.segments && player.currentUnit.segments.length > 0));
  const onTogglePlay = props.onTogglePlay ?? player.togglePlay;
  const onRetry = props.onRetry ?? (() => player.loadAndPlayUnit(unitNumber || 1, currentMs, true));

  // Single Source of Truth / Zero Fake Data: strictly validate unit number
  const hasValidUnitNum = typeof unitNumber === 'number' && !isNaN(unitNumber) && unitNumber > 0;
  const lessonDisplayBadge = hasValidUnitNum
    ? `${dict.lessonPlayer.unitPrefix} ${unitNumber}`
    : (dict.player?.tabs?.listeningTitle || dict.lessonPlayer.lessonTitle);

  const listeningTabLabel = dict.player?.tabs?.listeningTab || dict.lessonPlayer.listeningTab;
  const listeningTitle = dict.player?.tabs?.listeningTitle || dict.lessonPlayer.listeningFocusTitle;
  const listeningDesc = dict.player?.tabs?.listeningDesc || dict.lessonPlayer.listeningFocusSubtitle;
  const listeningTip = dict.player?.tabs?.listeningFocusTip || dict.lessonPlayer.listenCarefullyTip;
  const replaySentenceLabel = dict.player?.tabs?.replaySentence || dict.lessonPlayer.repeatSentence;

  const effectiveTitle = !hasTranscript
    ? (dict.player?.audioOnlyFocusTitle || listeningTitle)
    : listeningTitle;
  const effectiveDesc = !hasTranscript
    ? (dict.player?.audioOnlyFocusDesc || listeningDesc)
    : listeningDesc;
  const effectiveTip = !hasTranscript
    ? (dict.player?.audioImmersionNotice || listeningTip)
    : listeningTip;

  return (
    <section
      aria-label={listeningTabLabel}
      className={`relative w-full max-w-2xl mx-auto px-3.5 sm:px-6 pt-3 sm:pt-5 pb-10 sm:pb-14 flex flex-col items-center gap-4 sm:gap-6 select-none ${
        props.className || ''
      }`}
    >
      {/* 1. Top Meta Badge Bar: Active Lesson Badge & Total Lesson Duration */}
      <div className="w-full flex items-center justify-between gap-2.5 py-1 px-1">
        {/* Left: Active Course / Lesson Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-bold border border-sand-200/90 shadow-2xs">
            {activeCourse?.flag ? (
              <span className="text-sm leading-none" aria-hidden="true">
                {activeCourse.flag}
              </span>
            ) : (
              <BookOpen className="w-3.5 h-3.5 text-ocean-600 shrink-0" aria-hidden="true" />
            )}
            <span className="truncate">{lessonDisplayBadge}</span>
          </div>

          {activeCourse?.levelTitle && (
            <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-sand-100 text-slate-600 border border-sand-200/80">
              {activeCourse.levelTitle}
            </span>
          )}
        </div>

        {/* Right: Total Lesson Duration Pill */}
        <div className="shrink-0">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-600 text-xs font-mono font-medium border border-sand-200/90 shadow-2xs"
            title={`${dict.studyDesk.durationLabel}: ${formatElapsed(durationMs)}`}
          >
            <Clock className="w-3.5 h-3.5 text-ocean-600 shrink-0" aria-hidden="true" />
            <span>{formatElapsed(durationMs)}</span>
          </div>
        </div>
      </div>

      {/* 2. Centerpiece: Listening Visualizer Card with Organic Waves & Active Speaker */}
      <ListeningVisualizerCard
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        isLoading={isLoading}
        playerError={playerError}
        activeSegment={activeSegment}
        currentMs={currentMs}
        durationMs={durationMs}
        hasTranscript={hasTranscript}
        onTogglePlay={onTogglePlay}
        onRetry={onRetry}
      />

      {/* 3. Tranquil Guidance & Focus Advice Section */}
      <div className="w-full space-y-3 sm:space-y-3.5 mt-1">
        {/* Active Back-Chaining Drill Step Live Banner */}
        {hasTranscript && activeSegment && isFragmentSegment(activeSegment) && (
          <div className="w-full rounded-2xl bg-gradient-to-r from-indigo-50/90 via-white to-sand-50/60 border border-indigo-200/90 p-4 sm:p-5 shadow-soft-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-200/80 shadow-2xs">
                <span className="text-base" aria-hidden="true">🧩</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <h3 className="text-xs sm:text-sm font-bold text-indigo-950 tracking-tight">
                    {dict.player?.tabs?.syllableBreakdownLabel || dict.lessonPlayer.syllableBreakdownLabel} · {dict.player?.tabs?.partOfTargetPhrase || dict.lessonPlayer.drillFragmentLabel}
                  </h3>
                  {activeSegment.targetPhrase && (
                    <span className="text-xs font-semibold text-indigo-700 bg-white/90 px-2 py-0.5 rounded-md border border-indigo-200/70">
                      {dict.player?.tabs?.targetPhraseLabel || dict.lessonPlayer.targetPhraseLabel}: «{activeSegment.targetPhrase}»
                    </span>
                  )}
                </div>
                {activeSegment.displayContext && (
                  <p className="text-xs text-indigo-800/90 leading-relaxed italic mb-1.5">
                    {activeSegment.displayContext}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-indigo-100/80 flex-wrap">
                  <p className="text-xs font-semibold text-indigo-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
                    <span>{dict.player?.tabs?.listenAndRepeatLabel || dict.lessonPlayer.listenAndRepeatLabel}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      player.seek(activeSegment.startMs);
                      if (!player.isPlaying) {
                        player.play();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-100/80 hover:bg-indigo-200/80 text-indigo-800 transition-all active:scale-95 cursor-pointer shadow-2xs border border-indigo-200/70 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
                    title={replaySentenceLabel}
                  >
                    <RotateCcw className="w-3 h-3 text-indigo-600 shrink-0" aria-hidden="true" />
                    <span>{replaySentenceLabel}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Guidance Card */}
        <div className="w-full rounded-2xl bg-white border border-sand-200/90 p-4.5 sm:p-6 text-center shadow-soft transition-all">
          <div className="w-10 h-10 rounded-2xl bg-ocean-100/80 text-ocean-700 mx-auto mb-3 flex items-center justify-center border border-ocean-200/70 shadow-2xs">
            <Headphones className="w-5 h-5 text-ocean-600" aria-hidden="true" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight mb-1.5">
            {effectiveTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            {effectiveDesc}
          </p>
        </div>

        {/* Gentle Tip Card */}
        <div className="w-full rounded-2xl bg-sand-100/80 border border-sand-200/80 p-3 sm:p-4 flex items-start gap-3 shadow-2xs">
          <div className="w-7 h-7 rounded-xl bg-ocean-100 text-ocean-700 flex items-center justify-center shrink-0 border border-ocean-200/70 mt-0.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-ocean-600" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {effectiveTip}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
