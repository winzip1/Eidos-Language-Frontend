/**
 * Eidos Language OS - Lesson & Level Selector Modal
 * Hierarchical level (A1-C2) and 30-lesson unit navigator for Lesson Player.
 * Allows users to inspect and switch lessons directly inside player canvas without returning to study desk.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Error Transparency.
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  Layers,
  CheckCircle2,
  Play,
  Clock,
  Sparkles,
  BookOpen,
  Search,
  Loader2,
  Lock,
  Headphones,
} from 'lucide-react';
import type { UnitSummary } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';
import { useCourse } from '../../../context/CourseContext';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../services/apiClient';
import { formatElapsed, formatUnitDurationLabel } from '../../../utils/audioTime';

export interface LessonLevelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUnitNumber?: number | null;
  onSelectUnit: (unitNumber: number, levelId?: string) => void;
}

export const LessonLevelSelectorModal: React.FC<LessonLevelSelectorModalProps> = ({
  isOpen,
  onClose,
  activeUnitNumber,
  onSelectUnit,
}) => {
  const { dict } = useDictionary();
  const { activeCourse, availableCourses } = useCourse();
  const { progress } = useAuth();

  const [selectedLevelId, setSelectedLevelId] = useState<string>(() => {
    return activeCourse?.levelId || 'level1';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [units, setUnits] = useState<UnitSummary[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeTileRef = useRef<HTMLButtonElement | null>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  // In-memory level units cache to make subsequent switches instantaneous
  const unitsCacheRef = useRef<Record<string, UnitSummary[]>>({});

  // Levels catalogue derived from activeCourse or availableCourses (Single Source of Truth)
  const levels = useMemo(() => {
    if (activeCourse?.levels && activeCourse.levels.length > 0) {
      return activeCourse.levels;
    }
    const currentCourse = availableCourses.find((c) => c.id === activeCourse?.courseId);
    return currentCourse?.levels || [];
  }, [activeCourse, availableCourses]);

  const selectedLevel = useMemo(() => {
    return levels.find((l) => l.id === selectedLevelId);
  }, [levels, selectedLevelId]);

  // Sync selected level and reset search when modal opens or activeCourse changes
  useEffect(() => {
    if (isOpen) {
      setSelectedLevelId(activeCourse?.levelId || 'level1');
      setSearchQuery('');
      // Auto-focus search input with smooth delay
      const focusTimer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(focusTimer);
    }
  }, [isOpen, activeCourse?.levelId]);

  // Fetch units catalog for the currently selected level with in-memory caching
  const loadUnitsForLevel = useCallback(async (levelId: string) => {
    // 1. Check in-memory cache
    if (unitsCacheRef.current[levelId]) {
      setUnits(unitsCacheRef.current[levelId]);
      setIsLoadingUnits(false);
      setFetchError(null);
      return;
    }

    // 2. Check if level is available; if not available, return empty catalog without wasting network calls
    const targetLvl = levels.find((l) => l.id === levelId);
    if (targetLvl && !targetLvl.isAvailable) {
      setUnits([]);
      setIsLoadingUnits(false);
      setFetchError(null);
      return;
    }

    setIsLoadingUnits(true);
    setFetchError(null);
    try {
      const langId = activeCourse?.languageId || 'german';
      const res = await apiRequest<{ units: UnitSummary[]; totalUnits: number }>(
        `/api/v1/courses/${langId}/levels/${levelId}/units`
      );
      if (res && Array.isArray(res.units)) {
        unitsCacheRef.current[levelId] = res.units;
        setUnits(res.units);
      } else {
        setUnits([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchError(msg || dict.errors.networkError);
      setUnits([]);
    } finally {
      setIsLoadingUnits(false);
    }
  }, [activeCourse?.languageId, dict.errors.networkError, levels]);

  useEffect(() => {
    if (isOpen && selectedLevelId) {
      loadUnitsForLevel(selectedLevelId);
    }
  }, [isOpen, selectedLevelId, loadUnitsForLevel]);

  // Smoothly scroll active unit tile into view once loaded
  useEffect(() => {
    if (isOpen && !isLoadingUnits && units.length > 0 && activeTileRef.current) {
      const scrollTimer = setTimeout(() => {
        activeTileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
      return () => clearTimeout(scrollTimer);
    }
  }, [isOpen, isLoadingUnits, units.length]);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered units based on smart query (number, prefix, or title)
  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return units;
    const cleanQ = searchQuery.toLowerCase().trim();
    const numberOnly = cleanQ.replace(/^(ders|ünite|unit|lektion|lesson)\s*/i, '').trim();

    return units.filter((u) => {
      const matchNum =
        (numberOnly && String(u.unitNumber) === numberOnly) ||
        String(u.unitNumber).includes(cleanQ);
      const matchTitle = u.title && u.title.toLowerCase().includes(cleanQ);
      return matchNum || matchTitle;
    });
  }, [units, searchQuery]);

  // Level selector click handler
  const handleLevelClick = (levelId: string) => {
    setSelectedLevelId(levelId);
  };

  // Unit click handler
  const handleUnitClick = (unitNum: number) => {
    onSelectUnit(unitNum, selectedLevelId);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-level-selector-title"
      onMouseDown={(e) => {
        mouseDownTargetRef.current = e.target;
      }}
      onMouseUp={(e) => {
        if (e.target === e.currentTarget && mouseDownTargetRef.current === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs animate-fade-in select-none"
    >
      <div
        ref={modalRef}
        className="w-full max-w-4xl max-h-[92vh] sm:max-h-[86vh] flex flex-col bg-white rounded-3xl shadow-soft-xl border border-sand-200/90 overflow-hidden animate-scale-in"
      >
        {/* 1. Modal Top Bar: Header, Title & Close Button (shrink-0) */}
        <div className="shrink-0 flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-sand-200/80 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-ocean-100/80 text-ocean-700 flex items-center justify-center shrink-0 border border-ocean-200/70 shadow-2xs">
              <Layers className="w-5 h-5 text-ocean-600" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="lesson-level-selector-title"
                  className="text-base sm:text-lg font-bold text-slate-900 tracking-tight"
                >
                  {dict.lessonPlayer.levelLessonsModalTitle}
                </h2>
                {activeCourse?.flag && (
                  <span className="text-sm leading-none" aria-hidden="true">
                    {activeCourse.flag} {activeCourse.languageName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {dict.lessonPlayer.levelLessonsModalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={dict.lessonPlayer.closeModal}
            title={dict.lessonPlayer.closeModal}
            className="p-2 sm:p-2.5 rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-sand-100 transition-colors cursor-pointer border border-sand-200/80 shadow-2xs active:scale-95 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Hierarchical Level Selection Segment (shrink-0) */}
        <div className="shrink-0 px-4 sm:px-6 pt-3 pb-3 border-b border-sand-200/70 bg-sand-50/60">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {levels.map((lvl) => {
              const isSelected = lvl.id === selectedLevelId;
              const isAvailable = Boolean(lvl.isAvailable);

              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => handleLevelClick(lvl.id)}
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer border active:scale-95 shadow-2xs ${
                    isSelected
                      ? 'bg-white text-ocean-900 border-ocean-300 ring-2 ring-ocean-100 shadow-soft-sm'
                      : isAvailable
                      ? 'bg-white/70 hover:bg-white text-slate-700 border-sand-200 hover:border-sand-300'
                      : 'bg-sand-100/70 text-slate-400 border-sand-200/60 cursor-not-allowed opacity-80'
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase font-mono ${
                      isSelected
                        ? 'bg-ocean-100 text-ocean-800'
                        : isAvailable
                        ? 'bg-sand-100 text-slate-600'
                        : 'bg-slate-200/80 text-slate-500'
                    }`}
                  >
                    {lvl.cefrLevel || lvl.id}
                  </span>
                  <span className="truncate max-w-[140px] sm:max-w-none">{lvl.name}</span>
                  {!isAvailable && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/70">
                      <Lock className="w-2.5 h-2.5" />
                      {dict.languageHub.comingSoonBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Search & Units Count Bar */}
          <div className="flex items-center justify-between gap-3 mt-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${dict.lessonPlayer.lessonNumberPrefix}...`}
                className="w-full pl-9 pr-8 py-1.5 bg-white border border-sand-200/90 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ocean-500/30 focus:border-ocean-500 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label={dict.lessonPlayer.closeModal}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <span className="text-xs font-mono text-slate-500 font-semibold shrink-0">
              {filteredUnits.length} / {selectedLevel?.totalUnits || units.length}{' '}
              {dict.lessonPlayer.totalSentencesBadge ? dict.lessonPlayer.lessonNumberPrefix : ''}
            </span>
          </div>
        </div>

        {/* 3. Main Units Canvas (flex-1 min-h-0 overflow-y-auto) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-sand-100/40">
          {isLoadingUnits ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-ocean-600" />
              <p className="text-xs font-semibold">{dict.lessonPlayer.audioLoading}</p>
            </div>
          ) : fetchError ? (
            <div className="p-6 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-2">
              <p className="text-xs font-bold">{dict.errors.networkError}</p>
              <p className="text-xs font-mono text-rose-600">{fetchError}</p>
              <button
                type="button"
                onClick={() => loadUnitsForLevel(selectedLevelId)}
                className="mt-2 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold active:scale-95"
              >
                {dict.lessonPlayer.retryButton}
              </button>
            </div>
          ) : selectedLevel && !selectedLevel.isAvailable ? (
            /* Honest Empty State for Coming Soon Levels - Zero Fake Data */
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200/80 shadow-2xs">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                {selectedLevel.name} - {dict.languageHub.comingSoonBadge}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {dict.lessonPlayer.comingSoonLevel}
              </p>
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-400" />
              <p className="text-xs font-semibold">{dict.lessonPlayer.noSentencesFound}</p>
            </div>
          ) : (
            /* Responsive 30-Unit Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {filteredUnits.map((unit) => {
                const isCurrentActive =
                  activeUnitNumber === unit.unitNumber &&
                  selectedLevelId === (activeCourse?.levelId || 'level1');

                const unitProgress = progress?.units[unit.unitNumber];
                const isCompleted = Boolean(unitProgress?.completed);
                const isPartiallyPlayed = Boolean(
                  unitProgress && !unitProgress.completed && unitProgress.lastPositionMs > 0
                );

                const ariaLabel = `${dict.lessonPlayer.lessonNumberPrefix} ${unit.unitNumber}: ${
                  unit.title || ''
                }${isCompleted ? ` (${dict.lessonPlayer.completedBadge})` : ''}${
                  isCurrentActive ? ` (${dict.lessonPlayer.currentlyPlayingLesson})` : ''
                }`;

                return (
                  <button
                    key={`unit-card-${unit.unitNumber}`}
                    ref={isCurrentActive ? activeTileRef : undefined}
                    type="button"
                    onClick={() => handleUnitClick(unit.unitNumber)}
                    aria-label={ariaLabel}
                    className={`flex flex-col justify-between p-3 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer shadow-2xs group relative ${
                      isCurrentActive
                        ? 'bg-ocean-50/90 border-ocean-300 ring-2 ring-ocean-200 shadow-soft-sm'
                        : isCompleted
                        ? 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200/80 text-slate-800'
                        : isPartiallyPlayed
                        ? 'bg-amber-50/40 hover:bg-amber-50 border-amber-200/80 text-slate-800'
                        : 'bg-white hover:bg-sand-50/90 border-sand-200/90 text-slate-800 hover:border-sand-300'
                    }`}
                  >
                    {/* Top Row: Unit Number & Status Badge */}
                    <div className="flex items-center justify-between gap-1 w-full mb-2">
                      <span
                        className={`text-xs font-mono font-black ${
                          isCurrentActive
                            ? 'text-ocean-900'
                            : isCompleted
                            ? 'text-emerald-900'
                            : 'text-slate-800'
                        }`}
                      >
                        {dict.lessonPlayer.lessonNumberPrefix} {String(unit.unitNumber).padStart(2, '0')}
                      </span>

                      {isCurrentActive ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-ocean-700 bg-ocean-100/90 px-1.5 py-0.5 rounded-md border border-ocean-200">
                          <Play className="w-2.5 h-2.5 fill-current animate-pulse text-ocean-600" />
                        </span>
                      ) : isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : isPartiallyPlayed ? (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      ) : null}
                    </div>

                    {/* Middle: Title */}
                    <div className="min-w-0 flex-1 mb-2">
                      <p className="text-[11px] font-medium text-slate-600 line-clamp-2 leading-snug group-hover:text-slate-900 transition-colors">
                        {unit.title || `${dict.lessonPlayer.lessonTitle} ${unit.unitNumber}`}
                      </p>
                    </div>

                    {/* Bottom: Duration & Meta */}
                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                      {unit.audioDurationMs ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatElapsed(unit.audioDurationMs)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-ocean-700 font-medium">
                          <Headphones className="w-2.5 h-2.5 text-ocean-600" />
                          <span>{formatUnitDurationLabel(unit.audioDurationMs, unit.estimatedDurationMinutes, dict.progress.minutesFormat)}</span>
                        </span>
                      )}

                      {isCurrentActive && (
                        <span className="text-[9px] font-bold text-ocean-600 uppercase tracking-tight">
                          {dict.lessonPlayer.currentlyPlayingLesson}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
