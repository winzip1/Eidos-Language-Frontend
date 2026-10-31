/**
 * Eidos Language OS - Sentence Table Card Component
 * Premium card container for individual sentence analysis tables with Whisper timestamps,
 * speaker badges, touch-friendly translation toggling, and loop playback.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - 360dp Responsive.
 */
import React, { useState, useEffect } from 'react';
import { User, Eye, EyeOff, Repeat, Layers } from 'lucide-react';
import type { GuideItem, GuideSentenceTable } from '../../../types';
import { useDictionary, interpolate } from '../../../context/DictionaryContext';
import { audioPlayer } from '../../../services/audioPlayer';
import { InteractiveTableRenderer } from './InteractiveTableRenderer';
import { TableGrammarNotes } from './TableGrammarNotes';
import { TimestampAudioButton } from './TimestampAudioButton';

export interface SentenceTableCardProps {
  item: GuideItem;
  unitNumber: number;
  languageId?: string;
  levelId?: string;
  globalHideTranslation?: boolean;
  isLooping?: boolean;
  isPlayingSnippet?: boolean;
  onToggleLoop?: (itemId: string, item: GuideItem) => void;
  onPlaySnippet?: (itemId: string, item: GuideItem) => void;
  className?: string;
}

export const SentenceTableCard: React.FC<SentenceTableCardProps> = ({
  item,
  unitNumber,
  languageId = 'german',
  levelId = 'level1',
  globalHideTranslation = false,
  isLooping = false,
  isPlayingSnippet = false,
  onToggleLoop,
  onPlaySnippet,
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  // Local state for translation visibility (initialized from global, but individually toggleable)
  const [isTranslationHidden, setIsTranslationHidden] = useState<boolean>(globalHideTranslation);

  // Sync with global hide changes
  useEffect(() => {
    setIsTranslationHidden(globalHideTranslation);
  }, [globalHideTranslation]);

  // Audio Playback for this item's primary timestamp
  const handlePlaySnippet = () => {
    if (onPlaySnippet) {
      onPlaySnippet(item.id, item);
    } else if (item.primaryTimeMs >= 0) {
      audioPlayer.seek(item.primaryTimeMs);
      audioPlayer.play().catch(() => {});
    }
  };

  // Toggle looping for this sentence
  const handleToggleLoop = () => {
    if (onToggleLoop) {
      onToggleLoop(item.id, item);
    }
  };

  // Resolve speaker role and label from dictionary
  const rawRole = item.speaker?.role || '';
  const rawName = item.speaker?.name || '';
  const itemTitle = item.title || '';
  const combinedMeta = `${rawRole} ${rawName} ${itemTitle}`.toLowerCase();

  let speakerLabel = dh.speakerOther;
  let speakerColorClass = 'bg-slate-100 text-slate-700 border-slate-200/80';

  if (combinedMeta.includes('kadın') || combinedMeta.includes('frauen')) {
    speakerLabel = dh.speakerFemale;
    speakerColorClass = 'bg-rose-50 text-rose-700 border-rose-200/60';
  } else if (combinedMeta.includes('erkek') || combinedMeta.includes('männer')) {
    speakerLabel = dh.speakerMale;
    speakerColorClass = 'bg-sky-50 text-sky-700 border-sky-200/60';
  } else if (
    combinedMeta.includes('anlatıcı') ||
    combinedMeta.includes('narrator') ||
    combinedMeta.includes('eğitmen')
  ) {
    speakerLabel = dh.speakerNarrator;
    speakerColorClass = 'bg-amber-50 text-amber-800 border-amber-200/60';
  }

  // Active border highlighting: ring-2 ring-sky-400/40 when playing or looping
  const activeBorderClasses = isLooping
    ? 'border-sky-400 ring-2 ring-sky-300/70 shadow-sm bg-sky-50/10'
    : isPlayingSnippet
    ? 'border-sky-400 ring-2 ring-sky-400/40 shadow-sm bg-sky-50/10'
    : 'border-slate-200/90 hover:border-slate-300';

  return (
    <article
      data-testid={`sentence-table-card-${item.id}`}
      data-playing={isPlayingSnippet ? 'true' : 'false'}
      data-looping={isLooping ? 'true' : 'false'}
      className={`bg-white border rounded-2xl transition-all shadow-xs overflow-hidden ${activeBorderClasses} ${className}`}
    >
      {/* Top Meta Bar */}
      <div className="p-3 sm:p-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        {/* Left Side: Timestamp Audio Button, Speaker, Item Number */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
          {/* Timestamp Audio Button with Live Wave State */}
          {item.primaryTimeStr && (
            <TimestampAudioButton
              timeStr={item.primaryTimeStr}
              timeMs={item.primaryTimeMs}
              isPlaying={isPlayingSnippet}
              isLooping={isLooping}
              onClick={handlePlaySnippet}
              title={interpolate(dh.jumpToTimestamp, { time: item.primaryTimeStr })}
            />
          )}

          {/* Speaker Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${speakerColorClass}`}
          >
            <User className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{speakerLabel}</span>
          </span>

          {/* Item Number */}
          {item.itemNumber && (
            <span className="text-[11px] font-mono text-slate-400 font-semibold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/60">
              #{item.itemNumber}
            </span>
          )}

          {/* Thematic Subgroup Chip (if present) */}
          {item.groupTitle && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60 truncate max-w-[150px]">
              <Layers className="w-2.5 h-2.5 text-indigo-500" />
              <span className="truncate">{item.groupTitle}</span>
            </span>
          )}
        </div>

        {/* Right Side: Quick Action Buttons (Min 44x44px touch target) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Hide/Show Translation Button */}
          <button
            type="button"
            onClick={() => setIsTranslationHidden((prev) => !prev)}
            className={`min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl text-xs font-medium border flex items-center justify-center transition-all cursor-pointer ${
              isTranslationHidden
                ? 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100'
                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
            }`}
            title={isTranslationHidden ? dh.showTranslation : dh.hideTranslation}
            aria-label={isTranslationHidden ? dh.showTranslation : dh.hideTranslation}
          >
            {isTranslationHidden ? (
              <EyeOff className="w-4 h-4 text-amber-600" />
            ) : (
              <Eye className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Loop Sentence Button */}
          <button
            type="button"
            onClick={handleToggleLoop}
            data-testid={`loop-btn-${item.id}`}
            className={`min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center transition-all cursor-pointer ${
              isLooping
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
            }`}
            title={isLooping ? dh.stopLoop : dh.loopSentence}
            aria-label={isLooping ? dh.stopLoop : dh.loopSentence}
          >
            <Repeat className={`w-4 h-4 ${isLooping ? 'text-white animate-spin-slow' : 'text-slate-500'}`} />
          </button>
        </div>
      </div>

      {/* Looping Active Status Banner */}
      {isLooping && (
        <div className="bg-sky-50 px-3.5 py-1.5 border-b border-sky-100 flex items-center justify-between text-xs text-sky-800">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span>{dh.loopActiveBadge}</span>
          </div>
          <button
            type="button"
            onClick={handleToggleLoop}
            className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 underline underline-offset-2 cursor-pointer"
          >
            {dh.stopLoop}
          </button>
        </div>
      )}

      {/* Card Body */}
      <div className="p-3.5 sm:p-4 space-y-3.5">
        {/* Original German Sentence Hero */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug break-words">
            {item.originalSentence}
          </p>
        </div>

        {/* Primary Interactive Sentence Table */}
        <InteractiveTableRenderer
          table={item.table}
          isTranslationHidden={isTranslationHidden}
          onToggleTranslation={() => setIsTranslationHidden((prev) => !prev)}
        />

        {/* Additional Tables (if item has multiple variations) */}
        {Array.isArray(item.additionalTables) && item.additionalTables.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            {item.additionalTables.map((addTable: GuideSentenceTable, tIdx: number) => (
              <InteractiveTableRenderer
                key={tIdx}
                table={addTable}
                isTranslationHidden={isTranslationHidden}
                onToggleTranslation={() => setIsTranslationHidden((prev) => !prev)}
              />
            ))}
          </div>
        )}

        {/* Grammar & Pedagogical Notes */}
        <TableGrammarNotes notes={item.grammarNotes} />
      </div>
    </article>
  );
};
