/**
 * Eidos Language OS - Reading Sentence Card
 * High-craftsmanship sentence card with clear numbering badge, selectable dual-language typography,
 * dynamic font scaling, subtle active highlight (soft ocean blue / indigo / beige), speaker role badges,
 * pedagogical back-chaining drill fragment callout, single-touch replay, and quick copy/bookmark actions.
 * Ergonomic 360dp mobile layout: text given maximum horizontal breathing room, actions cleanly docked in bottom strip.
 * Memoized with React.memo for high-performance 60fps audio scrubbing and synchronized playback.
 * Strictly Light Mode - Zero Hardcode - Full Keyboard & ARIA Accessibility.
 */
import React from 'react';
import { Volume2, User, Repeat } from 'lucide-react';
import type { Segment } from '../../../types';
import { isFragmentSegment } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';
import { formatElapsed } from '../../../utils/audioTime';
import type { ReadingFontSize } from './FontSizeSelector';
import { ReadingSentenceActions } from './ReadingSentenceActions';
import { DrillFragmentBadge } from './DrillFragmentBadge';
import { DrillFragmentCallout } from './DrillFragmentCallout';

export interface ReadingSentenceCardProps {
  segment: Segment;
  index: number;
  isActive: boolean;
  fontSize: ReadingFontSize;
  isPlaying?: boolean;
  isLooped?: boolean;
  showTranslation?: boolean;
  unitNumber?: number | null;
  onSeek?: (startMs: number) => void;
  onReplay?: (segment: Segment) => void;
  onPracticePronunciation?: (segment: Segment) => void;
  onOpenInspector?: (segment: Segment) => void;
  className?: string;
}

const ReadingSentenceCardComponent: React.FC<ReadingSentenceCardProps> = ({
  segment,
  index,
  isActive,
  fontSize,
  isPlaying = false,
  isLooped = false,
  showTranslation = true,
  unitNumber,
  onSeek,
  onReplay,
  onPracticePronunciation,
  onOpenInspector,
  className = '',
}) => {
  const { dict } = useDictionary();
  const isFragment = isFragmentSegment(segment);

  // Dynamic typography scale based on chosen font size
  const targetTextClass =
    fontSize === 'large'
      ? 'text-lg sm:text-xl font-semibold leading-relaxed'
      : fontSize === 'small'
      ? 'text-sm sm:text-base font-medium leading-relaxed'
      : 'text-base sm:text-lg font-medium leading-relaxed';

  const translationTextClass =
    fontSize === 'large'
      ? 'text-base sm:text-lg leading-normal'
      : fontSize === 'small'
      ? 'text-xs sm:text-sm leading-normal'
      : 'text-sm sm:text-base leading-normal';

  const handleClick = () => {
    onSeek?.(segment.startMs);
  };

  // Keyboard navigation strictly scoped to card (avoids intercepting child button Enter/Space)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSeek?.(segment.startMs);
    }
  };

  const displayNumber = index + 1;
  const formattedTime = segment.startTimeFormatted || formatElapsed(segment.startMs);

  // Speaker Badge Helper
  const renderSpeakerTag = () => {
    if (segment.speaker === 'GERMAN_MALE') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-ocean-50 text-ocean-700 border border-ocean-200/70 select-none">
          <User className="w-2.5 h-2.5 text-ocean-600" aria-hidden="true" />
          {dict.speakers.GERMAN_MALE}
        </span>
      );
    }
    if (segment.speaker === 'GERMAN_FEMALE') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70 select-none">
          <User className="w-2.5 h-2.5 text-purple-600" aria-hidden="true" />
          {dict.speakers.GERMAN_FEMALE}
        </span>
      );
    }
    if (segment.speaker === 'ITALIAN_MALE') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 select-none">
          <User className="w-2.5 h-2.5 text-emerald-600" aria-hidden="true" />
          {dict.speakers.ITALIAN_MALE}
        </span>
      );
    }
    if (segment.speaker === 'ITALIAN_FEMALE') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200/70 select-none">
          <User className="w-2.5 h-2.5 text-rose-600" aria-hidden="true" />
          {dict.speakers.ITALIAN_FEMALE}
        </span>
      );
    }
    return null;
  };

  const clickToPlaySentenceTitle = dict.player?.tabs?.clickToPlaySentence || dict.lessonPlayer.clickToPlaySentence;
  const activeSentenceBadgeLabel = dict.player?.tabs?.activeSentenceBadge || dict.lessonPlayer.activeSentenceBadge;

  return (
    <article
      id={`reading-seg-${segment.id}`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-current={isActive ? 'true' : undefined}
      aria-label={`${displayNumber}. ${segment.rawText}`}
      title={clickToPlaySentenceTitle}
      className={`group relative flex flex-col p-3.5 sm:p-4 rounded-2xl transition-all duration-200 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/50 focus-visible:ring-offset-2 ${
        isActive
          ? isFragment
            ? 'bg-gradient-to-r from-indigo-50/80 via-ocean-50/30 to-white border-y border-r border-indigo-200/90 border-l-4 border-l-indigo-600 shadow-soft-sm ring-1 ring-indigo-400/25'
            : 'bg-ocean-50/60 border-y border-r border-y-ocean-200/80 border-r-ocean-200/80 border-l-4 border-l-ocean-500 shadow-soft-sm ring-1 ring-ocean-400/25'
          : isFragment
          ? 'bg-gradient-to-r from-indigo-50/30 via-white to-sand-50/20 border border-indigo-100/90 border-l-[3.5px] border-l-indigo-500/80 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-2xs'
          : 'bg-white border border-sand-200/85 hover:border-sand-300 hover:bg-sand-50/40 hover:shadow-2xs'
      } ${className}`}
    >
      {/* 1. TOP MAIN ROW: Left Sentence Order Badge & Expanded Full-Width Typography Area */}
      <div className="flex items-start gap-2.5 sm:gap-3.5 w-full">
        {/* Left Sentence Order Badge (Strictly select-none) */}
        <div className="pt-0.5 shrink-0 select-none">
          <span
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center transition-colors ${
              isActive
                ? isFragment
                  ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/30'
                  : 'bg-ocean-600 text-white shadow-xs ring-2 ring-ocean-500/30'
                : isFragment
                ? 'bg-indigo-50/90 text-indigo-700 border border-indigo-200/80 group-hover:bg-indigo-100/90'
                : 'bg-sand-100/90 text-slate-500 border border-sand-200/80 group-hover:bg-sand-200/70 group-hover:text-slate-700'
            }`}
          >
            {displayNumber}
          </span>
        </div>

        {/* Center Main Content Area: Meta Badges + Target Language + DrillFragmentCallout + Turkish Translation */}
        <div className="flex-1 min-w-0 pr-0.5">
          {/* Header Meta: Speaker Tag and/or Drill Fragment Badge */}
          {(renderSpeakerTag() || isFragment) && (
            <div className="flex items-center flex-wrap gap-1.5 mb-1.5 select-none">
              {renderSpeakerTag()}
              {isFragment && (
                <DrillFragmentBadge
                  fragmentRole={segment.fragmentRole}
                  showTargetPhrase={false}
                  size="sm"
                />
              )}
            </div>
          )}

          {/* Target Language Sentence (Selectable for student learning!) */}
          <p
            className={`${targetTextClass} transition-colors select-text whitespace-normal break-words leading-relaxed ${
              isActive
                ? isFragment
                  ? 'text-indigo-950 font-bold tracking-tight'
                  : 'text-slate-900 font-semibold'
                : isFragment
                ? 'text-indigo-900 font-bold tracking-tight'
                : 'text-slate-800'
            }`}
          >
            {segment.rawText}
          </p>

          {/* Pedagogical Back-Chaining Syllable Context Callout (360dp optimized) */}
          {isFragment && (
            <DrillFragmentCallout
              segment={segment}
              isActive={isActive}
              showInstruction={isActive}
              onReplay={() => {
                if (onReplay) {
                  onReplay(segment);
                } else {
                  onSeek?.(segment.startMs);
                }
              }}
              className="mt-2 mb-1"
            />
          )}

          {/* Turkish Translation (Selectable) */}
          {(showTranslation ?? true) && segment.turkishText && (
            <p
              className={`${translationTextClass} mt-1.5 transition-colors select-text whitespace-normal break-words leading-relaxed ${
                isActive ? 'text-slate-600 font-medium' : 'text-slate-500'
              }`}
            >
              {segment.turkishText}
            </p>
          )}
        </div>
      </div>

      {/* 2. BOTTOM ACTION & STATUS STRIP: Prevents toolbar from compressing sentence text on 360dp */}
      <div className="mt-2.5 pt-2 border-t border-sand-100/80 sm:border-sand-200/60 flex items-center justify-between gap-2 select-none">
        {/* Left Status: Active indicator pill or Timestamp */}
        <div className="flex items-center gap-1.5 min-w-0">
          {isActive ? (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-ocean-100/90 text-ocean-800 text-[11px] font-bold shadow-2xs border border-ocean-200/80">
              {isPlaying ? (
                <span className="flex items-center gap-0.5 h-3" aria-hidden="true">
                  <span className="w-0.5 h-2 bg-ocean-600 rounded-full animate-pulse" />
                  <span className="w-0.5 h-3 bg-ocean-600 rounded-full animate-pulse [animation-delay:150ms]" />
                  <span className="w-0.5 h-1.5 bg-ocean-600 rounded-full animate-pulse [animation-delay:300ms]" />
                </span>
              ) : (
                <Volume2 className="w-3 h-3 text-ocean-600" aria-hidden="true" />
              )}
              <span className="text-[10px] uppercase tracking-wider">
                {activeSentenceBadgeLabel}
              </span>
            </div>
          ) : (
            <span className="text-[11px] font-mono font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
              {formattedTime}
            </span>
          )}

          {isLooped && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-2xs"
              title={dict.player.loopActive}
            >
              <Repeat className="w-2.5 h-2.5 animate-spin-slow" aria-hidden="true" />
              <span className="hidden xs:inline text-[9px] uppercase tracking-wider">
                {dict.player.loopActive}
              </span>
            </span>
          )}
        </div>

        {/* Right Action Tools: Replay, Practice Pronunciation, Inspector Drawer, Copy & Bookmark */}
        <ReadingSentenceActions
          segment={segment}
          unitNumber={unitNumber}
          onReplay={onReplay ? () => onReplay(segment) : () => onSeek?.(segment.startMs)}
          onPracticePronunciation={onPracticePronunciation}
          onOpenInspector={onOpenInspector}
        />
      </div>
    </article>
  );
};

export const ReadingSentenceCard = React.memo(ReadingSentenceCardComponent);
