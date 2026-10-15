/**
 * Eidos Language OS - Reading Sentence Card
 * High-craftsmanship sentence card with clear numbering badge, selectable dual-language typography,
 * dynamic font scaling, subtle active highlight (soft ocean blue / beige), speaker role badges,
 * single-touch replay segment, dedicated pronunciation practice modal trigger, and quick copy/bookmark actions.
 * Memoized with React.memo for high-performance 60fps audio scrubbing and synchronized playback.
 * Strictly Light Mode - Zero Hardcode - Full Keyboard & ARIA Accessibility.
 */
import React, { useState } from 'react';
import { Volume2, Copy, Check, Bookmark, BookmarkCheck, User, Repeat, RotateCcw, Mic, Loader2, Layers } from 'lucide-react';
import type { Segment } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';
import { useAuth } from '../../../context/AuthContext';
import { formatElapsed } from '../../../utils/audioTime';
import { toast } from 'sonner';
import type { ReadingFontSize } from './FontSizeSelector';

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
  const { saveWordMastery, getWordStatus } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isSavingVocab, setIsSavingVocab] = useState(false);

  const wordStatus = getWordStatus(segment.id);
  const isSavedInVocab = wordStatus === 'learning' || wordStatus === 'mastered';

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

  // Quick Copy Sentence Text with reliable fallback for WebViews
  const handleCopy = async (e: React.SyntheticEvent) => {
    e.stopPropagation();
    const textToCopy = segment.rawText.trim();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success(dict.player?.tabs?.sentenceCopied || dict.player.segmentCopied);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(dict.errors.networkError);
    }
  };

  // Bookmark / Save Sentence to Vocabulary
  const handleToggleBookmark = async (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (isSavingVocab) return;

    try {
      setIsSavingVocab(true);
      await saveWordMastery(
        segment.id,
        'learning',
        unitNumber || 1,
        segment.rawText.trim(),
        (segment.turkishText || '').trim(),
        (segment.englishText || '').trim()
      );
      toast.success(dict.player?.tabs?.addedToVocabulary || dict.player.addedToVocabulary);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || dict.errors.internalServerError);
    } finally {
      setIsSavingVocab(false);
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
    return null;
  };

  return (
    <article
      id={`reading-seg-${segment.id}`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-current={isActive ? 'true' : undefined}
      aria-label={`${displayNumber}. ${segment.rawText}`}
      title={dict.player?.tabs?.clickToPlaySentence || dict.lessonPlayer.clickToPlaySentence}
      className={`group relative flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4.5 rounded-2xl transition-all duration-200 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/50 focus-visible:ring-offset-2 ${
        isActive
          ? 'bg-ocean-50/60 border-y border-r border-y-ocean-200/80 border-r-ocean-200/80 border-l-4 border-l-ocean-500 shadow-soft-sm ring-1 ring-ocean-400/25'
          : 'bg-white border border-sand-200/85 hover:border-sand-300 hover:bg-sand-50/40 hover:shadow-2xs'
      } ${className}`}
    >
      {/* 1. Left Sentence Order Badge (Strictly select-none) */}
      <div className="pt-0.5 shrink-0 select-none">
        <span
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center transition-colors ${
            isActive
              ? 'bg-ocean-600 text-white shadow-xs ring-2 ring-ocean-500/30'
              : 'bg-sand-100/90 text-slate-500 border border-sand-200/80 group-hover:bg-sand-200/70 group-hover:text-slate-700'
          }`}
        >
          {displayNumber}
        </span>
      </div>

      {/* 2. Main Content Area: Selectable Target Language & Translation */}
      <div className="flex-1 min-w-0 pr-1">
        {/* Optional Speaker Tag */}
        {renderSpeakerTag() && <div className="mb-1">{renderSpeakerTag()}</div>}

        {/* Target Language Sentence (Selectable for student learning!) */}
        <p
          className={`${targetTextClass} transition-colors select-text ${
            isActive ? 'text-slate-900 font-semibold' : 'text-slate-800'
          }`}
        >
          {segment.rawText}
        </p>

        {/* Turkish Translation (Selectable) */}
        {(showTranslation ?? true) && segment.turkishText && (
          <p
            className={`${translationTextClass} mt-1.5 transition-colors select-text ${
              isActive ? 'text-slate-600 font-medium' : 'text-slate-500'
            }`}
          >
            {segment.turkishText}
          </p>
        )}
      </div>

      {/* 3. Right Status & Quick Action Tools (Strictly select-none) */}
      <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5 select-none">
        {/* Top line: Active Status Pill, Loop Tag, or Time Badge */}
        <div className="flex items-center gap-1">
          {isLooped && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-ocean-600 text-white shadow-2xs"
              title={dict.player.loopActive}
            >
              <Repeat className="w-2.5 h-2.5 animate-spin-slow" aria-hidden="true" />
              <span className="hidden md:inline text-[9px] uppercase tracking-wider">
                {dict.player.loopActive}
              </span>
            </span>
          )}

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
              <span className="hidden sm:inline text-[10px] uppercase tracking-wider">
                {dict.player?.tabs?.activeSentenceBadge || dict.lessonPlayer.activeSentenceBadge}
              </span>
            </div>
          ) : (
            <span className="text-[11px] font-mono font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
              {formattedTime}
            </span>
          )}
        </div>

        {/* Action Tools: Replay, Practice Pronunciation, Copy & Bookmark (Ergonomic touch targets) */}
        <div className="flex items-center gap-1 opacity-85 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-150">
          {/* Replay Segment Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onReplay) {
                onReplay(segment);
              } else {
                onSeek?.(segment.startMs);
              }
            }}
            aria-label={dict.player?.tabs?.replaySentence || dict.lessonPlayer.repeatSentence}
            title={dict.player?.tabs?.replaySentence || dict.lessonPlayer.repeatSentence}
            className="min-w-[34px] min-h-[34px] sm:min-w-[30px] sm:min-h-[30px] flex items-center justify-center rounded-xl text-slate-400 hover:text-ocean-700 hover:bg-ocean-50/80 transition-colors focus:outline-none focus:ring-1 focus:ring-ocean-500/40 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {/* Practice Pronunciation Modal Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPracticePronunciation?.(segment);
            }}
            aria-label={dict.player?.tabs?.practicePronunciation || dict.player.practicePronunciation}
            title={dict.player?.tabs?.practicePronunciation || dict.player.practicePronunciation}
            className="min-w-[34px] min-h-[34px] sm:min-w-[30px] sm:min-h-[30px] flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-700 hover:bg-amber-50/80 transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500/40 cursor-pointer active:scale-95"
          >
            <Mic className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {/* Open Sentence Inspector Drawer */}
          {onOpenInspector && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenInspector(segment);
              }}
              aria-label={dict.player?.tabs?.openInspector || dict.player.openInspector}
              title={dict.player?.tabs?.openInspector || dict.player.openInspector}
              className="min-w-[34px] min-h-[34px] sm:min-w-[30px] sm:min-h-[30px] flex items-center justify-center rounded-xl text-slate-400 hover:text-ocean-700 hover:bg-ocean-50/80 transition-colors focus:outline-none focus:ring-1 focus:ring-ocean-500/40 cursor-pointer active:scale-95"
            >
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}

          {/* Copy Sentence */}
          <button
            type="button"
            onClick={handleCopy}
            aria-label={dict.player?.tabs?.copySentence || dict.player.copySentence}
            title={dict.player?.tabs?.copySentence || dict.player.copySentence}
            className="min-w-[34px] min-h-[34px] sm:min-w-[30px] sm:min-h-[30px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-sand-200/70 transition-colors focus:outline-none focus:ring-1 focus:ring-ocean-500/40 cursor-pointer active:scale-95"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Save to Vocabulary Bookmark */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            disabled={isSavingVocab}
            aria-label={dict.player?.tabs?.saveToVocabulary || dict.player.saveToVocabulary}
            title={dict.player?.tabs?.saveToVocabulary || dict.player.saveToVocabulary}
            className={`min-w-[34px] min-h-[34px] sm:min-w-[30px] sm:min-h-[30px] flex items-center justify-center rounded-xl transition-colors focus:outline-none focus:ring-1 focus:ring-ocean-500/40 cursor-pointer active:scale-95 ${
              isSavedInVocab
                ? 'text-amber-600 bg-amber-100/70 hover:bg-amber-200/70'
                : 'text-slate-400 hover:text-slate-700 hover:bg-sand-200/70'
            }`}
          >
            {isSavingVocab ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-ocean-600" />
            ) : isSavedInVocab ? (
              <BookmarkCheck className="w-3.5 h-3.5" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export const ReadingSentenceCard = React.memo(ReadingSentenceCardComponent);
