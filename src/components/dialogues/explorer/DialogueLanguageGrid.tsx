/**
 * Eidos Language OS - Dialogue Explorer Language Grid (1. Kademe: Diller Kök Klasörleri)
 * Displays available languages in high-craft yacht-deck folder cards.
 * Clicking a language immediately enters its level folders (step 2) with zero accordions.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React from 'react';
import { Folder, ChevronRight, CheckCircle2, Lock, Sparkles, BookOpen } from 'lucide-react';
import type { LanguageCourseMeta, ActiveLanguageState } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';
import { resolveLocalizedLanguageName } from '../../studyDesk/StudyDeskLanguageGrid';
import { LoadingSkeleton } from '../../common/LoadingSkeleton';

export interface DialogueLanguageGridProps {
  courses: LanguageCourseMeta[];
  activeCourse: ActiveLanguageState;
  onSelectLanguage: (course: LanguageCourseMeta) => void;
  isLoading?: boolean;
  className?: string;
}

export const DialogueLanguageGrid: React.FC<DialogueLanguageGridProps> = ({
  courses,
  activeCourse,
  onSelectLanguage,
  isLoading = false,
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  if (isLoading && courses.length === 0) {
    return (
      <div className={`space-y-3.5 ${className}`}>
        <LoadingSkeleton variant="card" className="h-28 w-full rounded-2xl" />
        <LoadingSkeleton variant="card" className="h-28 w-full rounded-2xl" />
        <LoadingSkeleton variant="card" className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <section
      data-testid="dialogue-language-grid"
      aria-label={dh.rootTitle}
      className={`space-y-4 ${className}`}
    >
      {/* Header Banner */}
      <div className="bg-white border border-sand-200/90 rounded-2xl p-4 sm:p-5 shadow-soft-xs space-y-1">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-ocean-600 shrink-0" />
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            {dh.rootTitle}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          {dh.rootSubtitle}
        </p>
      </div>

      {/* Language Folders List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {courses.map((course) => {
          const isCurrentActive =
            activeCourse.courseId === course.id || activeCourse.languageId === course.languageId;
          const localizedName = resolveLocalizedLanguageName(course, dict);

          const levelsCount =
            course.languageId === 'german' ? 6 : Math.max(course.levels.length, 6);
          const totalLessons = course.levels.reduce(
            (acc, lvl) => acc + (lvl.totalUnits || 0),
            0
          );

          const levelsBadge = dict.studyDesk.totalLevelsBadge.replace(
            '{count}',
            String(levelsCount)
          );
          const lessonsBadge = dict.studyDesk.totalLessonsBadge.replace(
            '{count}',
            String(totalLessons)
          );

          const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectLanguage(course);
            }
          };

          return (
            <div
              key={course.id}
              data-testid={`dialogue-lang-card-${course.languageId}`}
              tabIndex={0}
              role="button"
              aria-label={localizedName}
              onClick={() => onSelectLanguage(course)}
              onKeyDown={handleKeyDown}
              className={`group relative bg-white border rounded-2xl p-4 sm:p-5 shadow-soft-xs hover:shadow-soft-md transition-all cursor-pointer select-none active:scale-[0.99] min-h-[44px] flex flex-col justify-between gap-3 ${
                isCurrentActive
                  ? 'border-ocean-300 ring-2 ring-ocean-100 bg-gradient-to-br from-white via-ocean-50/20 to-white'
                  : 'border-sand-200/90 hover:border-ocean-200'
              }`}
            >
              {/* Top Row: Flag, Name, Active Badge */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-sand-50 border border-sand-200/80 flex items-center justify-center text-2xl shadow-soft-xs shrink-0 group-hover:scale-105 transition-transform">
                    {course.flag}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                        {localizedName}
                      </h3>
                      {course.languageName &&
                        course.languageName.toLowerCase() !== localizedName.toLowerCase() && (
                          <span className="text-xs font-semibold text-slate-400">
                            ({course.languageName})
                          </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {course.description || course.nativeLanguageName}
                    </p>
                  </div>
                </div>

                {/* Right Status Badge */}
                <div className="shrink-0">
                  {isCurrentActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-extrabold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{dict.badges.active}</span>
                    </span>
                  ) : !course.isAvailable ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sand-100 text-slate-500 border border-sand-200 text-[11px] font-semibold">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>{dict.studyDesk.comingSoonBadge}</span>
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Bottom Row: Metadata chips & Open Folder CTA */}
              <div className="pt-2 border-t border-sand-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold text-slate-600">
                  <span className="px-2 py-0.5 rounded-lg bg-sand-50 border border-sand-200/60">
                    {levelsBadge}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-sand-50 border border-sand-200/60">
                    {lessonsBadge}
                  </span>
                  {course.languageId === 'german' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-ocean-50 text-ocean-700 border border-ocean-200/60 text-[11px] font-bold">
                      <Sparkles className="w-3 h-3 text-ocean-600" />
                      <span>{dh.hasAudioBadge}</span>
                    </span>
                  )}
                </div>

                <div className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-ocean-700 group-hover:text-ocean-800 transition-colors ml-auto min-h-[44px]">
                  <span>{dh.levelsTitle.replace('{language}', localizedName)}</span>
                  <ChevronRight className="w-4 h-4 text-ocean-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
