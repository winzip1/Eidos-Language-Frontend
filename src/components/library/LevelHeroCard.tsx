import React from 'react';
import { Play, Sparkles, Clock, Layers, CheckCircle2, Headphones, Compass, RotateCcw, Award } from 'lucide-react';
import type { UnitSummary } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';

interface LevelHeroCardProps {
  totalUnits: number;
  onSelectUnit: (unitNumber: number) => void;
  units?: UnitSummary[];
}

export const LevelHeroCard: React.FC<LevelHeroCardProps> = ({
  totalUnits,
  onSelectUnit,
  units = [],
}) => {
  const { dict } = useDictionary();
  const { progress } = useAuth();
  const { unitNumber: activePlayingUnitNumber, isPlaying } = usePlayer();

  const completedCount = progress?.completedUnitsCount || 0;
  const completionRate = progress?.overallCompletionRate || 0;
  const totalMinutes = progress?.totalListenedMinutes || 0;
  const isAllUnitsCompleted = totalUnits > 0 && completedCount >= totalUnits;

  // Determine the smartest unit to resume or start
  const resumeTargetUnitNumber = React.useMemo<number>(() => {
    // 1. If a unit is currently loaded/playing, that's top priority
    if (activePlayingUnitNumber && activePlayingUnitNumber >= 1) {
      return activePlayingUnitNumber;
    }

    // 2. Search user progress for in-progress unit (last listened)
    if (progress?.units) {
      const inProgressEntry = Object.values(progress.units).find(
        (u) => !u.completed && u.lastPositionMs > 0
      );
      if (inProgressEntry) {
        return inProgressEntry.unitNumber;
      }

      // 3. Find first uncompleted unit
      for (let i = 1; i <= Math.max(totalUnits, 10); i++) {
        if (!progress.units[i]?.completed) {
          return i;
        }
      }
    }

    // Default to Unit 1
    return 1;
  }, [activePlayingUnitNumber, progress, totalUnits]);

  const targetUnitProgress = progress?.units[resumeTargetUnitNumber];
  const isTargetPlaying = activePlayingUnitNumber === resumeTargetUnitNumber;
  const hasStartedTarget = Boolean(
    targetUnitProgress && (targetUnitProgress.lastPositionMs > 0 || targetUnitProgress.completed)
  );

  const targetUnitMeta = units.find((u) => u.unitNumber === resumeTargetUnitNumber);

  return (
    <div className="relative overflow-hidden bg-white border border-sand-200 rounded-3xl p-5 sm:p-7 md:p-8 shadow-soft mb-8 transition-all">
      {/* Decorative ambient yacht-deck lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-ocean-100/40 via-ocean-50/20 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-radial from-sand-100/50 to-transparent rounded-full blur-2xl -z-10 pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
        {/* Left Side: Header, CEFR Badge & Continue Action */}
        <div className="space-y-3.5 max-w-2xl">
          {/* Badge & Level Indicator */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-ocean-50 border border-ocean-200 rounded-full text-ocean-700 text-xs font-bold tracking-wide shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-ocean-600" />
              <span>{dict.library.levelPrefix} 1 • {dict.library.levelCefrBadge || dict.badges.beginnerA1}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-100/80 border border-sand-200 rounded-full text-slate-700 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              <span>{dict.library.levelSubtitleTag}</span>
            </div>

            {isAllUnitsCompleted && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-bold shadow-2xs">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>{dict.library.allCompletedCelebration}</span>
              </div>
            )}
          </div>

          {/* Title & Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {dict.library.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
              {dict.library.subtitle}
            </p>
          </div>

          {/* 1-Click Resume Hero Action Button */}
          <div className="pt-1 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectUnit(resumeTargetUnitNumber)}
              aria-label={dict.library.continueLastLesson}
              className={`group px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center gap-3 shadow-soft hover:shadow-soft-md active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:ring-offset-2 ${
                isTargetPlaying
                  ? 'bg-ocean-600 text-white ring-2 ring-ocean-200'
                  : 'bg-ocean-600 hover:bg-ocean-700 text-white'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  isTargetPlaying && isPlaying
                    ? 'bg-white text-ocean-600 animate-pulse'
                    : 'bg-ocean-500 text-white'
                }`}
              >
                {isAllUnitsCompleted ? (
                  <RotateCcw className="w-4 h-4" />
                ) : isTargetPlaying && isPlaying ? (
                  <Headphones className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </div>
              <div className="text-left">
                <div className="text-xs text-ocean-100 font-medium leading-none">
                  {dict.library.unitCardPrefix} {resumeTargetUnitNumber}
                  {targetUnitMeta ? ` • ${targetUnitMeta.title}` : ''}
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {isAllUnitsCompleted
                    ? dict.library.restartCourseAction
                    : hasStartedTarget || isTargetPlaying
                    ? dict.library.continueLastLesson
                    : resumeTargetUnitNumber === 1
                    ? dict.library.startUnitOne
                    : dict.library.startLessonButton}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Right Side: Key Progress Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 flex-shrink-0 lg:min-w-[320px]">
          {/* Total Units */}
          <div className="bg-sand-50/70 border border-sand-200 rounded-2xl p-3 sm:p-4 text-center hover:bg-sand-50 transition-colors">
            <div className="w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-xl bg-ocean-50 border border-ocean-200/60 flex items-center justify-center text-ocean-600 mb-1">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-900">{totalUnits}</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
              {dict.library.unitCardPrefix}
            </div>
          </div>

          {/* Completed Units */}
          <div className="bg-sand-50/70 border border-sand-200 rounded-2xl p-3 sm:p-4 text-center hover:bg-sand-50 transition-colors">
            <div className="w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-900">{completedCount}</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
              {dict.library.unitsCompletedStat}
            </div>
          </div>

          {/* Total Listened Time */}
          <div className="bg-sand-50/70 border border-sand-200 rounded-2xl p-3 sm:p-4 text-center hover:bg-sand-50 transition-colors">
            <div className="w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 mb-1">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-900">{totalMinutes}</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
              {dict.library.totalTimeStat} ({dict.progress.minutesFormat})
            </div>
          </div>
        </div>
      </div>

      {/* Course Overall Progress Bar */}
      <div className="mt-6 pt-5 border-t border-sand-100">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
          <span className="flex items-center gap-1.5">
            <span>{dict.library.courseProgress}</span>
            <span className="text-[11px] text-slate-400 font-normal">
              ({completedCount} / {totalUnits} {dict.library.unitsCompletedStat})
            </span>
          </span>
          <span className="text-ocean-600 font-bold bg-ocean-50 border border-ocean-200 px-2 py-0.5 rounded-md">
            %{completionRate}
          </span>
        </div>
        <div className="w-full h-2.5 bg-sand-100 rounded-full overflow-hidden border border-sand-200">
          <div
            className="h-full bg-gradient-to-r from-ocean-500 to-ocean-600 rounded-full transition-all duration-700 ease-out shadow-2xs"
            style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
