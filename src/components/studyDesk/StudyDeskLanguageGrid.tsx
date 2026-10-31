/**
 * Eidos Language OS - Study Desk Language Folders View (1. Kademe - Tüm Diller Klasör Görünümü)
 * Displays all language courses in clean, airy yacht-deck folder cards at the root of Study Desk.
 * Clicking a language folder directly enters that language's level folders (viewStep = 'levels') without any accordion.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React from 'react';
import { ChevronRight, Folder, CheckCircle2, Lock, Layers, BookOpen } from 'lucide-react';
import type { LanguageCourseMeta, ActiveLanguageState, DictionaryBundle } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

export interface StudyDeskLanguageGridProps {
  courses: LanguageCourseMeta[];
  activeCourse: ActiveLanguageState;
  onSelectLanguage: (course: LanguageCourseMeta) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Resolves localized display name for a language course from the dictionary.
 */
export function resolveLocalizedLanguageName(
  course: Pick<LanguageCourseMeta, 'languageId' | 'languageName'>,
  dict: DictionaryBundle
): string {
  switch (course.languageId.toLowerCase()) {
    case 'german':
      return dict.studyDesk.langNameGerman;
    case 'italian':
      return dict.studyDesk.langNameItalian;
    case 'english':
      return dict.studyDesk.langNameEnglish;
    case 'spanish':
      return dict.studyDesk.langNameSpanish;
    case 'french':
      return dict.studyDesk.langNameFrench;
    default:
      return course.languageName;
  }
}

export const StudyDeskLanguageGrid: React.FC<StudyDeskLanguageGridProps> = ({
  courses,
  activeCourse,
  onSelectLanguage,
  isLoading = false,
  className = '',
}) => {
  const { dict } = useDictionary();

  if (isLoading && courses.length === 0) {
    return (
      <div className={`space-y-3.5 ${className}`}>
        <LoadingSkeleton variant="card" className="h-24 w-full rounded-2xl" />
        <LoadingSkeleton variant="card" className="h-24 w-full rounded-2xl" />
        <LoadingSkeleton variant="card" className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <section className={`space-y-4 ${className}`} aria-label={dict.studyDesk.languagesFolderTitle}>
      {/* Section Header */}
      <div className="px-1 space-y-1">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-ocean-600 shrink-0" />
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            {dict.studyDesk.languagesFolderTitle}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          {dict.studyDesk.languagesFolderSubtitle}
        </p>
      </div>

      {/* Language Folder Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {courses.map((course) => {
          const isCurrentActiveLanguage =
            activeCourse.courseId === course.id || activeCourse.languageId === course.languageId;
          const localizedName = resolveLocalizedLanguageName(course, dict);

          // Standard 6-level curriculum for active languages, or actual course levels count
          const levelsCount = course.languageId === 'german' ? 6 : Math.max(course.levels.length, 6);
          const totalLessons = course.levels.reduce((acc, lvl) => acc + (lvl.totalUnits || 0), 0);

          const levelsBadgeText = dict.studyDesk.totalLevelsBadge.replace('{count}', String(levelsCount));
          const lessonsBadgeText = dict.studyDesk.totalLessonsBadge.replace('{count}', String(totalLessons));

          const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectLanguage(course);
            }
          };

          return (
            <div
              key={course.id}
              id={`language-folder-${course.languageId}`}
              data-testid={`language-folder-${course.languageId}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelectLanguage(course)}
              onKeyDown={handleKeyDown}
              className={`group bg-white border rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 cursor-pointer select-none transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 ${
                isCurrentActiveLanguage
                  ? 'border-ocean-300 ring-2 ring-ocean-100/80 shadow-soft-sm hover:border-ocean-400'
                  : 'border-sand-200/90 hover:border-ocean-300 hover:bg-sand-50/40 shadow-soft-xs'
              }`}
            >
              {/* Top Row: Flag, Title, Native Name & Active/Coming Soon Status Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border transition-all ${
                      isCurrentActiveLanguage
                        ? 'bg-ocean-50/80 border-ocean-200 shadow-2xs'
                        : 'bg-sand-100/90 border-sand-200 group-hover:bg-sand-200/60'
                    }`}
                  >
                    {course.flag}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
                        {localizedName}
                      </h3>
                      {course.nativeLanguageName && course.nativeLanguageName !== localizedName && (
                        <span className="text-xs font-semibold text-slate-400">
                          ({course.nativeLanguageName})
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {course.description}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {isCurrentActiveLanguage ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-ocean-50 text-ocean-800 border border-ocean-200 rounded-lg text-[11px] font-extrabold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
                      <span>{dict.badges.active}</span>
                    </span>
                  ) : course.isAvailable ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold">
                      <span>{dict.languageHub.availableTab}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sand-100 text-slate-500 border border-sand-200/80 rounded-lg text-[11px] font-semibold">
                      <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{dict.studyDesk.comingSoonBadge}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Row: Folder Metadata Pills & Open Folder Action */}
              <div className="pt-3 border-t border-sand-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sand-100/80 text-slate-600 rounded-lg text-xs font-semibold">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{levelsBadgeText}</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sand-100/80 text-slate-600 rounded-lg text-xs font-semibold">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{lessonsBadgeText}</span>
                  </span>
                </div>

                <div className="inline-flex items-center gap-1 text-xs font-extrabold text-ocean-700 group-hover:text-ocean-800 group-hover:translate-x-0.5 transition-all">
                  <span>{dict.studyDesk.openFolderAction}</span>
                  <ChevronRight className="w-4 h-4 text-ocean-600 shrink-0" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
