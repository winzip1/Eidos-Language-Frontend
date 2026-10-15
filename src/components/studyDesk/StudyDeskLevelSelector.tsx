/**
 * Eidos Language OS - Study Desk Hierarchical Folder Hierarchy (Seviye Klasör Mimarisi)
 * Coordinates 6 CEFR level folders (A1 - C2, 30 lessons each).
 * Replaces disconnected level selector and detached 30-lesson list with an intuitive accordion folder tree.
 * Clicking a level expands the folder to reveal nested lessons directly inside.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import type { UnitSummary, AppView } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useCourse } from '../../context/CourseContext';
import { useAuth } from '../../context/AuthContext';
import { StudyDeskFolderCard } from './StudyDeskFolderCard';
import { StudyDeskLessonList } from './StudyDeskLessonList';

export interface StudyDeskLevelSelectorProps {
  units?: UnitSummary[];
  onSelectUnit?: (unitNumber: number, positionMs?: number) => void;
  onNavigate: (view: AppView) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

interface LevelItem {
  id: string;
  code: string;
  titleKey: string;
  descKey: string;
  isAvailable: boolean;
  totalUnits: number;
}

export const StudyDeskLevelSelector: React.FC<StudyDeskLevelSelectorProps> = ({
  units = [],
  onSelectUnit,
  onNavigate,
  searchQuery,
  onSearchChange,
  isLoading = false,
  error = null,
  onRetry,
  className = '',
}) => {
  const { dict } = useDictionary();
  const { activeCourse, setActiveCourse } = useCourse();
  const { progress } = useAuth();

  const currentLevelId = activeCourse?.levelId || 'level1';
  const [expandedLevelId, setExpandedLevelId] = useState<string>(currentLevelId);

  // Sync expanded folder when active course level changes from header or modal
  useEffect(() => {
    if (activeCourse?.levelId) {
      setExpandedLevelId(activeCourse.levelId);
    }
  }, [activeCourse?.levelId]);

  const checkLevelAvailable = (lvlId: string): boolean => {
    const found = activeCourse?.levels?.find((l) => l.id === lvlId);
    return found ? Boolean(found.isAvailable) : false;
  };

  const getLevelUnits = (lvlId: string, fallback: number): number => {
    const found = activeCourse?.levels?.find((l) => l.id === lvlId);
    return found?.totalUnits || fallback;
  };

  const hasLevelPlus = Boolean(activeCourse?.levels?.some((l) => l.id === 'level-plus'));

  const starterLevels: LevelItem[] = [
    {
      id: 'level1',
      code: 'A1',
      titleKey: dict.studyDesk.levelA1Title,
      descKey: dict.studyDesk.levelA1Desc,
      isAvailable: checkLevelAvailable('level1'),
      totalUnits: getLevelUnits('level1', 30),
    },
    {
      id: 'level2',
      code: 'A2',
      titleKey: dict.studyDesk.levelA2Title,
      descKey: dict.studyDesk.levelA2Desc,
      isAvailable: checkLevelAvailable('level2'),
      totalUnits: getLevelUnits('level2', 30),
    },
    {
      id: 'level3',
      code: 'B1',
      titleKey: dict.studyDesk.levelB1Title,
      descKey: dict.studyDesk.levelB1Desc,
      isAvailable: checkLevelAvailable('level3'),
      totalUnits: getLevelUnits('level3', 30),
    },
  ];

  const advancedLevels: LevelItem[] = [
    {
      id: 'level4',
      code: 'B2',
      titleKey: dict.studyDesk.levelB2Title,
      descKey: dict.studyDesk.levelB2Desc,
      isAvailable: checkLevelAvailable('level4'),
      totalUnits: getLevelUnits('level4', 30),
    },
    {
      id: 'level5',
      code: 'C1',
      titleKey: dict.studyDesk.levelC1Title,
      descKey: dict.studyDesk.levelC1Desc,
      isAvailable: checkLevelAvailable('level5'),
      totalUnits: getLevelUnits('level5', 30),
    },
    ...(hasLevelPlus
      ? [
          {
            id: 'level-plus',
            code: 'Plus',
            titleKey: dict.activeCourse.germanLevelPlus,
            descKey: dict.studyDesk.levelC1Desc,
            isAvailable: checkLevelAvailable('level-plus'),
            totalUnits: getLevelUnits('level-plus', 10),
          },
        ]
      : [
          {
            id: 'level6',
            code: 'C2',
            titleKey: dict.studyDesk.levelC2Title,
            descKey: dict.studyDesk.levelC2Desc,
            isAvailable: checkLevelAvailable('level6'),
            totalUnits: getLevelUnits('level6', 30),
          },
        ]),
  ];

  const handleToggleLevel = (level: LevelItem) => {
    if (expandedLevelId === level.id) {
      // Allow collapsing the open folder
      setExpandedLevelId('');
    } else {
      setExpandedLevelId(level.id);
      if (level.isAvailable && activeCourse && activeCourse.levelId !== level.id) {
        setActiveCourse(activeCourse.courseId, level.id);
      }
    }
  };

  const renderLevelFolder = (level: LevelItem) => {
    const isExpanded = expandedLevelId === level.id;
    const isCurrent = currentLevelId === level.id;
    const completedUnitsCount = isCurrent ? progress?.completedUnitsCount || 0 : 0;

    return (
      <StudyDeskFolderCard
        key={level.id}
        levelId={level.id}
        levelCode={level.code}
        title={level.titleKey}
        description={level.descKey}
        isAvailable={level.isAvailable}
        totalUnits={level.totalUnits}
        completedUnitsCount={completedUnitsCount}
        isExpanded={isExpanded}
        isCurrentLevel={isCurrent}
        onToggleExpand={() => handleToggleLevel(level)}
      >
        {/* Nested Lesson List Container when folder is open and available */}
        {level.isAvailable && onSelectUnit && (
          <StudyDeskLessonList
            units={units}
            onSelectUnit={onSelectUnit}
            onNavigate={onNavigate}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            isLoading={isLoading}
            nested={true}
            error={error}
            onRetry={onRetry}
          />
        )}
      </StudyDeskFolderCard>
    );
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Active Language Hub Bar */}
      <div className="bg-white border border-sand-200/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 shadow-soft-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-sand-100 border border-sand-200 flex items-center justify-center text-xl shrink-0">
            {activeCourse?.flag || '🌐'}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              {dict.languageHub.activeLanguageLabel}
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                {activeCourse?.courseTitle || dict.studyDesk.activeCourseBadge}
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                • {dict.studyDesk.levelTotalLessons}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('languageHub')}
          className="px-3.5 py-2 min-h-[44px] bg-sand-50 hover:bg-sand-100 active:scale-95 text-slate-700 font-bold text-xs rounded-xl border border-sand-200/80 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Globe className="w-3.5 h-3.5 text-ocean-600" />
          <span>{dict.studyDesk.changeLanguageAction}</span>
        </button>
      </div>

      {/* Package 1: Starter Package (A1 - B1) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
            {dict.studyDesk.starterPackageTitle}
          </h3>
          <span className="px-2 py-0.5 bg-sand-100 text-slate-600 rounded-md text-[11px] font-semibold">
            {dict.studyDesk.starterPackageSubtitle}
          </span>
        </div>
        <div className="space-y-2.5">
          {starterLevels.map(renderLevelFolder)}
        </div>
      </div>

      {/* Package 2: Advanced Package (B2 - C2) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 px-1">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
            {dict.studyDesk.advancedPackageTitle}
          </h3>
          <span className="px-2 py-0.5 bg-sand-100 text-slate-600 rounded-md text-[11px] font-semibold">
            {dict.studyDesk.advancedPackageSubtitle}
          </span>
        </div>
        <div className="space-y-2.5">
          {advancedLevels.map(renderLevelFolder)}
        </div>
      </div>
    </div>
  );
};
