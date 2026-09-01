import React from 'react';
import { Flame, Target, CheckCircle2, Clock, BookOpen, Award, Sparkles, ChevronRight } from 'lucide-react';
import type { AppView } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';

interface StudyMetricsBannerProps {
  totalUnits: number;
  onNavigate?: (view: AppView) => void;
}

export const StudyMetricsBanner: React.FC<StudyMetricsBannerProps> = ({
  totalUnits,
  onNavigate,
}) => {
  const { dict, remoteConfig } = useDictionary();
  const { progress } = useAuth();

  const effectiveTotalUnits = totalUnits > 0 ? totalUnits : 30;
  const completedCount = progress?.completedUnitsCount || 0;
  const totalMinutes = progress?.totalListenedMinutes || 0;
  const streakDays = progress?.streakDays || (totalMinutes > 0 ? 1 : 0);

  // Daily Target Calculation
  const dailyGoalMinutes = remoteConfig?.dailyGoalMinutes || 30;
  // Estimate today's progress based on listening time
  const todayMinutes = Math.min(dailyGoalMinutes, totalMinutes);
  const dailyGoalPercent = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));
  const isGoalAchieved = dailyGoalPercent >= 100;

  // Total hours & minutes
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const formattedTime = totalHours > 0
    ? `${totalHours} ${dict.progress.hoursFormat} ${remainingMinutes} ${dict.progress.minutesFormat}`
    : `${totalMinutes} ${dict.progress.minutesFormat}`;

  // Vocabulary stats
  const vocabMastered = progress?.vocabulary?.mastered || 0;
  const vocabLearning = progress?.vocabulary?.learning || 0;
  const totalVocab = vocabMastered + vocabLearning;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* 1. Daily Streak Card (Clickable to Progress Dashboard) */}
      <div
        role={onNavigate ? 'button' : undefined}
        tabIndex={onNavigate ? 0 : undefined}
        onClick={() => onNavigate?.('progress')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate?.('progress')}
        className={`bg-white border border-sand-200 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all duration-200 flex flex-col justify-between group ${
          onNavigate ? 'hover:shadow-soft hover:border-amber-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">
            {dict.studyDesk.streakCount}
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {streakDays}
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
              {dict.studyDesk.streakDaysSuffix}
            </span>
          </div>

          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{dict.progress.streakDescription}</span>
            </span>
            {onNavigate && (
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* 2. Daily Goal Target Card (Clickable to Progress Dashboard) */}
      <div
        role={onNavigate ? 'button' : undefined}
        tabIndex={onNavigate ? 0 : undefined}
        onClick={() => onNavigate?.('progress')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate?.('progress')}
        className={`bg-white border border-sand-200 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all duration-200 flex flex-col justify-between group ${
          onNavigate ? 'hover:shadow-soft hover:border-ocean-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ocean-300' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">
            {dict.studyDesk.dailyGoal}
          </span>
          <div className="w-8 h-8 rounded-xl bg-ocean-50 border border-ocean-200/80 flex items-center justify-center text-ocean-600 group-hover:scale-105 transition-transform">
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {todayMinutes}
              <span className="text-xs font-medium text-slate-400 ml-1">
                / {dailyGoalMinutes} {dict.progress.minutesFormat}
              </span>
            </span>

            {isGoalAchieved && (
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                ✓ {dict.studyDesk.dailyGoalAchieved}
              </span>
            )}
          </div>

          {/* Goal progress mini bar */}
          <div className="w-full h-1.5 bg-sand-100 rounded-full overflow-hidden border border-sand-200/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isGoalAchieved ? 'bg-emerald-500' : 'bg-ocean-500'
              }`}
              style={{ width: `${dailyGoalPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Completed Units Card */}
      <div
        role={onNavigate ? 'button' : undefined}
        tabIndex={onNavigate ? 0 : undefined}
        onClick={() => onNavigate?.('progress')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate?.('progress')}
        className={`bg-white border border-sand-200 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all duration-200 flex flex-col justify-between group ${
          onNavigate ? 'hover:shadow-soft hover:border-emerald-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-300' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">
            {dict.studyDesk.completedUnits}
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {completedCount}
            </span>
            <span className="text-xs font-bold text-slate-400">
              / {effectiveTotalUnits} {dict.studyDesk.filterCountLabel}
            </span>
          </div>

          <div className="flex items-center justify-between mt-1 text-[11px] text-emerald-700 font-semibold">
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-600" />
              <span>%{progress?.overallCompletionRate || 0} {dict.progress.overallCompletion}</span>
            </span>
            {onNavigate && (
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* 4. Active Listening Time Card (Clickable to Vocabulary Deck) */}
      <div
        role={onNavigate ? 'button' : undefined}
        tabIndex={onNavigate ? 0 : undefined}
        onClick={() => onNavigate?.(totalVocab > 0 ? 'vocabulary' : 'progress')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate?.(totalVocab > 0 ? 'vocabulary' : 'progress')}
        className={`bg-white border border-sand-200 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all duration-200 flex flex-col justify-between group ${
          onNavigate ? 'hover:shadow-soft hover:border-indigo-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">
            {dict.studyDesk.activeListening}
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
              {formattedTime}
            </span>
          </div>

          <div className="flex items-center justify-between mt-1 text-[11px]">
            {totalVocab > 0 ? (
              <span className="text-indigo-700 font-bold flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-indigo-600" />
                <span>{totalVocab} {dict.studyDesk.wordsMasteredLabel}</span>
              </span>
            ) : (
              <span className="text-slate-400">
                {dict.progress.lastActive}
              </span>
            )}
            {onNavigate && (
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
