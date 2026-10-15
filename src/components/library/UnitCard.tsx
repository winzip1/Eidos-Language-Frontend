import React from 'react';
import { Play, CheckCircle2, Clock, Headphones, ArrowRight, Layers, Volume2, Loader2 } from 'lucide-react';
import type { UnitSummary, UnitUserProgress } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { Badge } from '../common/Badge';
import { formatUnitDurationLabel, calculateLessonProgressPct } from '../../utils/audioTime';

interface UnitCardProps {
  unit: UnitSummary;
  progress?: UnitUserProgress;
  isCurrentlyPlaying: boolean;
  isLoading?: boolean;
  onSelect: (unitNumber: number) => void;
}

export const UnitCard: React.FC<UnitCardProps> = ({
  unit,
  progress,
  isCurrentlyPlaying,
  isLoading = false,
  onSelect,
}) => {
  const { dict } = useDictionary();

  const isCompleted = Boolean(progress?.completed);
  const isInProgress = Boolean(progress && !progress.completed && progress.lastPositionMs > 0);

  const hasTranscript = Boolean(unit.hasTranscript || (unit.totalSegments > 0));

  const formattedDuration = formatUnitDurationLabel(
    unit.audioDurationMs,
    unit.estimatedDurationMinutes,
    dict.progress.minutesFormat,
    dict.studyDesk.audioEstimatedDuration
  );

  // Calculate honest completion percentage for this single unit
  const unitProgressPercent = React.useMemo<number>(() => {
    return calculateLessonProgressPct(
      progress?.lastPositionMs,
      unit.audioDurationMs,
      unit.estimatedDurationMinutes,
      isCompleted
    );
  }, [isCompleted, progress?.lastPositionMs, unit.audioDurationMs, unit.estimatedDurationMinutes]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(unit.unitNumber);
    }
  };

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`${dict.library.unitCardPrefix} ${unit.unitNumber}: ${unit.title}`}
      onClick={() => onSelect(unit.unitNumber)}
      onKeyDown={handleKeyDown}
      className={`group relative bg-white border rounded-2xl p-5 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between hover:-translate-y-1 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:ring-offset-2 ${
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
              {dict.library.unitCardPrefix} {unit.unitNumber}
            </span>

            {isCurrentlyPlaying && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ocean-700 bg-ocean-100/70 border border-ocean-300 px-2 py-0.5 rounded-md animate-pulse">
                <Volume2 className="w-3 h-3 text-ocean-600" />
                <span>{dict.library.activePlayingBadge}</span>
              </span>
            )}
          </div>

          {isCompleted ? (
            <Badge variant="success" size="sm">
              <CheckCircle2 className="w-3 h-3" />
              {dict.library.completedBadge}
            </Badge>
          ) : isInProgress ? (
            <Badge variant="warning" size="sm">
              <Clock className="w-3 h-3" />
              {dict.library.inProgressBadge}
            </Badge>
          ) : (
            <Badge variant="sand" size="sm">
              {dict.library.notStartedBadge}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3
          title={unit.title}
          className="text-base font-bold text-slate-800 group-hover:text-ocean-700 transition-colors line-clamp-1 mb-2"
        >
          {unit.title}
        </h3>

        {/* Metadata */}
        <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-slate-500 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formattedDuration}</span>
          </span>
          <span className="text-slate-300">•</span>
          {hasTranscript ? (
            <span className="inline-flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{unit.totalSegments} {dict.library.segmentsLabel}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sand-50 text-ocean-700 border border-sand-200">
              <Headphones className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
              <span>{dict.studyDesk.audioOnlyBadge || dict.badges.audioOnlyBadge}</span>
            </span>
          )}
        </div>

        {/* Progress Bar (Visible when in-progress or completed) */}
        {(isInProgress || isCompleted) && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
              <span>{dict.library.unitProgressLabel}</span>
              <span className="font-bold text-ocean-600">%{unitProgressPercent}</span>
            </div>
            <div className="w-full h-1.5 bg-sand-100 rounded-full overflow-hidden border border-sand-200/80">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-ocean-500 to-ocean-600'
                }`}
                style={{ width: `${unitProgressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Action Button */}
      <div className="pt-3.5 border-t border-sand-100 flex items-center justify-between text-xs font-semibold">
        <span
          className={`flex items-center gap-1 transition-colors ${
            isCurrentlyPlaying
              ? 'text-ocean-700 font-bold'
              : 'text-slate-600 group-hover:text-ocean-600'
          }`}
        >
          <span>
            {isCompleted
              ? dict.library.resumeLessonButton
              : isInProgress
              ? dict.library.resumeLessonButton
              : dict.library.startLessonButton}
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
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : isCurrentlyPlaying ? (
            <Headphones className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </div>
      </div>
    </div>
  );
};
