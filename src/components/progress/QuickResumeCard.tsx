import React from 'react';
import { Flame, Play, Sparkles, BookOpen, Layers, CheckCircle, RefreshCw } from 'lucide-react';
import type { AppView } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';

interface QuickResumeCardProps {
  onNavigate: (view: AppView) => void;
}

export const QuickResumeCard: React.FC<QuickResumeCardProps> = ({ onNavigate }) => {
  const { dict } = useDictionary();
  const { progress, isSyncing } = useAuth();
  const { loadAndPlayUnit } = usePlayer();

  const totalUnits = progress?.totalUnits || 10;

  // Find first in-progress or uncompleted unit for "Resume" hero button
  let nextRecommendedUnit = 1;
  if (progress?.units) {
    for (let i = 1; i <= totalUnits; i++) {
      if (!progress.units[i] || !progress.units[i].completed) {
        nextRecommendedUnit = i;
        break;
      }
    }
  }

  const nextUnitData = progress?.units[nextRecommendedUnit];
  const hasStarted = Boolean(nextUnitData && nextUnitData.lastPositionMs > 0);
  const streakDays = progress?.streakDays !== undefined ? progress.streakDays : (hasStarted ? 1 : 0);

  const handleResumeUnit = () => {
    loadAndPlayUnit(nextRecommendedUnit, nextUnitData?.lastPositionMs || 0, true);
    onNavigate('player');
  };

  return (
    <div className="bg-white border border-sand-200 rounded-3xl p-6 sm:p-8 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-radial from-ocean-100/50 to-transparent rounded-full pointer-events-none opacity-60" />

      <div className="space-y-3 max-w-xl z-10">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-xs font-bold shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
            <span>{streakDays} {dict.progress.streakDays} • {dict.progress.streakHeroBadge}</span>
          </div>

          {/* Sync Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sand-100/80 border border-sand-200 rounded-full text-[11px] font-medium text-slate-600">
            {isSyncing ? (
              <>
                <RefreshCw className="w-3 h-3 text-ocean-600 animate-spin" />
                <span>{dict.progress.syncingProgress}</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span>{dict.progress.progressSynced}</span>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-ocean-700 mb-0.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{dict.progress.levelA1Heading}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {dict.progress.title}
          </h1>
        </div>

        <p className="text-sm text-slate-500 leading-relaxed">
          {dict.progress.subtitle}
        </p>

        {/* Secondary Quick Action Links */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onNavigate('vocabulary')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sand-100 hover:bg-sand-200 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-xl border border-sand-200 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-ocean-600" />
            <span>{dict.progress.practiceVocabulary}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('library')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sand-100 hover:bg-sand-200 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-xl border border-sand-200 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>{dict.progress.exploreLibrary}</span>
          </button>
        </div>
      </div>

      {/* Main Resume Hero Box */}
      <div className="bg-sand-50/90 border border-sand-200 rounded-2xl p-5 flex items-center justify-between gap-4 min-w-[280px] z-10 shadow-2xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">
            {dict.progress.quickActions}
          </span>
          <div className="text-base font-extrabold text-slate-900 mt-0.5">
            {dict.progress.unitUnitPrefix} {nextRecommendedUnit}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {hasStarted
              ? `${Math.round((nextUnitData?.lastPositionMs || 0) / 60000)} ${dict.progress.minutesFormat}`
              : dict.progress.readyToStart}
          </div>
        </div>

        <button
          type="button"
          onClick={handleResumeUnit}
          className="px-4 py-2.5 bg-ocean-600 hover:bg-ocean-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-soft hover:shadow-hover flex items-center gap-2 transition-all cursor-pointer select-none"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{hasStarted ? dict.progress.resumeButton : dict.progress.startListening}</span>
        </button>
      </div>
    </div>
  );
};
