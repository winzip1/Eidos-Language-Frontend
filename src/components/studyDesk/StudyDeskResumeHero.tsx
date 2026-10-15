/**
 * Eidos Language OS - Study Desk Resume Hero Pill (Kompakt Devam Hapı)
 * Streamlined, elegant "Where You Left Off" yacht-deck compact hero bar.
 * Keeps screen clean and focused, letting hierarchical level folders take center stage.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React, { useMemo } from 'react';
import { Play, Flame, Sparkles, Clock, CheckCircle2, Headphones, Layers, Loader2 } from 'lucide-react';
import type { UnitSummary, AppView } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { useCourse } from '../../context/CourseContext';
import { usePlayer } from '../../context/PlayerContext';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { formatUnitDurationLabel } from '../../utils/audioTime';

export interface StudyDeskResumeHeroProps {
  units: UnitSummary[];
  onSelectUnit: (unitNumber: number, positionMs?: number) => void;
  onNavigate: (view: AppView) => void;
  isLoading?: boolean;
  className?: string;
}

export const StudyDeskResumeHero: React.FC<StudyDeskResumeHeroProps> = ({
  units,
  onSelectUnit,
  onNavigate,
  isLoading = false,
  className = '',
}) => {
  const { dict } = useDictionary();
  const { progress } = useAuth();
  const { activeCourse } = useCourse();
  const { unitNumber: activePlayingUnitNumber } = usePlayer();

  const totalUnits = units.length > 0 ? units.length : 30;
  const completedCount = progress?.completedUnitsCount || 0;
  const streakDays = progress?.streakDays ?? 0;

  // Single Source of Truth: Find smartest unit to resume
  const { targetUnit, resumePositionMs, isUnitCompleted } = useMemo(() => {
    // 1. If currently playing, prioritize active playing unit
    if (activePlayingUnitNumber && activePlayingUnitNumber >= 1) {
      const found = units.find((u) => u.unitNumber === activePlayingUnitNumber);
      const pos = progress?.units[activePlayingUnitNumber]?.lastPositionMs || 0;
      const comp = Boolean(progress?.units[activePlayingUnitNumber]?.completed);
      if (found) {
        return { targetUnit: found, resumePositionMs: pos, isUnitCompleted: comp };
      }
    }

    // 2. Search for in-progress unit in user progress
    if (progress?.units) {
      const inProgressEntry = Object.values(progress.units).find(
        (u) => !u.completed && u.lastPositionMs > 0
      );
      if (inProgressEntry) {
        const found = units.find((u) => u.unitNumber === inProgressEntry.unitNumber);
        if (found) {
          return {
            targetUnit: found,
            resumePositionMs: inProgressEntry.lastPositionMs,
            isUnitCompleted: false,
          };
        }
      }

      // 3. Find first uncompleted unit
      for (let i = 1; i <= totalUnits; i++) {
        if (!progress.units[i]?.completed) {
          const found = units.find((u) => u.unitNumber === i);
          if (found) {
            const pos = progress.units[i]?.lastPositionMs || 0;
            return { targetUnit: found, resumePositionMs: pos, isUnitCompleted: false };
          }
        }
      }
    }

    // Default to first unit
    const defaultUnit = units[0] || {
      id: 'default_unit_1',
      unitNumber: 1,
      title: `${dict.studyDesk.unitCardPrefix} 01`,
      audioFileName: '',
      audioDurationMs: 0,
      totalSegments: 0,
      audioFileSize: 0,
      hasTranscript: false,
      transcriptStatus: 'pending',
      audioAvailable: false,
      estimatedDurationMinutes: 30,
    };
    const defaultCompleted = Boolean(progress?.units[defaultUnit.unitNumber]?.completed);

    return { targetUnit: defaultUnit, resumePositionMs: 0, isUnitCompleted: defaultCompleted };
  }, [activePlayingUnitNumber, units, progress, totalUnits, dict.studyDesk.unitCardPrefix]);

  const unitNum = targetUnit.unitNumber;
  const progressPct = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;

  const hasTranscript = Boolean(targetUnit.hasTranscript || (targetUnit.totalSegments > 0));
  const formattedDuration = formatUnitDurationLabel(
    targetUnit.audioDurationMs,
    targetUnit.estimatedDurationMinutes,
    dict.progress.minutesFormat,
    dict.studyDesk.audioEstimatedDuration
  );

  const handleStartResume = () => {
    onSelectUnit(unitNum, isUnitCompleted ? 0 : resumePositionMs);
    onNavigate('player');
  };

  const isContinuing = resumePositionMs > 0 && !isUnitCompleted;
  const startButtonText = isContinuing
    ? dict.studyDesk.continueLessonButton.replace('{day}', String(unitNum))
    : dict.studyDesk.startLessonButton.replace('{day}', String(unitNum));
  const streakText = dict.studyDesk.streakDaysContinuous.replace('{days}', String(streakDays));
  const progressText = dict.studyDesk.levelProgressFormat
    .replace('{completed}', String(completedCount))
    .replace('{total}', String(totalUnits));

  if (isLoading && units.length === 0) {
    return (
      <div className={`bg-white border border-sand-200/90 rounded-2xl p-4 sm:p-5 shadow-soft-xs ${className}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <LoadingSkeleton variant="text" className="w-48 h-4" />
            <LoadingSkeleton variant="text" className="w-72 h-6" />
          </div>
          <div className="flex items-center gap-4">
            <LoadingSkeleton variant="text" className="w-28 h-6" />
            <LoadingSkeleton variant="button" className="w-36 h-11 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label={dict.studyDesk.resumeLearningLabel}
      className={`bg-white border border-sand-200/90 rounded-2xl p-4 sm:p-5 shadow-soft-xs relative overflow-hidden transition-all duration-200 ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Section: Badges & Lesson Title */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Top Badges Row */}
          {/* Top Badges Row */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2.5 py-0.5 bg-ocean-50 text-ocean-700 border border-ocean-200/80 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
              {dict.studyDesk.resumePillBadge || dict.studyDesk.resumeLearningLabel}
            </span>
            <span className="font-semibold text-slate-500">
              {activeCourse?.flag ? `${activeCourse.flag} ` : ''}{activeCourse?.courseTitle || dict.studyDesk.activeCourseBadge} • {activeCourse?.levelTitle || activeCourse?.level || ''}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-slate-700">
              {dict.studyDesk.lessonBadge.replace('{unit}', String(unitNum))} ({dict.studyDesk.dayBadge.replace('{day}', String(unitNum))})
            </span>

            {/* Daily Streak Indicator */}
            {streakDays > 0 && (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50/90 border border-amber-200/80 text-amber-800 rounded-full text-[11px] font-bold shadow-2xs ml-auto sm:ml-0">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
                <span>{streakText}</span>
              </div>
            )}
          </div>

          {/* Unit Title */}
          <h2
            title={targetUnit.title}
            className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate"
          >
            {targetUnit.title}
          </h2>

          {/* Unit Honest Metadata Row */}
          <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium flex-wrap">
            <span className="inline-flex items-center gap-1 text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formattedDuration}</span>
            </span>

            <span className="text-slate-300">•</span>

            {hasTranscript ? (
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{targetUnit.totalSegments} {dict.studyDesk.segmentsLabel}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sand-50 text-ocean-700 border border-sand-200 rounded-md text-[11px] font-semibold">
                <Headphones className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
                <span>{dict.studyDesk.audioOnlyBadge}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Section: Progress & Quick Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end gap-3.5 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-sand-100">
          {/* Mini Level Progress Indicator */}
          <div className="flex flex-col gap-1 min-w-[140px] max-w-[180px]">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-medium text-slate-600">
                {activeCourse?.levelTitle || activeCourse?.level || ''} {dict.library.courseProgress}
              </span>
              <span className="font-mono font-bold text-ocean-700">{progressText}</span>
            </div>
            <div className="w-full h-1.5 bg-sand-100 rounded-full overflow-hidden border border-sand-200/70">
              <div
                className="h-full bg-gradient-to-r from-ocean-500 to-ocean-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
              />
            </div>
          </div>

          {/* Quick Play/Resume Action Button (min 44px touch height) */}
          <button
            type="button"
            onClick={handleStartResume}
            disabled={units.length === 0 || isLoading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-gradient-to-r from-ocean-600 to-ocean-700 hover:from-ocean-700 hover:to-ocean-800 active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm shadow-soft transition-all duration-150 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{startButtonText}</span>
          </button>
        </div>
      </div>
    </section>
  );
};

