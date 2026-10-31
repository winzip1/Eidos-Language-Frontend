/**
 * Eidos Language OS - Interactive Sentence Table Renderer
 * Renders word-by-word German-Turkish mappings with vertical arrows, bold German terms,
 * full sentence translations, and interactive hide/reveal states.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - 360dp Responsive.
 */
import React, { useState } from 'react';
import { ArrowDown, Languages, Eye, EyeOff } from 'lucide-react';
import type { GuideSentenceTable } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';

export interface InteractiveTableRendererProps {
  table?: GuideSentenceTable;
  isTranslationHidden?: boolean;
  onToggleTranslation?: () => void;
  className?: string;
}

export const InteractiveTableRenderer: React.FC<InteractiveTableRendererProps> = ({
  table,
  isTranslationHidden = false,
  onToggleTranslation,
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  // Track individual revealed words when translations are hidden
  const [revealedWordIndices, setRevealedWordIndices] = useState<Set<number>>(new Set());
  const [isFullTranslationRevealed, setIsFullTranslationRevealed] = useState<boolean>(false);

  if (!table) {
    return null;
  }

  const columns = Array.isArray(table.columns) ? table.columns : [];
  const fullTranslation = table.fullTranslation || '';

  const handleWordClick = (index: number) => {
    if (!isTranslationHidden) return;
    setRevealedWordIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleToggleFullTranslation = () => {
    if (onToggleTranslation) {
      onToggleTranslation();
    } else {
      setIsFullTranslationRevealed((prev) => !prev);
    }
  };

  const isFullHidden = isTranslationHidden && !isFullTranslationRevealed;

  return (
    <div
      data-testid="interactive-table-renderer"
      className={`space-y-3 max-w-full overflow-hidden ${className}`}
    >
      {/* Word-by-word Mapping Container (Horizontally Scrollable on Mobile) */}
      {columns.length > 0 && (
        <div className="relative rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 sm:p-3 overflow-hidden">
          {/* Scrollable Column Track */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pb-1 -mx-0.5 px-0.5">
            <div className="flex items-stretch gap-1.5 sm:gap-2 min-w-fit">
              {columns.map((col, idx) => {
                const isWordRevealed = revealedWordIndices.has(idx);
                const isWordHidden = isTranslationHidden && !isWordRevealed;

                return (
                  <div
                    key={idx}
                    className="flex flex-col min-w-[72px] sm:min-w-[84px] max-w-[140px] text-center select-none group"
                  >
                    {/* Row 1: Turkish Meaning */}
                    <div
                      onClick={() => handleWordClick(idx)}
                      role={isTranslationHidden ? 'button' : undefined}
                      tabIndex={isTranslationHidden ? 0 : undefined}
                      title={isWordHidden ? dh.showTranslation : col.turkish}
                      className={`min-h-[36px] flex items-center justify-center p-1.5 rounded-t-lg border border-slate-200 text-xs font-medium transition-all ${
                        isWordHidden
                          ? 'bg-slate-100 text-slate-400 cursor-pointer hover:bg-slate-200/70 border-dashed select-none'
                          : 'bg-white text-slate-600 shadow-2xs'
                      }`}
                    >
                      {isWordHidden ? (
                        <span className="text-[11px] font-mono tracking-widest text-slate-400">
                          ••••
                        </span>
                      ) : (
                        <span className="line-clamp-2 break-words leading-tight">
                          {col.turkish || '-'}
                        </span>
                      )}
                    </div>

                    {/* Row 2: Vertical Arrow */}
                    <div className="py-0.5 flex items-center justify-center bg-transparent">
                      <ArrowDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500 transition-colors" />
                    </div>

                    {/* Row 3: Bold German Word */}
                    <div className="min-h-[40px] flex items-center justify-center p-2 rounded-b-lg border border-slate-200/90 bg-white shadow-2xs">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm break-words leading-tight">
                        {col.german}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fallback for Raw HTML Table if columns were irregular */}
      {columns.length === 0 && table.rawHtml && (
        <div
          className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white p-2.5 max-w-full text-xs"
          dangerouslySetInnerHTML={{ __html: table.rawHtml }}
        />
      )}

      {/* Row 4: Full Sentence Translation Box */}
      {fullTranslation && (
        <div className="flex items-start justify-between gap-2 p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 text-xs sm:text-sm transition-all">
          <div className="flex items-start gap-2 flex-1">
            <div className="p-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 mt-0.5 shrink-0">
              <Languages className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                {dh.fullSentenceLabel}
              </span>
              {isFullHidden ? (
                <button
                  type="button"
                  onClick={handleToggleFullTranslation}
                  className="text-xs text-sky-700 hover:text-sky-900 font-medium underline underline-offset-2 flex items-center gap-1.5 py-0.5"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-600" />
                  <span>{dh.showTranslation}</span>
                </button>
              ) : (
                <p className="text-slate-800 font-medium leading-relaxed break-words">
                  {fullTranslation}
                </p>
              )}
            </div>
          </div>

          {/* Quick inline eye toggle for full translation */}
          {isTranslationHidden && !isFullHidden && (
            <button
              type="button"
              onClick={handleToggleFullTranslation}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title={dh.hideTranslation}
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
