import React, { useMemo, useRef, useEffect } from 'react';
import { Search, X, Filter, Play, Pause, CheckCircle2, Clock, Headphones, ArrowRight, Layers, Volume2, Loader2, Keyboard } from 'lucide-react';
import type { UnitSummary } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

export type UnitFilterStatus = 'all' | 'completed' | 'in_progress' | 'not_started';

interface UnitStudyGridProps {
  units: UnitSummary[];
  onSelectUnit: (unitNumber: number, positionMs?: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: UnitFilterStatus;
  onFilterChange: (status: UnitFilterStatus) => void;
  isLoading?: boolean;
}

// Diacritic-insensitive normalizer for German/Turkish search
function normalizeSearchString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c');
}

export const UnitStudyGrid: React.FC<UnitStudyGridProps> = ({
  units,
  onSelectUnit,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  isLoading = false,
}) => {
  const { dict } = useDictionary();
  const { progress } = useAuth();
  const { unitNumber: activePlayingUnitNumber, isPlaying, isLoadingUnit, togglePlay } = usePlayer();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Global '/' keyboard shortcut to jump to search bar
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const filterTabs: Array<{ id: UnitFilterStatus; label: string }> = [
    { id: 'all', label: dict.studyDesk.filterAll },
    { id: 'completed', label: dict.studyDesk.filterCompleted },
    { id: 'in_progress', label: dict.studyDesk.filterInProgress },
    { id: 'not_started', label: dict.studyDesk.filterNotStarted },
  ];

  const filteredUnits = useMemo(() => {
    const rawQuery = searchQuery.trim();
    const normalizedQ = normalizeSearchString(rawQuery);

    return units.filter((unit) => {
      // 1. Search text match (both exact & normalized)
      if (normalizedQ) {
        const titleNorm = normalizeSearchString(unit.title);
        const unitNumStr = String(unit.unitNumber);
        const matchesQuery =
          titleNorm.includes(normalizedQ) ||
          unitNumStr.includes(normalizedQ) ||
          `0${unitNumStr}`.includes(normalizedQ);

        if (!matchesQuery) return false;
      }

      // 2. Status filter match
      const p = progress?.units[unit.unitNumber];
      if (filterStatus === 'completed') return Boolean(p?.completed);
      if (filterStatus === 'in_progress') return Boolean(p && !p.completed && p.lastPositionMs > 0);
      if (filterStatus === 'not_started') return !p || (!p.completed && p.lastPositionMs === 0);

      return true;
    });
  }, [units, searchQuery, filterStatus, progress]);

  const hasActiveFilters = Boolean(searchQuery || filterStatus !== 'all');

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 bg-sand-50/60 p-2.5 sm:p-3 rounded-2xl border border-sand-200 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onSearchChange('');
                searchInputRef.current?.blur();
              }
            }}
            placeholder={dict.studyDesk.searchPlaceholder}
            aria-label={dict.studyDesk.searchPlaceholder}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-sand-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-ocean-400 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              aria-label={dict.studyDesk.clearFilters}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-sand-100 transition-colors cursor-pointer"
              title={dict.studyDesk.clearFilters}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs & Count */}
        <div className="flex items-center justify-between md:justify-end gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-sand-200 shadow-2xs" role="tablist">
            {filterTabs.map((tab) => {
              const isSelected = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onFilterChange(tab.id)}
                  role="tab"
                  aria-selected={isSelected}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ocean-300 ${
                    isSelected
                      ? 'bg-ocean-600 text-white shadow-soft'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-sand-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Units Count Pill */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-sand-200 rounded-xl text-xs font-medium text-slate-500 whitespace-nowrap shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-ocean-600" />
            <span className="font-bold text-slate-800">{filteredUnits.length}</span>
            {units.length !== filteredUnits.length && (
              <span className="text-slate-400">/ {units.length}</span>
            )}
            <span>{dict.studyDesk.filterCountLabel}</span>
          </div>

          {/* Clear Filter Quick Button */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                onSearchChange('');
                onFilterChange('all');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-ocean-600 hover:text-ocean-800 hover:bg-ocean-50 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>{dict.studyDesk.clearFilters}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Units Grid / States */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <LoadingSkeleton count={6} heightClass="h-48" />
        </div>
      ) : filteredUnits.length === 0 ? (
        <EmptyState
          title={dict.studyDesk.noUnitsFound}
          description={dict.studyDesk.noUnitsFound}
          actionText={dict.studyDesk.clearFilters}
          onAction={() => {
            onSearchChange('');
            onFilterChange('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredUnits.map((unit) => {
            const unitProgress = progress?.units[unit.unitNumber];
            const isCompleted = Boolean(unitProgress?.completed);
            const isInProgress = Boolean(unitProgress && !unitProgress.completed && unitProgress.lastPositionMs > 0);
            const isCurrentlyPlaying = activePlayingUnitNumber === unit.unitNumber;
            const isCardLoading = isCurrentlyPlaying && isLoadingUnit;
            const durationMinutes = Math.max(1, Math.round(unit.audioDurationMs / 60000));

            // Calculate unit percentage
            const unitPct = isCompleted
              ? 100
              : isInProgress && unitProgress && unit.audioDurationMs > 0
              ? Math.min(99, Math.max(1, Math.round((unitProgress.lastPositionMs / unit.audioDurationMs) * 100)))
              : 0;

            const handleCardClick = () => {
              if (isCurrentlyPlaying) {
                togglePlay();
                return;
              }
              const resumeMs = isCompleted ? 0 : unitProgress?.lastPositionMs || 0;
              onSelectUnit(unit.unitNumber, resumeMs);
            };

            return (
              <div
                key={unit.id}
                tabIndex={0}
                role="button"
                aria-label={`${dict.studyDesk.unitCardPrefix} ${unit.unitNumber}: ${unit.title}`}
                onClick={handleCardClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick();
                  }
                }}
                className={`group relative bg-white border rounded-2xl p-5 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:ring-offset-2 ${
                  isCurrentlyPlaying
                    ? 'border-ocean-400 ring-2 ring-ocean-200 shadow-glow-ocean bg-ocean-50/25'
                    : 'border-sand-200 hover:border-ocean-300 hover:shadow-soft-md'
                }`}
              >
                <div>
                  {/* Header: Badge & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-ocean-700 bg-ocean-50 border border-ocean-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
                        {dict.studyDesk.unitCardPrefix} {unit.unitNumber}
                      </span>

                      {isCurrentlyPlaying && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ocean-700 bg-ocean-100/70 border border-ocean-300 px-2 py-0.5 rounded-md animate-pulse">
                          <Volume2 className="w-3 h-3 text-ocean-600" />
                          <span>{dict.studyDesk.activePlayingBadge}</span>
                        </span>
                      )}
                    </div>

                    {isCompleted ? (
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="w-3 h-3" />
                        {dict.studyDesk.completedBadge}
                      </Badge>
                    ) : isInProgress ? (
                      <Badge variant="warning" size="sm">
                        <Clock className="w-3 h-3" />
                        {dict.studyDesk.inProgressBadge}
                      </Badge>
                    ) : (
                      <Badge variant="sand" size="sm">
                        {dict.studyDesk.notStartedBadge}
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-800 group-hover:text-ocean-700 transition-colors line-clamp-1 mb-2">
                    {unit.title}
                  </h3>

                  {/* Metadata */}
                  <div className="flex items-center gap-3.5 text-xs text-slate-500 mb-3">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      ~{durationMinutes} {dict.progress.minutesFormat}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {unit.totalSegments} {dict.studyDesk.segmentsLabel}
                    </span>
                  </div>

                  {/* Progress Bar (Visible when in-progress or completed) */}
                  {(isInProgress || isCompleted) && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
                        <span>{dict.library.unitProgressLabel}</span>
                        <span className="font-bold text-ocean-600">%{unitPct}</span>
                      </div>
                      <div className="w-full h-1.5 bg-sand-100 rounded-full overflow-hidden border border-sand-200/80">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-ocean-500 to-ocean-600'
                          }`}
                          style={{ width: `${unitPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3.5 border-t border-sand-100 flex items-center justify-between text-xs font-semibold">
                  <span
                    className={`flex items-center gap-1 transition-colors ${
                      isCurrentlyPlaying
                        ? 'text-ocean-700 font-bold'
                        : 'text-slate-600 group-hover:text-ocean-600'
                    }`}
                  >
                    <span>
                      {isCurrentlyPlaying && isPlaying
                        ? dict.studyDesk.pauseLessonAction
                        : isCurrentlyPlaying && !isPlaying
                        ? dict.studyDesk.listenResumeAction
                        : isCompleted
                        ? dict.studyDesk.continueLesson
                        : isInProgress
                        ? dict.studyDesk.continueLesson
                        : dict.studyDesk.listenNowAction}
                    </span>
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </span>

                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isCurrentlyPlaying
                        ? 'bg-ocean-600 text-white shadow-soft scale-105'
                        : 'bg-sand-100 text-slate-600 group-hover:bg-ocean-600 group-hover:text-white group-hover:scale-105 shadow-2xs'
                    }`}
                  >
                    {isCardLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : isCurrentlyPlaying && isPlaying ? (
                      <Pause className="w-4 h-4 fill-current ml-0.5" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Keyboard Shortcut Hint Footnote */}
      <div className="pt-2 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-100/70 border border-sand-200/80 rounded-full text-[11px] font-medium text-slate-500">
          <Keyboard className="w-3 h-3 text-slate-400" />
          <span>{dict.studyDesk.keyboardShortcutHint}</span>
        </span>
      </div>
    </div>
  );
};
