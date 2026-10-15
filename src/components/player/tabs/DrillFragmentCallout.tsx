/**
 * Eidos Language OS - Drill Fragment Callout Component
 * Pedagogical back-chaining callout panel presenting the relationship between
 * a syllable fragment and its overarching target phrase.
 * Strictly Light Mode - Zero Hardcode - Full ARIA Accessibility.
 */
import React from 'react';
import { Sparkles, RotateCcw, Volume2 } from 'lucide-react';
import type { Segment } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';

export interface DrillFragmentCalloutProps {
  segment: Segment;
  isActive?: boolean;
  showInstruction?: boolean;
  onReplay?: () => void;
  className?: string;
}

export const DrillFragmentCallout: React.FC<DrillFragmentCalloutProps> = ({
  segment,
  isActive = false,
  showInstruction = false,
  onReplay,
  className = '',
}) => {
  const { dict } = useDictionary();

  const targetPhrase = segment.targetPhrase;
  const displayContext =
    segment.displayContext ||
    (targetPhrase
      ? dict.lessonPlayer.partOfTargetPhrase.replace('{target}', targetPhrase)
      : null);

  if (!displayContext && !targetPhrase) {
    return null;
  }

  return (
    <div
      className={`relative mt-2 p-2.5 sm:p-3 rounded-xl border transition-all duration-200 select-text ${
        isActive
          ? 'bg-indigo-50/80 border-indigo-200/90 shadow-2xs'
          : 'bg-indigo-50/40 border-indigo-100/80'
      } ${className}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div
          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 select-none ${
            isActive
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-100 text-indigo-700'
          }`}
          aria-hidden="true"
        >
          <Sparkles className="w-3 h-3" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Target Phrase Hierarchy */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm text-indigo-950 font-medium">
            <span className="text-indigo-600 font-semibold text-[11px] sm:text-xs uppercase tracking-wider select-none">
              {dict.lessonPlayer.targetPhraseLabel}:
            </span>
            {targetPhrase && (
              <span className="font-bold text-indigo-900 bg-white/90 px-2 py-0.5 rounded-md border border-indigo-200/70 shadow-2xs select-text">
                «{targetPhrase}»
              </span>
            )}
          </div>

          {/* Detailed Context Narrative */}
          {displayContext && (
            <p className="text-[11px] sm:text-xs text-indigo-800/90 mt-1 leading-relaxed italic">
              {displayContext}
            </p>
          )}

          {/* Repeat Aloud Prompt & Replay Micro-Action */}
          {(showInstruction || onReplay) && (
            <div className="mt-2 pt-1.5 border-t border-indigo-100/90 flex items-center justify-between gap-2 flex-wrap select-none">
              <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 font-semibold">
                <Volume2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" aria-hidden="true" />
                <span>{dict.lessonPlayer.listenAndRepeatLabel}</span>
              </div>

              {onReplay && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReplay();
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-indigo-100/80 hover:bg-indigo-200/80 active:bg-indigo-300/80 text-indigo-800 border border-indigo-200/70 transition-all active:scale-95 cursor-pointer shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
                  title={dict.lessonPlayer.repeatSentence}
                >
                  <RotateCcw className="w-2.5 h-2.5 text-indigo-600" aria-hidden="true" />
                  <span>{dict.lessonPlayer.repeatSentence}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
