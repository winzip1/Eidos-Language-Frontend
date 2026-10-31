/**
 * Eidos Language OS - Study Desk Folder Card (Seviye Klasör Kartı - Sıfır Akordeon)
 * Yacht-deck pure folder card representing a CEFR level (A1 - C2 / Plus).
 * Clicking opens the level folder directly (viewStep = 'units') without any expanding accordion.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React from 'react';
import { ChevronRight, CheckCircle2, Lock, Folder, Headphones } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';

export interface StudyDeskFolderCardProps {
  levelId: string;
  levelCode: string;
  title: string;
  description: string;
  isAvailable: boolean;
  totalUnits: number;
  completedUnitsCount: number;
  isCurrentLevel?: boolean;
  onOpenFolder: () => void;
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
  isCurrentLevel = false,
  onOpenFolder,
  className = '',
}) => {
  const { dict } = useDictionary();

  const isCompleted = isAvailable && totalUnits > 0 && completedUnitsCount >= totalUnits;
  const isInProgress = isAvailable && completedUnitsCount > 0 && !isCompleted;
  const progressPct =
    totalUnits > 0 ? Math.min(100, Math.round((completedUnitsCount / totalUnits) * 100)) : 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenFolder();
    }
  };

  const folderCountText = dict.studyDesk.folderLessonsCount.replace('{count}', String(totalUnits));
  const completedText = dict.studyDesk.folderCompletedCount
    .replace('{completed}', String(completedUnitsCount))
    .replace('{total}', String(totalUnits));

  return (
    <div
      id={`folder-header-${levelId}`}
      data-testid={`level-folder-${levelId}`}
      role="button"
      tabIndex={0}
      onClick={onOpenFolder}
      onKeyDown={handleKeyDown}
      className={`group bg-white border transition-all duration-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 ${
        isCurrentLevel
          ? 'border-ocean-300 ring-2 ring-ocean-100/80 shadow-soft-sm hover:border-ocean-400'
          : 'border-sand-200/90 hover:border-ocean-300 hover:bg-sand-50/40 shadow-soft-xs'
      } ${className}`}
    >
      {/* Left: Level Badge, Folder Icon & Title/Description */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Level Code Badge */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 border transition-all ${
            isCurrentLevel
              ? 'bg-ocean-600 text-white border-ocean-600 shadow-2xs'
              : isAvailable
              ? 'bg-sand-100 text-slate-800 border-sand-200 group-hover:bg-ocean-50 group-hover:text-ocean-700 group-hover:border-ocean-200'
              : 'bg-sand-100/70 text-slate-400 border-sand-200/60'
          }`}
        >
          {levelCode}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Folder
              className={`w-4 h-4 shrink-0 ${
                isCurrentLevel || isAvailable ? 'text-ocean-600' : 'text-slate-400'
              }`}
            />
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

      {/* Right: Progress / Lesson Count & Direct Drill-Down Indicator */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-sand-100/80">
        {isAvailable ? (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Completed / In Progress / Total Pill */}
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{completedText}</span>
              </span>
            ) : isInProgress ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold">
                <Headphones className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  {completedText} (%{progressPct})
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sand-100 text-slate-600 rounded-lg text-xs font-semibold">
                <span>{folderCountText}</span>
              </span>
            )}

            {/* Open Folder Drill-Down Action */}
            <div className="inline-flex items-center gap-1 min-h-[38px] px-2.5 py-1.5 rounded-xl bg-ocean-50/70 group-hover:bg-ocean-600 text-ocean-700 group-hover:text-white text-xs font-extrabold transition-all">
              <span>{dict.studyDesk.openFolderAction}</span>
              <ChevronRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-sand-100 text-slate-500 border border-sand-200/80 rounded-lg text-xs font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{dict.studyDesk.comingSoonBadge}</span>
            </span>

            <div className="inline-flex items-center gap-1 min-h-[38px] px-2.5 py-1.5 rounded-xl bg-sand-50 group-hover:bg-sand-100 text-slate-500 text-xs font-bold transition-all">
              <span>{dict.studyDesk.openFolderAction}</span>
              <ChevronRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
