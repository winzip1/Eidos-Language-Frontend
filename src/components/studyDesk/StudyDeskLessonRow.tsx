/**
 * Eidos Language OS - Study Desk Lesson Row (Yatay İnce Çizgi)
 * Sleek, horizontal thin line lesson row replacing clunky 3-column box cards.
 * Displays Day/Lesson number, unit title, audio duration, segments count, progress status, and 1-click play.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React from 'react';
import { Play, Pause, CheckCircle2, Clock, Layers, Volume2, Loader2, Headphones } from 'lucide-react';
import type { UnitSummary, AppView } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { formatUnitDurationLabel } from '../../utils/audioTime';

export interface StudyDeskLessonRowProps {
  unit: UnitSummary;
  isCompleted: boolean;
  isInProgress: boolean;
  progressPct: number;
  isCurrentlyPlaying: boolean;
  isPlaying?: boolean;
  isLoading?: boolean;
  lastPositionMs?: number;
  onSelectUnit: (unitNumber: number, positionMs?: number) => void;
  onNavigate: (view: AppView) => void;
}

export const StudyDeskLessonRow: React.FC<StudyDeskLessonRowProps> = ({
  unit,
  isCompleted,
  isInProgress,
  progressPct,
  isCurrentlyPlaying,
  isPlaying = false,
  isLoading = false,
  lastPositionMs = 0,
  onSelectUnit,
  onNavigate,
}) => {
  const { dict } = useDictionary();

  const hasTranscript = Boolean(unit.hasTranscript || (unit.totalSegments > 0));
  const formattedDuration = formatUnitDurationLabel(
    unit.audioDurationMs,
    unit.estimatedDurationMinutes,
    dict.progress.minutesFormat,
    dict.studyDesk.audioEstimatedDuration
  );
  const dayText = dict.studyDesk.dayBadge.replace('{day}', String(unit.unitNumber));
  const lessonText = dict.studyDesk.lessonBadge.replace('{unit}', String(unit.unitNumber));

  const handleRowClick = () => {
    if (isLoading) return;
    const resumeMs = isCompleted ? 0 : lastPositionMs;
    onSelectUnit(unit.unitNumber, resumeMs);
    onNavigate('player');
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRowClick();
        }
      }}
      aria-current={isCurrentlyPlaying ? 'true' : undefined}
      aria-busy={isLoading}
      aria-disabled={isLoading}
      aria-label={`${lessonText}: ${unit.title}`}
      className={`group px-3.5 sm:px-5 py-3 sm:py-3.5 min-h-[52px] border-b border-sand-100 last:border-b-0 transition-all duration-150 flex items-center justify-between gap-3 sm:gap-4 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-inset active:scale-[0.99] ${
        isLoading
          ? 'cursor-wait opacity-80'
          : 'cursor-pointer'
      } ${
        isCurrentlyPlaying
          ? 'bg-ocean-50/50 hover:bg-ocean-50/80 ring-1 ring-inset ring-ocean-200'
          : 'hover:bg-sand-50/80'
      }`}
    >
      {/* Left: Day Badge + Title + Duration/Segments */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        {/* Day / Unit Badge */}
        <span
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-extrabold shrink-0 border transition-colors ${
            isCurrentlyPlaying
              ? 'bg-ocean-600 text-white border-ocean-600 shadow-2xs'
              : isCompleted
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
              : isInProgress
              ? 'bg-amber-50 text-amber-800 border-amber-200/80'
              : 'bg-sand-100 text-slate-700 border-sand-200/80 group-hover:bg-sand-200/80'
          }`}
        >
          {dayText}
        </span>

        {/* Title & Metadata Details */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <h4
              title={unit.title}
              className={`text-sm sm:text-base font-bold truncate transition-colors ${
                isCurrentlyPlaying
                  ? 'text-ocean-900 font-extrabold'
                  : 'text-slate-800 group-hover:text-ocean-700'
              }`}
            >
              {unit.title}
            </h4>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 text-[11px] text-slate-400 font-medium flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{formattedDuration}</span>
            </span>
            <span className="text-slate-300">•</span>
            {hasTranscript ? (
              <span className="inline-flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{unit.totalSegments} {dict.studyDesk.segmentsLabel}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-sand-50 text-ocean-700 border border-sand-200">
                <Headphones className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
                <span>{dict.studyDesk.audioOnlyBadge}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Progress Status Pill & Play Button */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Status Pill */}
        <div className="hidden xs:flex items-center">
          {isCurrentlyPlaying && isPlaying ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-ocean-100 text-ocean-800 border border-ocean-200 rounded-lg text-xs font-extrabold animate-pulse">
              <Volume2 className="w-3.5 h-3.5 text-ocean-600" />
              <span>{dict.studyDesk.activePlayingBadge}</span>
            </span>
          ) : isCurrentlyPlaying && !isPlaying ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-ocean-50 text-ocean-700 border border-ocean-200 rounded-lg text-xs font-semibold">
              <Volume2 className="w-3.5 h-3.5 text-ocean-600" />
              <span>{dict.studyDesk.activeCourseBadge || dict.studyDesk.listenResumeAction}</span>
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{dict.studyDesk.completedBadge}</span>
            </span>
          ) : isInProgress ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold">
              <span>{dict.studyDesk.inProgressBadge}</span>
              <span className="font-mono font-bold text-amber-900">%{progressPct}</span>
            </div>
          ) : (
            <span className="px-2.5 py-1 bg-sand-100 text-slate-500 rounded-lg text-xs font-medium">
              {dict.studyDesk.notStartedBadge}
            </span>
          )}
        </div>

        {/* 1-Click Play Circular Visual Indicator */}
        <div
          aria-hidden="true"
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-150 shadow-2xs group-hover:scale-105 ${
            isCurrentlyPlaying && isPlaying
              ? 'bg-ocean-600 text-white shadow-soft'
              : 'bg-sand-100 group-hover:bg-ocean-600 text-slate-700 group-hover:text-white border border-sand-200'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-current" />
          ) : isCurrentlyPlaying && isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </div>
      </div>
    </div>
  );
};
