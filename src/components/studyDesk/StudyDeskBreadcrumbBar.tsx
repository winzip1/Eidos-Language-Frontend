/**
 * Eidos Language OS - Study Desk Breadcrumb & Folder Navigation Bar
 * Displays the current 3-step folder depth (All Languages -> Language -> Level)
 * and provides single-click navigation back to parent folders or root directory.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React from 'react';
import { Folder, FolderOpen, ChevronRight, ArrowLeft, Globe } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';

export type StudyDeskViewStep = 'languages' | 'levels' | 'units';

export interface StudyDeskBreadcrumbBarProps {
  viewStep: StudyDeskViewStep;
  selectedLanguageName?: string;
  selectedLanguageFlag?: string;
  selectedLevelCode?: string;
  selectedLevelTitle?: string;
  totalLanguagesCount?: number;
  onNavigateToLanguages: () => void;
  onNavigateToLevels: () => void;
  className?: string;
}

export const StudyDeskBreadcrumbBar: React.FC<StudyDeskBreadcrumbBarProps> = ({
  viewStep,
  selectedLanguageName,
  selectedLanguageFlag,
  selectedLevelCode,
  selectedLevelTitle,
  totalLanguagesCount = 0,
  onNavigateToLanguages,
  onNavigateToLevels,
  className = '',
}) => {
  const { dict } = useDictionary();

  const isRoot = viewStep === 'languages';
  const isLevels = viewStep === 'levels';
  const isUnits = viewStep === 'units';

  const handleBackClick = () => {
    if (isUnits) {
      onNavigateToLevels();
    } else if (isLevels) {
      onNavigateToLanguages();
    }
  };

  const backButtonLabel = isUnits
    ? dict.studyDesk.backToLevels
    : dict.studyDesk.backToLanguages;

  return (
    <nav
      data-testid="studydesk-breadcrumb-bar"
      aria-label={dict.studyDesk.breadcrumbAriaLabel}
      className={`bg-white border border-sand-200/90 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-soft-xs flex flex-wrap items-center justify-between gap-3 transition-all ${className}`}
    >
      {/* Left: Folder Hierarchy Path */}
      <ol className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
        {/* Step 1: Root "All Languages" Folder */}
        <li className="flex items-center">
          {isRoot ? (
            <span
              data-testid="breadcrumb-root-btn"
              aria-current="page"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ocean-50/90 text-ocean-800 border border-ocean-200/80 text-xs sm:text-sm font-extrabold"
            >
              <FolderOpen className="w-4 h-4 text-ocean-600 shrink-0" />
              <span>{dict.studyDesk.rootLanguagesFolder}</span>
            </span>
          ) : (
            <button
              type="button"
              data-testid="breadcrumb-root-btn"
              onClick={onNavigateToLanguages}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[38px] rounded-xl text-slate-600 hover:text-ocean-700 hover:bg-sand-100/80 text-xs sm:text-sm font-bold transition-colors cursor-pointer active:scale-95"
            >
              <Folder className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{dict.studyDesk.rootLanguagesFolder}</span>
            </button>
          )}
        </li>

        {/* Step 2: Selected Language Folder */}
        {(isLevels || isUnits) && selectedLanguageName && (
          <>
            <li aria-hidden="true" className="text-slate-300 flex items-center">
              <ChevronRight className="w-4 h-4" />
            </li>
            <li className="flex items-center min-w-0">
              {isLevels ? (
                <span
                  data-testid="breadcrumb-lang-btn"
                  aria-current="page"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ocean-50/90 text-ocean-800 border border-ocean-200/80 text-xs sm:text-sm font-extrabold truncate"
                >
                  {selectedLanguageFlag && (
                    <span className="text-base leading-none shrink-0">{selectedLanguageFlag}</span>
                  )}
                  <span className="truncate">{selectedLanguageName}</span>
                </span>
              ) : (
                <button
                  type="button"
                  data-testid="breadcrumb-lang-btn"
                  onClick={onNavigateToLevels}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[38px] rounded-xl text-slate-600 hover:text-ocean-700 hover:bg-sand-100/80 text-xs sm:text-sm font-bold transition-colors cursor-pointer active:scale-95 truncate"
                >
                  {selectedLanguageFlag && (
                    <span className="text-base leading-none shrink-0">{selectedLanguageFlag}</span>
                  )}
                  <span className="truncate">{selectedLanguageName}</span>
                </button>
              )}
            </li>
          </>
        )}

        {/* Step 3: Selected Level Folder */}
        {isUnits && (selectedLevelCode || selectedLevelTitle) && (
          <>
            <li aria-hidden="true" className="text-slate-300 flex items-center">
              <ChevronRight className="w-4 h-4" />
            </li>
            <li className="flex items-center min-w-0">
              <span
                data-testid="breadcrumb-level-span"
                aria-current="page"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ocean-50/90 text-ocean-800 border border-ocean-200/80 text-xs sm:text-sm font-extrabold truncate"
              >
                <FolderOpen className="w-4 h-4 text-ocean-600 shrink-0" />
                {selectedLevelCode && (
                  <span className="px-1.5 py-0.5 bg-ocean-600 text-white rounded-md text-[10px] font-extrabold uppercase tracking-wide shrink-0">
                    {selectedLevelCode}
                  </span>
                )}
                <span className="truncate">{selectedLevelTitle || selectedLevelCode}</span>
              </span>
            </li>
          </>
        )}
      </ol>

      {/* Right: Quick Back Button or Total Languages Indicator */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {!isRoot ? (
          <button
            type="button"
            data-testid="breadcrumb-back-button"
            onClick={handleBackClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[42px] bg-sand-50 hover:bg-sand-100 active:scale-95 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-xl border border-sand-200/90 transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
            <span>{backButtonLabel}</span>
          </button>
        ) : (
          totalLanguagesCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sand-50 text-slate-600 border border-sand-200/80 rounded-xl text-xs font-bold">
              <Globe className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
              <span>
                {totalLanguagesCount} {dict.languageHub.statsTotalLanguages}
              </span>
            </span>
          )
        )}
      </div>
    </nav>
  );
};
