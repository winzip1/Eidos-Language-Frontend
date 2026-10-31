/**
 * Eidos Language OS - Study Desk Level Folders View (2. Kademe - Seçili Dilin Seviye Klasörleri)
 * Presents the selected language's CEFR level folders (A1 - C1/Plus) in a single clean, accordion-free layout.
 * Clicking any level folder enters that level directly (viewStep = 'units') to display its 30 lessons.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React from 'react';
import { FolderOpen } from 'lucide-react';
import type { LanguageCourseMeta, DictionaryBundle } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useCourse } from '../../context/CourseContext';
import { useAuth } from '../../context/AuthContext';
import { StudyDeskFolderCard } from './StudyDeskFolderCard';
import { resolveLocalizedLanguageName } from './StudyDeskLanguageGrid';

export interface LevelFolderItem {
  id: string;
  code: string;
  title: string;
  description: string;
  isAvailable: boolean;
  totalUnits: number;
}

export interface StudyDeskLevelSelectorProps {
  course: LanguageCourseMeta;
  onSelectLevel: (level: LevelFolderItem) => void;
  className?: string;
}

/**
 * Builds the unified 6-level folder list (A1 to C1/Plus or C2) for a given course.
 */
export function buildCourseLevelFolders(
  course: LanguageCourseMeta,
  dict: DictionaryBundle
): LevelFolderItem[] {
  const findCourseLevel = (lvlId: string, cefrCode: string) => {
    return (
      course.levels.find((l) => l.id === lvlId) ||
      course.levels.find((l) => l.cefrLevel.toUpperCase() === cefrCode.toUpperCase())
    );
  };

  const checkAvailable = (lvlId: string, cefrCode: string): boolean => {
    if (!course.isAvailable) return false;
    const found = findCourseLevel(lvlId, cefrCode);
    return found ? Boolean(found.isAvailable) : false;
  };

  const getUnits = (lvlId: string, cefrCode: string, fallback: number): number => {
    const found = findCourseLevel(lvlId, cefrCode);
    return found?.totalUnits || fallback;
  };

  const hasLevelPlus = Boolean(course.levels.some((l) => l.id === 'level-plus'));

  return [
    {
      id: 'level1',
      code: 'A1',
      title: dict.studyDesk.levelA1Title,
      description: dict.studyDesk.levelA1Desc,
      isAvailable: checkAvailable('level1', 'A1'),
      totalUnits: getUnits('level1', 'A1', 30),
    },
    {
      id: 'level2',
      code: 'A2',
      title: dict.studyDesk.levelA2Title,
      description: dict.studyDesk.levelA2Desc,
      isAvailable: checkAvailable('level2', 'A2'),
      totalUnits: getUnits('level2', 'A2', 30),
    },
    {
      id: 'level3',
      code: 'B1',
      title: dict.studyDesk.levelB1Title,
      description: dict.studyDesk.levelB1Desc,
      isAvailable: checkAvailable('level3', 'B1'),
      totalUnits: getUnits('level3', 'B1', 30),
    },
    {
      id: 'level4',
      code: 'B2',
      title: dict.studyDesk.levelB2Title,
      description: dict.studyDesk.levelB2Desc,
      isAvailable: checkAvailable('level4', 'B2'),
      totalUnits: getUnits('level4', 'B2', 30),
    },
    {
      id: 'level5',
      code: 'C1',
      title: dict.studyDesk.levelC1Title,
      description: dict.studyDesk.levelC1Desc,
      isAvailable: checkAvailable('level5', 'C1'),
      totalUnits: getUnits('level5', 'C1', 30),
    },
    hasLevelPlus
      ? {
          id: 'level-plus',
          code: 'Plus',
          title: dict.activeCourse.germanLevelPlus,
          description: dict.studyDesk.levelC1Desc,
          isAvailable: checkAvailable('level-plus', 'Plus'),
          totalUnits: getUnits('level-plus', 'Plus', 10),
        }
      : {
          id: 'level6',
          code: 'C2',
          title: dict.studyDesk.levelC2Title,
          description: dict.studyDesk.levelC2Desc,
          isAvailable: checkAvailable('level6', 'C2'),
          totalUnits: getUnits('level6', 'C2', 30),
        },
  ];
}

export const StudyDeskLevelSelector: React.FC<StudyDeskLevelSelectorProps> = ({
  course,
  onSelectLevel,
  className = '',
}) => {
  const { dict } = useDictionary();
  const { activeCourse } = useCourse();
  const { progress } = useAuth();

  const localizedLanguageName = resolveLocalizedLanguageName(course, dict);
  const levelFolders = buildCourseLevelFolders(course, dict);

  const isThisCourseActive =
    activeCourse.courseId === course.id || activeCourse.languageId === course.languageId;

  const headingText = dict.studyDesk.levelsFolderTitle.replace(
    '{language}',
    localizedLanguageName
  );

  return (
    <section className={`space-y-4 ${className}`} aria-label={headingText}>
      {/* Clean Level Folders Header */}
      <div className="px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-ocean-600 shrink-0" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {course.flag} {headingText}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {dict.studyDesk.levelsFolderSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 bg-sand-100 text-slate-700 rounded-xl text-xs font-bold">
            {dict.studyDesk.totalLevelsBadge.replace('{count}', String(levelFolders.length))}
          </span>
        </div>
      </div>

      {/* Unified Accordion-Free Level Folders List */}
      <div className="space-y-2.5">
        {levelFolders.map((level) => {
          const isCurrent = isThisCourseActive && activeCourse.levelId === level.id;
          const completedUnitsCount = isCurrent ? progress?.completedUnitsCount || 0 : 0;

          return (
            <StudyDeskFolderCard
              key={level.id}
              levelId={level.id}
              levelCode={level.code}
              title={level.title}
              description={level.description}
              isAvailable={level.isAvailable}
              totalUnits={level.totalUnits}
              completedUnitsCount={completedUnitsCount}
              isCurrentLevel={isCurrent}
              onOpenFolder={() => onSelectLevel(level)}
            />
          );
        })}
      </div>
    </section>
  );
};
