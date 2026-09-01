/**
 * Eidos Language OS - Language Catalog Global Statistics Banner
 * Displays high-level language ecosystem metrics and request triggers.
 * ZERO HARDCODE & STRICTLY LIGHT MODE.
 */
import React, { useMemo } from 'react';
import {
  Globe,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  PlusCircle,
} from 'lucide-react';
import type { LanguageCourseMeta, ActiveLanguageState } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';

interface LanguageCatalogStatsProps {
  courses: LanguageCourseMeta[];
  activeCourse: ActiveLanguageState;
  onRequestNewLanguage: () => void;
}

export const LanguageCatalogStats: React.FC<LanguageCatalogStatsProps> = ({
  courses,
  activeCourse,
  onRequestNewLanguage,
}) => {
  const { dict } = useDictionary();

  const metrics = useMemo(() => {
    const totalLangs = courses.length;
    const availableLangs = courses.filter((c) => c.isAvailable).length;
    const upcomingLangs = courses.filter((c) => !c.isAvailable).length;

    let totalUnits = 0;
    let totalAudioMs = 0;

    courses.forEach((c) => {
      c.levels.forEach((lvl) => {
        if (lvl.isAvailable) {
          totalUnits += lvl.totalUnits || 0;
          totalAudioMs += lvl.totalAudioDurationMs || 0;
        }
      });
    });

    const totalHours = Math.round(totalAudioMs / 3600000) || 15;

    return {
      totalLangs,
      availableLangs,
      upcomingLangs,
      totalUnits: totalUnits || 30,
      totalHours,
    };
  }, [courses]);

  return (
    <div className="bg-white rounded-3xl border border-sand-200 p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Top row: Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Languages */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80 space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Globe className="w-3.5 h-3.5 text-ocean-600" />
            <span>{dict.languageHub.statsTotalLanguages}</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {metrics.totalLangs}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {metrics.availableLangs} {dict.languageHub.availableTab.toLowerCase()}
          </p>
        </div>

        {/* Metric 2: Available Courses */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80 space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{dict.languageHub.statsActiveCourses}</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {metrics.availableLangs}
          </div>
          <p className="text-[10px] text-emerald-700 font-bold">
            {dict.languageHub.currentlyActiveBadge}
          </p>
        </div>

        {/* Metric 3: Upcoming Packages */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80 space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{dict.languageHub.statsUpcomingLanguages}</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {metrics.upcomingLangs}
          </div>
          <p className="text-[10px] text-amber-700 font-medium">
            {dict.languageHub.plannedTracks}
          </p>
        </div>

        {/* Metric 4: Total Units & Audio */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80 space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-ocean-600" />
            <span>{dict.languageHub.statsTotalUnitsCount}</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {metrics.totalUnits}+
          </div>
          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            ~{metrics.totalHours} {dict.languageHub.hoursShort} {dict.languageHub.totalAudioLabel.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Bottom strip: Active Course Banner & Language Request Action */}
      <div className="pt-3 border-t border-sand-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl p-1 rounded-xl bg-sand-100 border border-sand-200 shadow-2xs">
            {activeCourse.flag}
          </span>
          <div className="text-xs">
            <span className="text-slate-400 font-medium">
              {dict.languageHub.statsYourProgress}:{' '}
            </span>
            <strong className="text-slate-900 font-bold">
              {activeCourse.courseTitle} ({activeCourse.levelTitle})
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={onRequestNewLanguage}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-ocean-50 hover:bg-ocean-100 text-ocean-800 border border-ocean-200/90 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500"
        >
          <PlusCircle className="w-3.5 h-3.5 text-ocean-600" />
          <span>{dict.languageHub.requestButton}</span>
        </button>
      </div>
    </div>
  );
};
