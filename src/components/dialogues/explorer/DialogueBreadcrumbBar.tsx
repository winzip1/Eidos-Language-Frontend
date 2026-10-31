/**
 * Eidos Language OS - Dialogue Explorer Breadcrumb Bar
 * Displays the current 3-step folder depth (Diller -> [Dil] -> [Kur])
 * Compact yacht-deck bar (max 48-50px height) with min 44px touch targets.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React from 'react';
import { Folder, FolderOpen, ChevronRight, ArrowLeft } from 'lucide-react';
import { useDictionary } from '../../../context/DictionaryContext';

export type DialogueExplorerStep = 'languages' | 'levels' | 'units';

export interface DialogueBreadcrumbBarProps {
  viewStep: DialogueExplorerStep;
  selectedLanguageName?: string;
  selectedLanguageFlag?: string;
  selectedLevelCode?: string;
  selectedLevelTitle?: string;
  onNavigateToLanguages: () => void;
  onNavigateToLevels: () => void;
  className?: string;
}

export const DialogueBreadcrumbBar: React.FC<DialogueBreadcrumbBarProps> = ({
  viewStep,
  selectedLanguageName,
  selectedLanguageFlag,
  selectedLevelCode,
  selectedLevelTitle,
  onNavigateToLanguages,
  onNavigateToLevels,
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  const isLanguages = viewStep === 'languages';
  const isLevels = viewStep === 'levels';
  const isUnits = viewStep === 'units';

  const handleBackClick = () => {
    if (isUnits) {
      onNavigateToLevels();
    } else if (isLevels) {
      onNavigateToLanguages();
    }
  };

  const backLabel = isUnits ? dh.backToLevels : dh.backToFolders;

  return (
    <nav
      data-testid="dialogue-breadcrumb-bar"
      aria-label={dh.breadcrumbRoot}
      className={`sticky top-1 sm:top-2 z-20 bg-white/95 backdrop-blur-md border border-sand-200/90 rounded-2xl px-3 sm:px-4 min-h-[44px] max-h-[52px] shadow-soft-xs flex items-center justify-between gap-2 transition-all select-none ${className}`}
    >
      {/* Left: Interactive Breadcrumb Path */}
      <ol className="flex items-center gap-1 sm:gap-1.5 min-w-0 overflow-x-auto no-scrollbar py-1">
        {/* Step 1: Root Languages */}
        <li className="flex items-center shrink-0">
          {isLanguages ? (
            <span
              data-testid="dialogue-breadcrumb-root"
              aria-current="page"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-ocean-50/90 text-ocean-800 border border-ocean-200/80 text-xs sm:text-sm font-extrabold"
            >
              <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ocean-600 shrink-0" />
              <span>{dh.breadcrumbRoot}</span>
            </span>
          ) : (
            <button
              type="button"
              data-testid="dialogue-breadcrumb-root-btn"
              onClick={onNavigateToLanguages}
              aria-label={dh.breadcrumbRoot}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[44px] rounded-xl text-slate-600 hover:text-ocean-700 hover:bg-sand-100/80 text-xs sm:text-sm font-bold transition-colors cursor-pointer active:scale-95"
            >
              <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
              <span>{dh.breadcrumbRoot}</span>
            </button>
          )}
        </li>

        {/* Step 2: Selected Language */}
        {(isLevels || isUnits) && selectedLanguageName && (
          <>
            <li aria-hidden="true" className="text-slate-300 flex items-center shrink-0">
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </li>
            <li className="flex items-center shrink-0 min-w-0">
              {isLevels ? (
                <span
                  data-testid="dialogue-breadcrumb-lang"
                  aria-current="page"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-ocean-50/90 text-ocean-800 border border-ocean-200/80 text-xs sm:text-sm font-extrabold truncate max-w-[130px] sm:max-w-[180px]"
                >
                  {selectedLanguageFlag && (
                    <span className="text-sm sm:text-base leading-none shrink-0">
                      {selectedLanguageFlag}
                    </span>
                  )}
                  <span className="truncate">{selectedLanguageName}</span>
                </span>
              ) : (
                <button
                  type="button"
                  data-testid="dialogue-breadcrumb-lang-btn"
                  onClick={onNavigateToLevels}
                  aria-label={selectedLanguageName}
                  className="inline-flex items-center gap-1.5 px-2 py-1.5 min-h-[44px] rounded-xl text-slate-600 hover:text-ocean-700 hover:bg-sand-100/80 text-xs sm:text-sm font-bold transition-colors cursor-pointer active:scale-95 truncate max-w-[130px] sm:max-w-[180px]"
                >
                  {selectedLanguageFlag && (
                    <span className="text-sm sm:text-base leading-none shrink-0">
                      {selectedLanguageFlag}
                    </span>
                  )}
                  <span className="truncate">{selectedLanguageName}</span>
                </button>
              )}
            </li>
          </>
        )}

        {/* Step 3: Selected Level (Units Step) */}
        {isUnits && (selectedLevelCode || selectedLevelTitle) && (
          <>
            <li aria-hidden="true" className="text-slate-300 flex items-center shrink-0">
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </li>
            <li className="flex items-center shrink-0 min-w-0">
              <span
                data-testid="dialogue-breadcrumb-level"
                aria-current="page"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-ocean-50/90 text-ocean-800 border border-ocean-200/80 text-xs sm:text-sm font-extrabold truncate max-w-[120px] sm:max-w-[160px]"
              >
                <FolderOpen className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
                <span className="truncate">
                  {selectedLevelCode ? `${selectedLevelCode}` : selectedLevelTitle}
                </span>
              </span>
            </li>
          </>
        )}
      </ol>

      {/* Right: Quick Back Button (min 44x44px touch target) */}
      {!isLanguages && (
        <button
          type="button"
          data-testid="dialogue-breadcrumb-back-btn"
          onClick={handleBackClick}
          aria-label={backLabel}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[44px] rounded-xl text-ocean-700 bg-ocean-50/70 hover:bg-ocean-100/80 border border-ocean-200/70 text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="hidden xs:inline">{backLabel}</span>
        </button>
      )}
    </nav>
  );
};
