/**
 * Eidos Language OS - Luxury Language Course Card Component
 * Displays language pack, CEFR tracks, progress rate, metrics, and level switching.
 * ZERO HARDCODE & STRICTLY LIGHT MODE.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Headphones,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BarChart3,
  Clock,
  PlusCircle,
} from 'lucide-react';
import type { LanguageCourseMeta, AppView, ActiveLanguageState } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { CourseLevelSelector } from './CourseLevelSelector';

interface LanguageCourseCardProps {
  course: LanguageCourseMeta;
  activeCourse: ActiveLanguageState;
  onSelectCourse: (courseId: string, levelId: string) => boolean | void;
  onNavigate: (view: AppView) => void;
  onRequestTrack?: (courseName: string, levelName: string) => void;
}

export const LanguageCourseCard: React.FC<LanguageCourseCardProps> = ({
  course,
  activeCourse,
  onSelectCourse,
  onNavigate,
  onRequestTrack,
}) => {
  const { dict } = useDictionary();
  const { progress } = useAuth();

  const isThisCourseActive = activeCourse.courseId === course.id;

  // Selected level state within this card (defaults to active level if current course, or first available level)
  const [selectedLevelId, setSelectedLevelId] = useState<string>(() => {
    if (isThisCourseActive && activeCourse.levelId) {
      return activeCourse.levelId;
    }
    const firstAvail = course.levels.find((l) => l.isAvailable);
    return firstAvail ? firstAvail.id : course.levels[0]?.id || '';
  });

  // Sync selected level if active course changes externally
  useEffect(() => {
    if (isThisCourseActive && activeCourse.levelId) {
      setSelectedLevelId(activeCourse.levelId);
    }
  }, [isThisCourseActive, activeCourse.levelId]);

  const selectedLevel = useMemo(() => {
    return (
      course.levels.find((l) => l.id === selectedLevelId) ||
      course.levels.find((l) => l.isAvailable) ||
      course.levels[0]
    );
  }, [course.levels, selectedLevelId]);

  const isLevelActive = isThisCourseActive && activeCourse.levelId === selectedLevel?.id;

  // Calculate progress for active course
  const progressInfo = useMemo(() => {
    if (!isThisCourseActive || !progress) {
      return {
        completedCount: 0,
        completionRate: 0,
        totalUnits: selectedLevel?.totalUnits || 30,
        hasActivity: false,
      };
    }

    const completed = progress.completedUnitsCount || 0;
    const total = selectedLevel?.totalUnits || progress.totalUnits || 30;
    const rate = progress.overallCompletionRate || Math.round((completed / total) * 100);

    return {
      completedCount: completed,
      completionRate: Math.min(100, Math.max(0, rate)),
      totalUnits: total,
      hasActivity: completed > 0 || (progress.totalListenedMinutes || 0) > 0,
    };
  }, [isThisCourseActive, progress, selectedLevel]);

  const handleActionClick = () => {
    if (isLevelActive) {
      onNavigate('studyDesk');
    } else if (selectedLevel?.isAvailable) {
      const res = onSelectCourse(course.id, selectedLevel.id);
      if (res !== false) {
        onNavigate('studyDesk');
      }
    } else if (onRequestTrack) {
      onRequestTrack(course.languageName, selectedLevel?.cefrLevel || 'A1');
    }
  };

  return (
    <div
      className={`rounded-3xl bg-white border transition-all relative flex flex-col justify-between overflow-hidden ${
        isThisCourseActive
          ? 'border-ocean-300 ring-2 ring-ocean-100 shadow-soft'
          : 'border-sand-200 hover:border-slate-300 shadow-2xs hover:shadow-soft'
      }`}
    >
      {/* Top Banner Ribbon for Active Course */}
      {isThisCourseActive && (
        <div className="bg-gradient-to-r from-ocean-500 via-ocean-600 to-ocean-700 py-1.5 px-4 text-white text-[11px] font-bold flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-ocean-100" />
            {dict.languageHub.currentlyActiveBadge}
          </span>
          <span className="text-[10px] text-ocean-100 font-medium bg-white/15 px-2 py-0.5 rounded-full">
            {activeCourse.levelTitle}
          </span>
        </div>
      )}

      {/* Main Card Body */}
      <div className="p-6 space-y-5">
        {/* Header: Flag, Name, Native Name & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <span className="text-4xl p-2.5 rounded-2xl bg-sand-100/90 border border-sand-200 select-none shadow-2xs flex items-center justify-center">
              {course.flag}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  {course.languageName}
                </h3>
                {!course.isAvailable && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    {dict.languageHub.comingSoonBadge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {course.nativeLanguageName}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          {course.description}
        </p>

        {/* CEFR Level Selector Tracks */}
        <CourseLevelSelector
          levels={course.levels}
          selectedLevelId={selectedLevelId}
          onSelectLevel={setSelectedLevelId}
          isCourseActive={isThisCourseActive}
          activeLevelId={activeCourse.levelId}
        />

        {/* Course Progress & Curriculum Specs */}
        <div className="bg-sand-50/80 rounded-2xl p-4 border border-sand-200/90 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-ocean-600" />
              <span>
                {selectedLevel?.totalUnits || 30} {dict.languageHub.unitsSuffix}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {selectedLevel?.totalAudioDurationMs
                  ? `~${Math.round(selectedLevel.totalAudioDurationMs / 3600000)} ${dict.languageHub.hoursShort}`
                  : `~15 ${dict.languageHub.hoursShort}`}
              </span>
            </div>
          </div>

          {/* Progress Bar (Only for Available / Active course) */}
          {isThisCourseActive && (
            <div className="space-y-1.5 pt-1 border-t border-sand-200/70">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-600 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-ocean-600" />
                  {dict.languageHub.completionRateLabel}
                </span>
                <span className="font-extrabold text-ocean-700">
                  {dict.languageHub.progressPercent.replace('{percent}', String(progressInfo.completionRate))}
                </span>
              </div>
              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-ocean-500 to-ocean-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressInfo.completionRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-sand-50/50 border-t border-sand-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium truncate">
          <Headphones className="w-3.5 h-3.5 text-ocean-500 shrink-0" />
          <span className="truncate">
            {selectedLevel?.name || course.languageName}
          </span>
        </div>

        {isLevelActive ? (
          <button
            type="button"
            onClick={handleActionClick}
            className="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500 shrink-0"
          >
            <span>{dict.languageHub.exploreUnitsButton}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : selectedLevel?.isAvailable ? (
          <button
            type="button"
            onClick={handleActionClick}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-soft transition-all flex items-center gap-2 cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-ocean-300" />
            <span>{dict.languageHub.selectAndGoStudyDesk}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleActionClick}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{dict.languageHub.voteForTrack}</span>
          </button>
        )}
      </div>
    </div>
  );
};
