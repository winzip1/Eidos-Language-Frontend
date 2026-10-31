/**
 * Eidos Language OS - Header Level & Unit Badge
 * Modular subcomponent displaying language flag, level title, and lesson unit selector.
 * Strictly Light Mode - Zero Hardcode - Ultra-Responsive (360dp optimized).
 */
import React from 'react';
import { Layers, ChevronDown } from 'lucide-react';
import { useDictionary } from '../../../context/DictionaryContext';

export interface HeaderLevelBadgeProps {
  unitNumber: number | null;
  levelTitle?: string;
  courseFlag?: string;
  onOpenLevelSelector?: () => void;
}

export const HeaderLevelBadge: React.FC<HeaderLevelBadgeProps> = ({
  unitNumber,
  levelTitle,
  courseFlag,
  onOpenLevelSelector,
}) => {
  const { dict } = useDictionary();

  const hasValidUnitNum = typeof unitNumber === 'number' && !isNaN(unitNumber) && unitNumber > 0;
  const cefrMatch = levelTitle ? levelTitle.match(/\(([A-C][1-2])\)/i) || levelTitle.match(/\b([A-C][1-2])\b/i) : null;
  const shortLevel = cefrMatch ? cefrMatch[1].toUpperCase() : (levelTitle || 'A1');
  const unitTextShort = hasValidUnitNum ? ` · Ü.${unitNumber}` : '';
  const unitTextFull = hasValidUnitNum ? ` · ${dict.lessonPlayer.unitPrefix} ${unitNumber}` : '';

  if (onOpenLevelSelector) {
    return (
      <button
        type="button"
        data-testid="header-level-selector-btn"
        onClick={onOpenLevelSelector}
        className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 min-h-[36px] sm:min-h-[40px] bg-ocean-50/90 hover:bg-ocean-100/90 text-ocean-900 border border-ocean-200/90 rounded-xl sm:rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer group select-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/50"
        title={dict.lessonPlayer.selectLevelAndLesson}
        aria-label={dict.lessonPlayer.selectLevelAndLesson}
      >
        {courseFlag ? (
          <span className="text-xs sm:text-sm leading-none shrink-0 select-none" aria-hidden="true">
            {courseFlag}
          </span>
        ) : (
          <Layers className="w-3.5 h-3.5 text-ocean-600 shrink-0 group-hover:scale-110 transition-transform" />
        )}
        <span className="text-ocean-900 font-bold">
          <span className="sm:hidden">{shortLevel}{unitTextShort}</span>
          <span className="hidden sm:inline">{shortLevel}{unitTextFull}</span>
        </span>
        <ChevronDown className="w-3 h-3 text-ocean-500 opacity-70 group-hover:opacity-100 shrink-0" />
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 sm:gap-1.5 min-h-[36px] sm:min-h-[40px] shrink min-w-0">
      {courseFlag && (
        <span className="text-xs sm:text-sm leading-none select-none shrink-0" aria-hidden="true">
          {courseFlag}
        </span>
      )}
      {levelTitle && (
        <span className="text-[10px] sm:text-xs font-semibold text-slate-700 bg-sand-100/90 border border-sand-200 px-2 py-0.5 rounded-lg select-none truncate">
          {levelTitle}
        </span>
      )}
      {hasValidUnitNum && (
        <span className="text-[10px] sm:text-xs font-extrabold text-ocean-800 bg-ocean-50 border border-ocean-200/90 px-2 py-0.5 rounded-lg shadow-2xs select-none shrink-0">
          {dict.lessonPlayer.unitPrefix} {unitNumber}
        </span>
      )}
    </div>
  );
};
