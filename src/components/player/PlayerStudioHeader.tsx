/**
 * Eidos Language OS - Player Studio Header
 * Premium toolbar for Full-Canvas Player with breadcrumbs, title, search, speaker filters, and completion status.
 */
import React, { useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  X,
  User,
  BookOpen,
  Headphones,
  Clock,
} from 'lucide-react';
import type { SpeakerRole } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useCourse } from '../../context/CourseContext';

interface PlayerStudioHeaderProps {
  unitNumber: number | null;
  unitTitle?: string;
  isUnitCompleted: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedSpeaker: SpeakerRole | 'ALL';
  onSelectSpeaker: (speaker: SpeakerRole | 'ALL') => void;
  totalSegmentsCount: number;
  filteredSegmentsCount: number;
  onToggleComplete: () => void;
  onNavigateBack: () => void;
  audioDurationMs?: number;
}

function formatDurationMinutes(ms?: number): string {
  if (!ms || ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export const PlayerStudioHeader: React.FC<PlayerStudioHeaderProps> = ({
  unitNumber,
  unitTitle,
  isUnitCompleted,
  searchQuery,
  onSearchChange,
  selectedSpeaker,
  onSelectSpeaker,
  totalSegmentsCount,
  filteredSegmentsCount,
  onToggleComplete,
  onNavigateBack,
  audioDurationMs,
}) => {
  const { dict } = useDictionary();
  const { activeCourse } = useCourse();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentUnitNum = unitNumber || 1;

  // Global hotkey '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="bg-white/90 backdrop-blur-md border border-sand-200/90 rounded-3xl p-4 sm:p-6 shadow-soft space-y-4 transition-all duration-200">
      {/* 1. Top Section: Navigation Breadcrumb, Unit Metadata, Audio Info, and Completion Action */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: Back Action & Unit Meta */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={onNavigateBack}
            aria-label={dict.player.backToStudyDesk}
            title={dict.player.backToStudyDesk}
            className="p-3 bg-sand-50 hover:bg-sand-100 active:scale-95 text-slate-700 hover:text-slate-900 border border-sand-200 rounded-2xl transition-all shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>

          <div className="space-y-1">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-base leading-none select-none">
                {activeCourse?.flag || '🇩🇪'}
              </span>

              <span className="text-xs font-extrabold text-ocean-800 bg-ocean-50 border border-ocean-200/90 px-2.5 py-0.5 rounded-lg shadow-xs">
                {dict.player.unitLessonBadge} {currentUnitNum}
              </span>

              <span className="text-[11px] font-semibold text-slate-600 bg-sand-100/90 border border-sand-200 px-2 py-0.5 rounded-lg">
                {activeCourse?.levelTitle || dict.library.levelCefrBadge}
              </span>

              {audioDurationMs !== undefined && audioDurationMs > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-slate-500 bg-sand-50 border border-sand-200 px-2 py-0.5 rounded-lg">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {formatDurationMinutes(audioDurationMs)}
                </span>
              )}

              {isUnitCompleted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-xs animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {dict.library.completedBadge}
                </span>
              )}
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight line-clamp-1">
              {unitTitle || `${dict.library.unitCardPrefix} ${currentUnitNum}`}
            </h1>
          </div>
        </div>

        {/* Right: Studio Action Badges & Mark Complete */}
        <div className="flex items-center gap-2.5 self-end lg:self-center">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-ocean-50/70 border border-ocean-200/80 text-ocean-800 text-xs font-semibold">
            <Headphones className="w-4 h-4 text-ocean-600 animate-pulse" />
            <span>{dict.player.focusStudio}</span>
          </div>

          <button
            onClick={onToggleComplete}
            aria-label={
              isUnitCompleted
                ? dict.player.unitCompletedTitle
                : dict.player.markLessonComplete
            }
            title={
              isUnitCompleted
                ? dict.player.unitCompletedTitle
                : dict.player.markLessonComplete
            }
            className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all shadow-xs active:scale-95 ${
              isUnitCompleted
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-emerald-50'
                : 'bg-sand-50 border-sand-200 text-slate-700 hover:bg-sand-100 hover:text-slate-900'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${
                isUnitCompleted ? 'text-emerald-600' : 'text-slate-400'
              }`}
            />
            <span>
              {isUnitCompleted
                ? dict.player.unitCompletedTitle
                : dict.player.markLessonComplete}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Bottom Toolbar: Full Canvas Search & Live Speaker Filter Pills */}
      <div className="pt-3 border-t border-sand-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Real-time Search Box with Shortcut Tag */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={dict.player.searchTranscript}
            aria-label={dict.player.searchTranscript}
            className="w-full pl-9 pr-14 py-2 bg-sand-50/80 border border-sand-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:bg-white transition-all shadow-inner"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              aria-label={dict.player.clearSearch}
              title={dict.player.clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-sand-200/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-sand-100/90 border border-sand-200 px-1.5 py-0.5 rounded shadow-2xs pointer-events-none">
              /
            </kbd>
          )}
        </div>

        {/* Speaker Filter Chips & Sentence Counter */}
        <div className="flex items-center flex-wrap gap-2 justify-between md:justify-end">
          <div className="flex items-center gap-1 bg-sand-100/80 border border-sand-200/80 p-1 rounded-2xl">
            {/* All */}
            <button
              onClick={() => onSelectSpeaker('ALL')}
              aria-label={dict.player.allSpeakers}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedSpeaker === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {dict.player.allSpeakers}
            </button>

            {/* German Male */}
            <button
              onClick={() => onSelectSpeaker('GERMAN_MALE')}
              aria-label={dict.speakers.GERMAN_MALE}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedSpeaker === 'GERMAN_MALE'
                  ? 'bg-ocean-50 text-ocean-800 border border-ocean-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5 text-ocean-600" />
              <span>{dict.speakers.GERMAN_MALE}</span>
            </button>

            {/* German Female */}
            <button
              onClick={() => onSelectSpeaker('GERMAN_FEMALE')}
              aria-label={dict.speakers.GERMAN_FEMALE}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedSpeaker === 'GERMAN_FEMALE'
                  ? 'bg-purple-50 text-purple-800 border border-purple-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5 text-purple-600" />
              <span>{dict.speakers.GERMAN_FEMALE}</span>
            </button>

            {/* Narrator */}
            <button
              onClick={() => onSelectSpeaker('NARRATOR')}
              aria-label={dict.speakers.NARRATOR}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedSpeaker === 'NARRATOR'
                  ? 'bg-sand-200 text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>{dict.speakers.NARRATOR}</span>
            </button>
          </div>

          {/* Counter pill */}
          <span className="text-[11px] font-mono text-slate-500 bg-sand-50 border border-sand-200 px-2.5 py-1 rounded-xl shadow-2xs">
            {filteredSegmentsCount} / {totalSegmentsCount} {dict.player.filterSegmentCount}
          </span>
        </div>
      </div>
    </header>
  );
};
