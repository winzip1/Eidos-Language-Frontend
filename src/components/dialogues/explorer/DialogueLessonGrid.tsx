/**
 * Eidos Language OS - Dialogue Explorer Lesson Grid (3. Kademe: 30 Ders Odaklı Görünüm)
 * Displays all 30 lessons inside the selected level folder with real-time search,
 * rich metadata badges, and dedicated workspace launcher triggers.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React, { useMemo } from 'react';
import { Search, X, FolderOpen, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import type { UnitSummary } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';
import { DialogueLessonCard } from './DialogueLessonCard';
import { LoadingSkeleton } from '../../common/LoadingSkeleton';
import { EmptyState } from '../../common/EmptyState';

export interface DialogueLessonGridProps {
  units: UnitSummary[];
  levelCode?: string;
  levelTitle?: string;
  languageName?: string;
  onSelectLesson: (unitNumber: number) => void;
  onBackToLevels: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export const DialogueLessonGrid: React.FC<DialogueLessonGridProps> = ({
  units,
  levelCode = 'A1',
  levelTitle = '',
  languageName = '',
  onSelectLesson,
  onBackToLevels,
  searchQuery,
  onSearchChange,
  isLoading = false,
  error = null,
  onRetry,
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  const headerTitle = useMemo(() => {
    return dh.unitsTitle
      .replace('{language}', languageName)
      .replace('{level}', levelCode);
  }, [dh.unitsTitle, languageName, levelCode]);

  // Filter lessons by search query (unit number or title)
  const filteredUnits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return units;

    return units.filter((u) => {
      const numStr = String(u.unitNumber);
      const matchesNum = numStr === q || `ders ${numStr}`.includes(q) || `unit ${numStr}`.includes(q);
      const matchesTitle = u.title.toLowerCase().includes(q);
      return matchesNum || matchesTitle;
    });
  }, [units, searchQuery]);

  return (
    <section
      data-testid="dialogue-lesson-grid"
      aria-label={headerTitle}
      className={`space-y-4 pb-28 sm:pb-32 ${className}`}
    >
      {/* Header Banner */}
      <div className="bg-white border border-sand-200/90 rounded-2xl p-4 sm:p-5 shadow-soft-xs space-y-1">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-ocean-600 shrink-0" />
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            {headerTitle}
          </h2>
          {levelTitle && (
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-500">
              ({levelTitle})
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          {dh.unitsSubtitle}
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-sand-200/90 rounded-2xl p-3 sm:p-4 shadow-soft-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input (min 44px height for mobile ergonomics) */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            data-testid="dialogue-lessons-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={dh.searchLessons}
            aria-label={dh.searchLessons}
            className="w-full h-11 pl-10 pr-9 rounded-xl bg-sand-50/70 border border-sand-200/80 text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Aramayı Temizle"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-sand-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Lessons Count Indicator Badge */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sand-50 border border-sand-200/70 text-xs font-bold text-slate-600">
            <BookOpen className="w-3.5 h-3.5 text-ocean-600" />
            <span>
              {searchQuery
                ? `${filteredUnits.length} / ${units.length}`
                : dh.allLessonsTab}
            </span>
          </span>
        </div>
      </div>

      {/* Fail-Loud Error Surface */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 shadow-soft-xs"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <strong className="font-extrabold block">
                FAIL-LOUD [API ERROR]:
              </strong>
              <span className="font-medium">{error}</span>
            </div>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer shrink-0 min-h-[44px]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{dict.buttons.retry}</span>
            </button>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton
              key={i}
              variant="card"
              className="h-36 w-full rounded-2xl"
            />
          ))}
        </div>
      )}

      {/* Filtered Lesson Cards Grid */}
      {!isLoading && filteredUnits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredUnits.map((unit) => (
            <DialogueLessonCard
              key={unit.id || unit.unitNumber}
              unit={unit}
              levelCode={levelCode}
              onSelectLesson={onSelectLesson}
            />
          ))}
        </div>
      )}

      {/* Empty State (Honest & Clean) */}
      {!isLoading && !error && filteredUnits.length === 0 && (
        <EmptyState
          icon={<Search className="w-7 h-7 text-ocean-600" />}
          title={searchQuery ? dh.emptySearchResults : dh.noGuidesFound}
          description={
            searchQuery
              ? `"${searchQuery}" aramasına uygun ders bulunamadı.`
              : dh.noGuidesFoundDesc
          }
          actionLabel={searchQuery ? 'Aramayı Sıfırla' : undefined}
          onAction={searchQuery ? () => onSearchChange('') : undefined}
        />
      )}
    </section>
  );
};
