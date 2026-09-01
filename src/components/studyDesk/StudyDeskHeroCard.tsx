import React, { useMemo } from 'react';
import { Play, Pause, Sparkles, CheckCircle2, Headphones, RotateCcw, Award, Globe, ArrowRight, BookOpen, ExternalLink, Loader2 } from 'lucide-react';
import type { UnitSummary, AppView } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';
import { useCourse } from '../../context/CourseContext';

interface StudyDeskHeroCardProps {
  totalUnits: number;
  units: UnitSummary[];
  onNavigate: (view: AppView) => void;
}

export const StudyDeskHeroCard: React.FC<StudyDeskHeroCardProps> = ({
  totalUnits,
  units,
  onNavigate,
}) => {
  const { dict } = useDictionary();
  const { progress } = useAuth();
  const { activeCourse } = useCourse();
  const {
    unitNumber: activePlayingUnitNumber,
    isPlaying,
    currentMs,
    durationMs,
    isLoadingUnit,
    loadAndPlayUnit,
    togglePlay,
  } = usePlayer();

  const completedCount = progress?.completedUnitsCount || 0;
  const effectiveTotalUnits = totalUnits > 0 ? totalUnits : 30;
  const completionRate = progress?.overallCompletionRate || (effectiveTotalUnits > 0 ? Math.round((completedCount / effectiveTotalUnits) * 100) : 0);
  const isAllUnitsCompleted = effectiveTotalUnits > 0 && completedCount >= effectiveTotalUnits;

  // Determine the smartest unit to resume or start (Single Source of Truth)
  const { resumeTargetUnitNumber, resumePositionMs } = useMemo(() => {
    // 1. If a unit is currently loaded/playing, that takes priority
    if (activePlayingUnitNumber && activePlayingUnitNumber >= 1) {
      const pos = progress?.units[activePlayingUnitNumber]?.lastPositionMs || 0;
      return { resumeTargetUnitNumber: activePlayingUnitNumber, resumePositionMs: pos };
    }

    // 2. Search user progress for in-progress unit (last listened)
    if (progress?.units) {
      const inProgressEntry = Object.values(progress.units).find(
        (u) => !u.completed && u.lastPositionMs > 0
      );
      if (inProgressEntry) {
        return {
          resumeTargetUnitNumber: inProgressEntry.unitNumber,
          resumePositionMs: inProgressEntry.lastPositionMs,
        };
      }

      // 3. Find first uncompleted unit
      for (let i = 1; i <= Math.max(effectiveTotalUnits, 10); i++) {
        if (!progress.units[i]?.completed) {
          const pos = progress.units[i]?.lastPositionMs || 0;
          return { resumeTargetUnitNumber: i, resumePositionMs: pos };
        }
      }
    }

    // Default to Unit 1 with 0ms
    return { resumeTargetUnitNumber: 1, resumePositionMs: 0 };
  }, [activePlayingUnitNumber, progress, effectiveTotalUnits]);

  const targetUnitProgress = progress?.units[resumeTargetUnitNumber];
  const isTargetActive = activePlayingUnitNumber === resumeTargetUnitNumber;
  const hasStartedTarget = Boolean(
    targetUnitProgress && (targetUnitProgress.lastPositionMs > 0 || targetUnitProgress.completed)
  );

  const targetUnitMeta = units.find((u) => u.unitNumber === resumeTargetUnitNumber);

  // Real-time live or stored millisecond position
  const activePositionMs = isTargetActive && currentMs > 0 ? currentMs : resumePositionMs;
  const activeDurationMs = isTargetActive && durationMs > 0 ? durationMs : targetUnitMeta?.audioDurationMs || 0;

  // Format millisecond position
  const formattedPosition = useMemo(() => {
    if (!activePositionMs || activePositionMs <= 0) return null;
    const totalSeconds = Math.floor(activePositionMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [activePositionMs]);

  const formattedDuration = useMemo(() => {
    if (!activeDurationMs || activeDurationMs <= 0) return null;
    const totalSeconds = Math.floor(activeDurationMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [activeDurationMs]);

  const handleHeroAction = () => {
    // 1. If currently loaded and playing, toggle play/pause
    if (isTargetActive) {
      togglePlay();
      return;
    }

    // 2. Load and play unit from the exact millisecond position
    const startMs = isAllUnitsCompleted ? 0 : resumePositionMs;
    loadAndPlayUnit(resumeTargetUnitNumber, startMs, true);
  };

  return (
    <div className="relative overflow-hidden bg-white border border-sand-200 rounded-3xl p-5 sm:p-7 md:p-8 shadow-soft mb-6 transition-all">
      {/* Decorative ambient yacht-deck lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-ocean-100/40 via-ocean-50/20 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-radial from-sand-100/50 to-transparent rounded-full blur-2xl -z-10 pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
        {/* Left Section: Active Language Badges, Course Title, 1-Click Smart Resume Action */}
        <div className="space-y-4 max-w-2xl">
          {/* Badges and Course Level Indicators */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-ocean-50 border border-ocean-200/90 rounded-full text-ocean-800 text-xs font-bold tracking-wide shadow-2xs">
              <span className="text-sm">{activeCourse.flag}</span>
              <span>{activeCourse.courseTitle}</span>
              <span className="text-ocean-400">•</span>
              <span className="text-ocean-600">{activeCourse.levelTitle}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-100/80 border border-sand-200 rounded-full text-slate-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span>{dict.studyDesk.activeCourseBadge}</span>
            </div>

            {isTargetActive && isPlaying && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-ocean-100 border border-ocean-300 rounded-full text-ocean-800 text-xs font-bold shadow-2xs animate-pulse">
                <span className="w-2 h-2 rounded-full bg-ocean-600 animate-ping" />
                <span>{dict.globalPlayer.liveBadge}</span>
              </div>
            )}

            {isAllUnitsCompleted && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-bold shadow-2xs">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>{dict.studyDesk.allCompletedCelebration}</span>
              </div>
            )}
          </div>

          {/* Title & Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1.5">
              {dict.studyDesk.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
              {dict.studyDesk.subtitle}
            </p>
          </div>

          {/* Actions: 1-Click Resume Button & Quick Navigation Buttons */}
          <div className="pt-1 flex flex-wrap items-center gap-3">
            <button
              onClick={handleHeroAction}
              disabled={isLoadingUnit}
              aria-label={dict.studyDesk.continueLesson}
              className={`group px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center gap-3.5 shadow-soft hover:shadow-soft-md active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:ring-offset-2 ${
                isTargetActive && isPlaying
                  ? 'bg-ocean-700 text-white ring-2 ring-ocean-200'
                  : 'bg-ocean-600 hover:bg-ocean-700 text-white'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  isTargetActive && isPlaying
                    ? 'bg-white text-ocean-700'
                    : 'bg-ocean-500 text-white'
                }`}
              >
                {isLoadingUnit ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : isAllUnitsCompleted ? (
                  <RotateCcw className="w-4 h-4" />
                ) : isTargetActive && isPlaying ? (
                  <Pause className="w-4 h-4 fill-current ml-0.5" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </div>

              <div className="text-left">
                <div className="text-xs text-ocean-100 font-medium leading-none flex items-center gap-1.5">
                  <span>{dict.studyDesk.unitCardPrefix} {resumeTargetUnitNumber}</span>
                  {targetUnitMeta ? <span className="truncate max-w-[140px] sm:max-w-[200px]">• {targetUnitMeta.title}</span> : null}
                  {formattedPosition && formattedDuration ? (
                    <span className="text-[11px] text-ocean-200 font-mono bg-ocean-800/60 px-1.5 py-0.5 rounded">
                      {formattedPosition} / {formattedDuration}
                    </span>
                  ) : null}
                </div>

                <div className="text-sm font-bold text-white mt-1 flex items-center gap-1">
                  <span>
                    {isAllUnitsCompleted
                      ? dict.studyDesk.restartCourseAction
                      : isTargetActive && isPlaying
                      ? dict.studyDesk.pauseLessonAction
                      : isTargetActive && !isPlaying
                      ? dict.studyDesk.listenResumeAction
                      : hasStartedTarget
                      ? dict.studyDesk.continueLesson
                      : resumeTargetUnitNumber === 1
                      ? dict.studyDesk.startUnitOne
                      : dict.studyDesk.listenNowAction}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>

            {/* Jump to Full Interactive Player Button */}
            {isTargetActive && (
              <button
                onClick={() => onNavigate('player')}
                aria-label={dict.studyDesk.openPlayerAction}
                className="px-4 py-3 bg-ocean-50 hover:bg-ocean-100 border border-ocean-300 rounded-2xl text-xs font-bold text-ocean-800 transition-all flex items-center gap-2 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-ocean-300"
              >
                <Headphones className="w-4 h-4 text-ocean-600" />
                <span>{dict.studyDesk.openPlayerAction}</span>
                <ExternalLink className="w-3 h-3 text-ocean-500" />
              </button>
            )}

            {/* Switch Language Shortcut Button */}
            <button
              onClick={() => onNavigate('languageHub')}
              aria-label={dict.studyDesk.switchCourseAction}
              className="px-4 py-3 bg-sand-50 hover:bg-sand-100 border border-sand-200 rounded-2xl text-xs font-bold text-slate-700 hover:text-slate-900 transition-all flex items-center gap-2 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-ocean-300"
            >
              <Globe className="w-4 h-4 text-ocean-600" />
              <span>{dict.studyDesk.switchCourseAction}</span>
            </button>

            {/* Dialogue Study Room Shortcut */}
            <button
              onClick={() => onNavigate('dialogues')}
              aria-label={dict.studyDesk.viewDialoguesAction}
              className="px-4 py-3 bg-sand-50 hover:bg-sand-100 border border-sand-200 rounded-2xl text-xs font-bold text-slate-700 hover:text-slate-900 transition-all flex items-center gap-2 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-ocean-300"
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>{dict.studyDesk.viewDialoguesAction}</span>
            </button>
          </div>
        </div>

        {/* Right Section: Compact Mastery Status Visualizer */}
        <div className="bg-sand-50/80 border border-sand-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 lg:min-w-[280px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {dict.studyDesk.masterySummary}
            </span>
            <span className="text-xs font-extrabold text-ocean-700 bg-ocean-50 border border-ocean-200 px-2 py-0.5 rounded-lg shadow-2xs">
              %{completionRate}
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-white border border-sand-200/80 rounded-xl p-2.5 shadow-2xs">
              <div className="text-base font-extrabold text-slate-900">
                {completedCount} / {effectiveTotalUnits}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                {dict.studyDesk.completedUnits}
              </div>
            </div>

            <div className="bg-white border border-sand-200/80 rounded-xl p-2.5 shadow-2xs">
              <div className="text-base font-extrabold text-slate-900">
                {progress?.totalListenedMinutes || 0}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                {dict.studyDesk.activeListening} ({dict.progress.minutesFormat})
              </div>
            </div>
          </div>

          {/* Mini Level Progress Bar */}
          <div>
            <div className="w-full h-2 bg-sand-200/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ocean-500 to-ocean-600 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full Progress Track at bottom border */}
      <div className="mt-6 pt-5 border-t border-sand-100 flex items-center justify-between text-xs font-semibold text-slate-600">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-ocean-600" />
          <span>{dict.library.courseProgress}</span>
          <span className="text-[11px] text-slate-400 font-normal">
            ({completedCount} / {effectiveTotalUnits} {dict.studyDesk.completedUnits})
          </span>
        </span>

        <span className="text-slate-500 font-medium text-[11px]">
          {activeCourse.levelTitle}
        </span>
      </div>
    </div>
  );
};
