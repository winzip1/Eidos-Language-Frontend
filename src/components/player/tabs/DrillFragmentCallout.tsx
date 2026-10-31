/**
 * Eidos Language OS - Drill Fragment Callout Component
 * Pedagogical back-chaining callout panel presenting the relationship between
 * a syllable fragment and its overarching target phrase.
 * Engineered for 360dp mobile viewports: Responsive wrap, ergonomic touch targets,
 * zero button collisions, full text clarity without ellipsis truncation.
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
  const partOfTargetPhraseTemplate =
    dict.lessonPlayer?.partOfTargetPhrase ||
    dict.player?.tabs?.partOfTargetPhrase ||
    '«{target}» ifadesinin parçası';

  const displayContext =
    segment.displayContext ||
    (targetPhrase ? partOfTargetPhraseTemplate.replace('{target}', targetPhrase) : null);

  if (!displayContext && !targetPhrase) {
    return null;
  }

  const targetPhraseLabel =
    dict.lessonPlayer?.targetPhraseLabel ||
    dict.player?.tabs?.targetPhraseLabel ||
    'Hedef İfade';

  const listenAndRepeatLabel =
    dict.lessonPlayer?.listenAndRepeatLabel ||
    dict.player?.tabs?.listenAndRepeatLabel ||
    'Dinleyin ve Tekrar Edin';

  const repeatSentenceLabel =
    dict.lessonPlayer?.repeatSentence ||
    dict.player?.tabs?.replaySentence ||
    'Cümleyi Tekrarla';

  return (
    <div
      className={`relative mt-2 p-2.5 sm:p-3 rounded-xl border transition-all duration-200 select-text ${
        isActive
          ? 'bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/50 border-indigo-200/90 shadow-2xs ring-1 ring-indigo-300/40'
          : 'bg-gradient-to-br from-indigo-50/40 via-white to-sand-50/30 border-indigo-100/80 shadow-2xs'
      } ${className}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {/* Pedagogical Micro-Icon */}
        <div
          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 select-none transition-colors ${
            isActive
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-100/90 text-indigo-700 border border-indigo-200/70'
          }`}
          aria-hidden="true"
        >
          <Sparkles className="w-3 h-3" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Target Phrase Hierarchy (Non-truncating, fully readable bridge) */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm text-indigo-950 font-medium">
            <span className="text-indigo-600 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider select-none shrink-0">
              {targetPhraseLabel}:
            </span>
            {targetPhrase && (
              <span className="font-bold text-indigo-900 bg-white/95 px-2 py-0.5 rounded-md border border-indigo-200/70 shadow-2xs select-text whitespace-normal break-words">
                «{targetPhrase}»
              </span>
            )}
          </div>

          {/* Detailed Context Narrative (Back-Chaining Explanation) */}
          {displayContext && (
            <p className="text-[11px] sm:text-xs text-indigo-900/80 mt-1 leading-relaxed italic select-text whitespace-normal break-words">
              {displayContext}
            </p>
          )}

          {/* Repeat Aloud Prompt & Replay Action (Ergonomic 360dp stacking: No collisions) */}
          {(showInstruction || onReplay) && (
            <div className="mt-2 pt-1.5 border-t border-indigo-100/90 flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 xs:gap-2 select-none">
              <div className="inline-flex items-center gap-1.5 text-[11px] text-indigo-700 font-semibold min-w-0">
                <Volume2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" aria-hidden="true" />
                <span className="truncate">{listenAndRepeatLabel}</span>
              </div>

              {onReplay && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReplay();
                  }}
                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-indigo-50 active:bg-indigo-100 text-indigo-800 border border-indigo-200/80 transition-all active:scale-95 cursor-pointer shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 w-full xs:w-auto shrink-0 min-h-[30px]"
                  title={repeatSentenceLabel}
                  aria-label={repeatSentenceLabel}
                >
                  <RotateCcw className="w-3 h-3 text-indigo-600 shrink-0" aria-hidden="true" />
                  <span>{repeatSentenceLabel}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
