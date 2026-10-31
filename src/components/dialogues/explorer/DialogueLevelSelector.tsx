/**
 * Eidos Language OS - Dialogue Explorer Level Selector (2. Kademe: Dil Kurları Klasörleri)
 * Displays the selected language's CEFR levels (A1 - C2) in a clean, accordion-free layout.
 * Clicking a level folder immediately enters its 30 lessons (step 3).
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React, { useMemo } from 'react';
import { FolderOpen, ChevronRight, Lock, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import type { LanguageCourseMeta } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';
import { resolveLocalizedLanguageName } from '../../studyDesk/StudyDeskLanguageGrid';
import { buildCourseLevelFolders, type LevelFolderItem } from '../../studyDesk/StudyDeskLevelSelector';

export interface DialogueLevelSelectorProps {
  course: LanguageCourseMeta;
  onSelectLevel: (level: LevelFolderItem) => void;
  onBackToLanguages: () => void;
  className?: string;
}

export const DialogueLevelSelector: React.FC<DialogueLevelSelectorProps> = ({
  course,
  onSelectLevel,
  onBackToLanguages,
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  const localizedLanguageName = useMemo(() => {
    return resolveLocalizedLanguageName(course, dict);
  }, [course, dict]);

  const levelFolders = useMemo<LevelFolderItem[]>(() => {
    return buildCourseLevelFolders(course, dict);
  }, [course, dict]);

  return (
    <section
      data-testid="dialogue-level-selector"
      aria-label={dh.levelsTitle.replace('{language}', localizedLanguageName)}
      className={`space-y-4 ${className}`}
    >
      {/* Header Banner */}
      <div className="bg-white border border-sand-200/90 rounded-2xl p-4 sm:p-5 shadow-soft-xs space-y-1">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-ocean-600 shrink-0" />
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            {dh.levelsTitle.replace('{language}', localizedLanguageName)}
          </h2>
          {course.flag && (
            <span className="text-lg leading-none shrink-0 ml-1">{course.flag}</span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          {dh.levelsSubtitle}
        </p>
      </div>

      {/* Level Folder Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {levelFolders.map((level) => {
          const isLevelAvailable = course.isAvailable && level.isAvailable;
          const lessonsCountBadge = dict.studyDesk.totalLessonsBadge.replace(
            '{count}',
            String(level.totalUnits || 30)
          );

          const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (isLevelAvailable) {
                onSelectLevel(level);
              }
            }
          };

          return (
            <div
              key={level.id}
              data-testid={`dialogue-level-card-${level.id}`}
              tabIndex={isLevelAvailable ? 0 : -1}
              role="button"
              aria-label={`${level.code} ${level.title}`}
              aria-disabled={!isLevelAvailable}
              onClick={() => {
                if (isLevelAvailable) {
                  onSelectLevel(level);
                }
              }}
              onKeyDown={handleKeyDown}
              className={`group relative bg-white border rounded-2xl p-4 sm:p-5 shadow-soft-xs transition-all select-none min-h-[44px] flex flex-col justify-between gap-3 ${
                isLevelAvailable
                  ? 'border-sand-200/90 hover:border-ocean-300 hover:shadow-soft-md cursor-pointer active:scale-[0.99]'
                  : 'border-sand-200/60 opacity-80 cursor-not-allowed bg-sand-50/40'
              }`}
            >
              {/* Top Row: CEFR Badge, Title, Status */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm sm:text-base shadow-soft-xs shrink-0 transition-transform ${
                      isLevelAvailable
                        ? 'bg-ocean-50 text-ocean-800 border border-ocean-200/80 group-hover:scale-105'
                        : 'bg-sand-100 text-slate-400 border border-sand-200'
                    }`}
                  >
                    {level.code}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                      {level.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                      {level.description}
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="shrink-0">
                  {isLevelAvailable ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-extrabold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lessonsCountBadge}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sand-100 text-slate-500 border border-sand-200 text-[11px] font-semibold">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>{dict.studyDesk.comingSoonBadge}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Row: Metadata badges & Open Folder Button */}
              <div className="pt-2 border-t border-sand-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold text-slate-600">
                  {isLevelAvailable && (
                    <>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sand-50 border border-sand-200/60 text-[11px]">
                        <BookOpen className="w-3 h-3 text-slate-500" />
                        <span>{lessonsCountBadge}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-ocean-50 text-ocean-700 border border-ocean-200/60 text-[11px] font-bold">
                        <Sparkles className="w-3 h-3 text-ocean-600" />
                        <span>{dh.hasAudioBadge}</span>
                      </span>
                    </>
                  )}
                </div>

                {isLevelAvailable ? (
                  <div className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-ocean-700 group-hover:text-ocean-800 transition-colors ml-auto min-h-[44px]">
                    <span>{dh.allLessonsTab}</span>
                    <ChevronRight className="w-4 h-4 text-ocean-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ) : (
                  <span className="text-xs font-medium text-slate-400 ml-auto">
                    {dict.studyDesk.comingSoonBadge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
