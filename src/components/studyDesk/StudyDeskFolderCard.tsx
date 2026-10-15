/**
 * Eidos Language OS - Study Desk Folder Card (Seviye Klasör Kartı)
 * Yacht-deck hierarchical accordion folder card representing a CEFR level (A1 - C2).
 * Clicking expands the folder to reveal nested 30-day lessons inside.
 * Displays honest "Coming Soon" empty state for unreleased levels.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React from 'react';
import { ChevronDown, CheckCircle2, Lock, Sparkles, Folder, FolderOpen, Headphones } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';

export interface StudyDeskFolderCardProps {
  levelId: string;
  levelCode: string;
  title: string;
  description: string;
  isAvailable: boolean;
  totalUnits: number;
  completedUnitsCount: number;
  isExpanded: boolean;
  isCurrentLevel?: boolean;
  onToggleExpand: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const StudyDeskFolderCard: React.FC<StudyDeskFolderCardProps> = ({
  levelId,
  levelCode,
  title,
  description,
  isAvailable,
  totalUnits,
  completedUnitsCount,
  isExpanded,
  isCurrentLevel = false,
  onToggleExpand,
  children,
  className = '',
}) => {
  const { dict } = useDictionary();

  const isCompleted = isAvailable && totalUnits > 0 && completedUnitsCount >= totalUnits;
  const isInProgress = isAvailable && completedUnitsCount > 0 && !isCompleted;
  const progressPct = totalUnits > 0 ? Math.min(100, Math.round((completedUnitsCount / totalUnits) * 100)) : 0;

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggleExpand();
    }
  };

  const folderCountText = dict.studyDesk.folderLessonsCount.replace('{count}', String(totalUnits));
  const completedText = dict.studyDesk.folderCompletedCount
    .replace('{completed}', String(completedUnitsCount))
    .replace('{total}', String(totalUnits));

  return (
    <div
      className={`bg-white border transition-all duration-200 rounded-2xl overflow-hidden shadow-soft-xs ${
        isExpanded
          ? 'border-ocean-300 ring-2 ring-ocean-100 shadow-soft-sm'
          : 'border-sand-200/90 hover:border-ocean-200'
      } ${className}`}
    >
      {/* Folder Header Row */}
      <div
        id={`folder-header-${levelId}`}
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={handleHeaderKeyDown}
        aria-expanded={isExpanded}
        aria-controls={`folder-content-${levelId}`}
        className={`group p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer select-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-inset ${
          isExpanded ? 'bg-ocean-50/20' : 'hover:bg-sand-50/50'
        }`}
      >
        {/* Left: Level Badge & Title/Description */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Level Code Avatar */}
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 border transition-all ${
              isExpanded
                ? 'bg-ocean-600 text-white border-ocean-600 shadow-2xs'
                : isAvailable
                ? 'bg-sand-100 text-slate-800 border-sand-200 group-hover:bg-sand-200/80'
                : 'bg-sand-100/70 text-slate-400 border-sand-200/60'
            }`}
          >
            {levelCode}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight truncate">
                {title}
              </h3>

              {isCurrentLevel && (
                <span className="px-2 py-0.5 bg-ocean-100 text-ocean-800 rounded-md text-[10px] font-extrabold uppercase tracking-wide">
                  {dict.studyDesk.activeLevelBadge}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {description}
            </p>
          </div>
        </div>

        {/* Right: Progress Status & Expand/Collapse Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-sand-100/80">
          {isAvailable ? (
            <div className="flex items-center gap-2.5">
              {/* Completed / In Progress / Total Pill */}
              {isCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{completedText}</span>
                </span>
              ) : isInProgress ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold">
                  <Headphones className="w-3.5 h-3.5 text-amber-600" />
                  <span>{completedText} (%{progressPct})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sand-100 text-slate-600 rounded-lg text-xs font-medium">
                  <span>{folderCountText}</span>
                </span>
              )}

              {/* Action Text on Desktop + Chevron Toggle */}
              <div className="flex items-center gap-1 min-h-[44px] px-2 text-xs font-bold text-ocean-700 group-hover:text-ocean-800">
                <span className="hidden md:inline">
                  {isExpanded ? dict.studyDesk.collapseFolder : dict.studyDesk.expandFolder}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-ocean-600 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-sand-100 text-slate-500 border border-sand-200/80 rounded-lg text-xs font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{dict.studyDesk.comingSoonBadge}</span>
              </span>

              <div className="flex items-center gap-1 min-h-[44px] px-1 text-slate-400">
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accordion Body: Open Folder Content */}
      {isExpanded && (
        <div
          id={`folder-content-${levelId}`}
          aria-labelledby={`folder-header-${levelId}`}
          className="border-t border-sand-200/80 bg-slate-50/40 p-3 sm:p-5 animate-fade-in"
        >
          {isAvailable ? (
            children
          ) : (
            /* Honest "Coming Soon" Empty State (Zero Fake Data) */
            <div className="bg-white border border-sand-200 rounded-xl p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-2.5 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-sand-100 border border-sand-200 flex items-center justify-center text-slate-500 mb-1">
                <Sparkles className="w-6 h-6 text-ocean-600" />
              </div>
              <h4 className="text-base font-extrabold text-slate-800">
                {dict.studyDesk.levelNotPublishedTitle}
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                {dict.studyDesk.levelNotPublishedDesc}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
