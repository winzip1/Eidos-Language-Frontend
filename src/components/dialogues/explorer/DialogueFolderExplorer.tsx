/**
 * Eidos Language OS - Dialogue Folder Explorer (3-Step Drill-Down Orchestrator)
 * Zero-Accordion Folder Architecture for Dialogues:
 * - Step 1 ('languages'): Root view of all language courses (🇩🇪 Almanca, 🇮🇹 İtalyanca, 🇬🇧 İngilizce, etc.)
 * - Step 2 ('levels'): CEFR level folders of the selected language (A1 - C2)
 * - Step 3 ('units'): Focused 30-lesson grid with real table counts & dedicated workspace triggers
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { LanguageCourseMeta, UnitSummary } from '../../../types';
import { apiRequest } from '../../../services/apiClient';
import { useDictionary } from '../../../context/DictionaryContext';
import { useCourse } from '../../../context/CourseContext';
import { DialogueBreadcrumbBar, type DialogueExplorerStep } from './DialogueBreadcrumbBar';
import { DialogueLanguageGrid } from './DialogueLanguageGrid';
import { DialogueLevelSelector } from './DialogueLevelSelector';
import { DialogueLessonGrid } from './DialogueLessonGrid';
import { resolveLocalizedLanguageName } from '../../studyDesk/StudyDeskLanguageGrid';
import { buildCourseLevelFolders, type LevelFolderItem } from '../../studyDesk/StudyDeskLevelSelector';
import { ErrorToast } from '../../common/ErrorToast';

export interface DialogueFolderExplorerProps {
  onSelectLesson?: (unitNumber: number, courseId: string, levelId: string) => void;
  initialStep?: DialogueExplorerStep;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  className?: string;
}

export const DialogueFolderExplorer: React.FC<DialogueFolderExplorerProps> = ({
  onSelectLesson,
  initialStep = 'languages',
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;
  const { activeCourse, availableCourses, setActiveCourse, isLoadingCourses } = useCourse();

  // 3-Step Folder Step State
  const [viewStep, setViewStep] = useState<DialogueExplorerStep>(initialStep);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    activeCourse?.courseId || 'german_pimsleur'
  );
  const [selectedLevelId, setSelectedLevelId] = useState<string>(
    activeCourse?.levelId || 'level1'
  );

  const [units, setUnits] = useState<UnitSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');

  const activeSearchQuery =
    externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = externalOnSearchChange || setInternalSearchQuery;

  // Synchronize selected course metadata with available courses
  const selectedCourse = useMemo<LanguageCourseMeta>(() => {
    return (
      availableCourses.find(
        (c) => c.id === selectedCourseId || c.languageId === selectedCourseId
      ) ||
      availableCourses.find(
        (c) => c.id === activeCourse.courseId || c.languageId === activeCourse.languageId
      ) ||
      availableCourses[0]
    );
  }, [availableCourses, selectedCourseId, activeCourse.courseId, activeCourse.languageId]);

  const levelFolders = useMemo<LevelFolderItem[]>(() => {
    if (!selectedCourse) return [];
    return buildCourseLevelFolders(selectedCourse, dict);
  }, [selectedCourse, dict]);

  const selectedLevelFolder = useMemo<LevelFolderItem | undefined>(() => {
    return levelFolders.find((l) => l.id === selectedLevelId) || levelFolders[0];
  }, [levelFolders, selectedLevelId]);

  const localizedLanguageName = useMemo(() => {
    if (!selectedCourse) return activeCourse?.courseTitle || '';
    return resolveLocalizedLanguageName(selectedCourse, dict);
  }, [selectedCourse, activeCourse?.courseTitle, dict]);

  // Load real units from backend for selected language and level
  const loadUnits = useCallback(async () => {
    if (!selectedCourse) return;
    setIsLoading(true);
    setError(null);

    const langId = selectedCourse.languageId || 'german';
    const lvlId = selectedLevelId || 'level1';

    try {
      const res = await apiRequest<{ units: UnitSummary[]; totalUnits: number }>(
        `/api/v1/courses/${langId}/levels/${lvlId}/units`
      );
      if (res && Array.isArray(res.units)) {
        setUnits(res.units);
      } else {
        setUnits([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[DIALOGUE_EXPLORER_LOAD_UNITS_ERROR]', err);
      setError(msg || dict.errors.networkError);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourse, selectedLevelId, dict.errors.networkError]);

  useEffect(() => {
    if (viewStep === 'units') {
      loadUnits();
    }
  }, [viewStep, loadUnits]);

  // Step 1 -> Step 2: Open Language Folder
  const handleSelectLanguageFolder = useCallback(
    (course: LanguageCourseMeta) => {
      setSelectedCourseId(course.id);

      const isAlreadyActiveLang =
        activeCourse.courseId === course.id || activeCourse.languageId === course.languageId;
      const firstAvailLevel = course.levels.find((l) => l.isAvailable) || course.levels[0];
      const nextLevelId = isAlreadyActiveLang
        ? activeCourse.levelId
        : firstAvailLevel?.id || 'level1';

      setSelectedLevelId(nextLevelId);

      if (course.isAvailable && !isAlreadyActiveLang && firstAvailLevel?.isAvailable) {
        setActiveCourse(course.id, firstAvailLevel.id);
      }

      setViewStep('levels');
    },
    [activeCourse.courseId, activeCourse.languageId, activeCourse.levelId, setActiveCourse]
  );

  // Step 2 -> Step 3: Open Level Folder
  const handleSelectLevelFolder = useCallback(
    (level: LevelFolderItem) => {
      setSelectedLevelId(level.id);
      handleSearchChange('');

      if (selectedCourse?.isAvailable && level.isAvailable) {
        const isAlreadyActive =
          (activeCourse.courseId === selectedCourse.id ||
            activeCourse.languageId === selectedCourse.languageId) &&
          activeCourse.levelId === level.id;
        if (!isAlreadyActive) {
          setActiveCourse(selectedCourse.id, level.id);
        }
      }

      setViewStep('units');
    },
    [selectedCourse, activeCourse.courseId, activeCourse.languageId, activeCourse.levelId, setActiveCourse, handleSearchChange]
  );

  // Breadcrumb navigation handlers
  const handleNavigateToLanguages = useCallback(() => {
    handleSearchChange('');
    setViewStep('languages');
  }, [handleSearchChange]);

  const handleNavigateToLevels = useCallback(() => {
    handleSearchChange('');
    setViewStep('levels');
  }, [handleSearchChange]);

  // Step 3: Handle lesson selection (triggers dedicated unit workspace in Phase 5)
  const handleSelectLesson = useCallback(
    (unitNumber: number) => {
      if (onSelectLesson) {
        onSelectLesson(unitNumber, selectedCourse?.id || 'german_pimsleur', selectedLevelId);
      }
    },
    [onSelectLesson, selectedCourse?.id, selectedLevelId]
  );

  return (
    <div
      data-testid="dialogue-folder-explorer"
      className={`animate-fade-in space-y-4 max-w-5xl mx-auto ${className}`}
    >
      {/* 1. Yacht-Deck Breadcrumb & Back Navigation Bar */}
      <DialogueBreadcrumbBar
        viewStep={viewStep}
        selectedLanguageName={localizedLanguageName}
        selectedLanguageFlag={selectedCourse?.flag}
        selectedLevelCode={selectedLevelFolder?.code}
        selectedLevelTitle={selectedLevelFolder?.title}
        onNavigateToLanguages={handleNavigateToLanguages}
        onNavigateToLevels={handleNavigateToLevels}
      />

      {/* 2. Direct 3-Step Folder Content Views (Zero Accordion) */}
      {viewStep === 'languages' && (
        <DialogueLanguageGrid
          courses={availableCourses}
          activeCourse={activeCourse}
          onSelectLanguage={handleSelectLanguageFolder}
          isLoading={isLoadingCourses}
        />
      )}

      {viewStep === 'levels' && selectedCourse && (
        <DialogueLevelSelector
          course={selectedCourse}
          onSelectLevel={handleSelectLevelFolder}
          onBackToLanguages={handleNavigateToLanguages}
        />
      )}

      {viewStep === 'units' && (
        <DialogueLessonGrid
          units={units}
          levelCode={selectedLevelFolder?.code}
          levelTitle={selectedLevelFolder?.title}
          languageName={localizedLanguageName}
          onSelectLesson={handleSelectLesson}
          onBackToLevels={handleNavigateToLevels}
          searchQuery={activeSearchQuery}
          onSearchChange={handleSearchChange}
          isLoading={isLoading}
          error={error}
          onRetry={loadUnits}
        />
      )}

      {/* Fail-Loud Error Toast Surface */}
      {error && (
        <ErrorToast
          message={error}
          onDismiss={() => setError(null)}
          actionLabel={dict.buttons.retry}
          onAction={loadUnits}
        />
      )}
    </div>
  );
};
