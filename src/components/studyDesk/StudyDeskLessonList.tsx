/**
 * Eidos Language OS - Study Desk Lesson List
 * Elegant list container orchestrating horizontal thin line lesson rows with search and status filters.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React, { useState, useMemo, useRef } from 'react';
import { Search, X, Filter, BookOpen, Layers, AlertTriangle } from 'lucide-react';
import type { UnitSummary, AppView } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';
import { StudyDeskLessonRow } from './StudyDeskLessonRow';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { calculateLessonProgressPct } from '../../utils/audioTime';
import { normalizeSearchString } from '../../utils/textNormalization';

export type LessonFilterStatus = 'all' | 'completed' | 'in_progress' | 'not_started';

export interface StudyDeskLessonListProps {
  units: UnitSummary[];
  onSelectUnit: (unitNumber: number, positionMs?: number) => void;
  onNavigate: (view: AppView) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isLoading?: boolean;
  nested?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export const StudyDeskLessonList: React.FC<StudyDeskLessonListProps> = ({
  units,
  onSelectUnit,
  onNavigate,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
  isLoading = false,
  nested = false,
  error = null,
  onRetry,
  className = '',
}) => {
  const { dict } = useDictionary();
  const { progress } = useAuth();
  const { unitNumber: activePlayingUnitNumber, isPlaying, isLoadingUnit } = usePlayer();

  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<LessonFilterStatus>('all');

  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = externalOnSearchChange || setInternalSearchQuery;

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const filterTabs: Array<{ id: LessonFilterStatus; label: string }> = [
    { id: 'all', label: dict.studyDesk.filterAll },
    { id: 'completed', label: dict.studyDesk.filterCompleted },
    { id: 'in_progress', label: dict.studyDesk.filterInProgress },
    { id: 'not_started', label: dict.studyDesk.filterNotStarted },
  ];

  // Filtered units computation
  const filteredUnits = useMemo(() => {
    const rawQuery = activeSearchQuery.trim();
    const normalizedQ = normalizeSearchString(rawQuery);

    return units.filter((unit) => {
      // 1. Text Search query (supports umlauts, accents, and padded/unpadded unit numbers)
      if (normalizedQ) {
        const titleNorm = normalizeSearchString(unit.title);
        const unitNumStr = String(unit.unitNumber);
        const paddedUnitStr = String(unit.unitNumber).padStart(2, '0');
        const matchesQuery =
          titleNorm.includes(normalizedQ) ||
          unitNumStr.includes(normalizedQ) ||
          paddedUnitStr.includes(normalizedQ);
        if (!matchesQuery) return false;
      }

      // 2. Status filter
      if (filterStatus === 'all') return true;

      const unitProg = progress?.units[unit.unitNumber];
      const isCompleted = Boolean(unitProg?.completed);
      const isInProgress = Boolean(unitProg && !unitProg.completed && unitProg.lastPositionMs > 0);
      const isNotStarted = !unitProg || (!unitProg.completed && unitProg.lastPositionMs === 0);

      if (filterStatus === 'completed') return isCompleted;
      if (filterStatus === 'in_progress') return isInProgress;
      if (filterStatus === 'not_started') return isNotStarted;

      return true;
    });
  }, [units, activeSearchQuery, filterStatus, progress]);

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Header: Title + Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            {dict.studyDesk.lessonListHeading}
          </h3>
          <span className="px-2 py-0.5 bg-sand-100 text-slate-600 rounded-lg text-xs font-mono font-bold">
            {filteredUnits.length}
          </span>
        </div>

        {/* Search Input Bar */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={activeSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={dict.studyDesk.searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 bg-white border border-sand-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ocean-500/30 focus:border-ocean-500 transition-all shadow-2xs"
            />
            {activeSearchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="p-1 hover:bg-sand-100 rounded-lg text-slate-400 absolute right-2 top-1/2 -translate-y-1/2"
                aria-label={dict.buttons.clear}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-1 no-scrollbar">
        {filterTabs.map((tab) => {
          const isSelected = filterStatus === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                isSelected
                  ? 'bg-ocean-600 text-white shadow-2xs font-bold'
                  : 'bg-white hover:bg-sand-50 text-slate-600 border border-sand-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Horizontal Lesson Rows Container */}
      <div
        className={`bg-white border overflow-hidden ${
          nested
            ? 'border-sand-200/90 rounded-xl shadow-2xs'
            : 'border-sand-200 rounded-2xl shadow-soft-xs'
        }`}
      >
        {isLoading ? (
          <div className="p-5 space-y-3">
            <LoadingSkeleton variant="card" className="h-12 w-full" />
            <LoadingSkeleton variant="card" className="h-12 w-full" />
            <LoadingSkeleton variant="card" className="h-12 w-full" />
            <LoadingSkeleton variant="card" className="h-12 w-full" />
          </div>
        ) : error && units.length === 0 ? (
          <div className="py-10 px-4 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1 max-w-md">
              <h4 className="text-sm font-bold text-slate-800">
                {dict.errors.networkError}
              </h4>
              <p className="text-xs text-rose-600 font-mono">
                {error}
              </p>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                {dict.buttons.retry}
              </button>
            )}
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="py-12 px-4">
            <EmptyState
              title={dict.studyDesk.noUnitsFound}
              description={dict.studyDesk.noUnitsFoundDesc || dict.studyDesk.noUnitsFound}
              actionText={dict.studyDesk.clearFilters}
              onAction={() => {
                handleSearchChange('');
                setFilterStatus('all');
              }}
            />
          </div>
        ) : (
          <div>
            {filteredUnits.map((unit) => {
              const unitProgress = progress?.units[unit.unitNumber];
              const isCompleted = Boolean(unitProgress?.completed);
              const isInProgress = Boolean(unitProgress && !unitProgress.completed && unitProgress.lastPositionMs > 0);
              const isCurrentlyPlaying = activePlayingUnitNumber === unit.unitNumber;

              const progressPct = calculateLessonProgressPct(
                unitProgress?.lastPositionMs,
                unit.audioDurationMs,
                unit.estimatedDurationMinutes,
                isCompleted
              );

              return (
                <StudyDeskLessonRow
                  key={unit.id}
                  unit={unit}
                  isCompleted={isCompleted}
                  isInProgress={isInProgress}
                  progressPct={progressPct}
                  isCurrentlyPlaying={isCurrentlyPlaying}
                  isPlaying={isCurrentlyPlaying && isPlaying}
                  isLoading={isCurrentlyPlaying && isLoadingUnit}
                  lastPositionMs={unitProgress?.lastPositionMs || 0}
                  onSelectUnit={onSelectUnit}
                  onNavigate={onNavigate}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
