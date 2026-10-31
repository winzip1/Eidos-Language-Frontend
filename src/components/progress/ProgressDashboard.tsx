import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import type { AppView } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { QuickResumeCard } from './QuickResumeCard';
import { ProgressStatCards } from './ProgressStatCards';
import { MasteryRadar } from './MasteryRadar';
import { AchievementBadgeGrid } from './AchievementBadgeGrid';
import { RecentProgressList } from './RecentProgressList';
import { UnitProgressGrid } from './UnitProgressGrid';

interface ProgressDashboardProps {
  onNavigate: (view: AppView) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ onNavigate }) => {
  const { dict } = useDictionary();
  const { progress, isLoading, refreshProgress } = useAuth();

  // 1. Loading Skeleton State
  if (isLoading && !progress) {
    return (
      <div className="space-y-6 animate-pulse pb-12">
        {/* Banner Skeleton */}
        <div className="bg-sand-100 rounded-3xl h-44 border border-sand-200" />

        {/* 4 Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-sand-100 rounded-3xl h-28 border border-sand-200" />
          ))}
        </div>

        {/* Radar Skeleton */}
        <div className="bg-sand-100 rounded-3xl h-80 border border-sand-200" />

        {/* Badges Skeleton */}
        <div className="bg-sand-100 rounded-3xl h-64 border border-sand-200" />

        {/* Recent Skeleton */}
        <div className="bg-sand-100 rounded-3xl h-48 border border-sand-200" />

        {/* Units Grid Skeleton */}
        <div className="bg-sand-100 rounded-3xl h-56 border border-sand-200" />
      </div>
    );
  }

  // 2. Fail-Loud Error State
  if (!isLoading && !progress) {
    return (
      <div className="bg-white border border-rose-200 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-soft my-12 space-y-4 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          {dict.errors.networkError}
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          {dict.progress.emptyProgressNotice}
        </p>
        <button
          type="button"
          onClick={() => refreshProgress()}
          className="px-5 py-2.5 bg-ocean-600 hover:bg-ocean-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-soft inline-flex items-center gap-2 transition-all cursor-pointer select-none"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{dict.buttons.retry}</span>
        </button>
      </div>
    );
  }

  // 3. Complete Analytics Dashboard View
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header Banner & Quick Resume Hero */}
      <QuickResumeCard onNavigate={onNavigate} />

      {/* 2. Key Metrics - 4 Luxury Yacht Deck Cards */}
      <ProgressStatCards />

      {/* 3. Dual Mode Mastery Radar (10-Unit Polygon & 5-Axis CEFR Competency Radar) */}
      <MasteryRadar onNavigate={onNavigate} />

      {/* 4. Achievement Badges & Milestones Showcase */}
      <AchievementBadgeGrid />

      {/* 5. Recent Learning Activities */}
      <RecentProgressList onNavigate={onNavigate} />

      {/* 6. 10-Unit Complete Progress Breakdown Grid */}
      <UnitProgressGrid onNavigate={onNavigate} />
    </div>
  );
};
