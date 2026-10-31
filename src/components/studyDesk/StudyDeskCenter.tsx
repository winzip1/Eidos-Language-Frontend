/**
 * Eidos Language OS - Study Desk Center (3-Step Direct Drill-Down Folder Navigation Orchestrator)
 * Zero-Accordion File-Manager Architecture:
 * - Step 1 ('languages'): Root folder view of all language courses (Almanca, İtalyanca, İngilizce, İspanyolca, Fransızca).
 * - Step 2 ('levels'): Selected language's CEFR level folders (A1 - C1/Plus) without accordions.
 * - Step 3 ('units'): Standalone, focused 30-lesson view inside the selected level folder.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { UnitSummary, AppView, LanguageCourseMeta } from '../../types';
import { apiRequest } from '../../services/apiClient';
import { useDictionary } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { useCourse } from '../../context/CourseContext';
import { StudyDeskResumeHero } from './StudyDeskResumeHero';
import { StudyDeskBreadcrumbBar, type StudyDeskViewStep } from './StudyDeskBreadcrumbBar';
import { StudyDeskLanguageGrid, resolveLocalizedLanguageName } from './StudyDeskLanguageGrid';
import { StudyDeskLevelSelector, buildCourseLevelFolders, type LevelFolderItem } from './StudyDeskLevelSelector';
import { StudyDeskLessonList } from './StudyDeskLessonList';
import { ErrorToast } from '../common/ErrorToast';

interface StudyDeskCenterProps {
  onNavigate: (view: AppView) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const StudyDeskCenter: React.FC<StudyDeskCenterProps> = ({
  onNavigate,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
}) => {
  const { dict } = useDictionary();
  const { activeCourse, availableCourses, setActiveCourse, isLoadingCourses } = useCourse();
  const { loadAndPlayUnit } = usePlayer();

  // 3-Step Direct Drill-Down Folder State ('languages' -> 'levels' -> 'units')
  const [viewStep, setViewStep] = useState<StudyDeskViewStep>('languages');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    activeCourse?.courseId || 'german_pimsleur'
  );
  const [selectedLevelId, setSelectedLevelId] = useState<string>(
    activeCourse?.levelId || 'level1'
  );

  const [units, setUnits] = useState<UnitSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');

  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = externalOnSearchChange || setInternalSearchQuery;

  // Keep selectedCourse synchronized with availableCourses
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
    return (
      levelFolders.find((l) => l.id === selectedLevelId) ||
      levelFolders[0]
    );
  }, [levelFolders, selectedLevelId]);

  const localizedLanguageName = useMemo(() => {
    if (!selectedCourse) return activeCourse?.courseTitle || '';
    return resolveLocalizedLanguageName(selectedCourse, dict);
  }, [selectedCourse, activeCourse?.courseTitle, dict]);

  // Load units whenever activeCourse (language or level) changes
  const loadUnits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const langId = activeCourse?.languageId || 'german';
      const lvlId = activeCourse?.levelId || 'level1';
      const res = await apiRequest<{ units: UnitSummary[]; totalUnits: number }>(
        `/api/v1/courses/${langId}/levels/${lvlId}/units`
      );
      if (res && Array.isArray(res.units)) {
        setUnits(res.units);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[STUDY_DESK_LOAD_UNITS_ERROR]', err);
      setError(msg || dict.errors.networkError);
    } finally {
      setIsLoading(false);
    }
  }, [activeCourse?.languageId, activeCourse?.levelId, dict.errors.networkError]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

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

  // Handle unit selection with accurate millisecond positioning
  const handleSelectUnit = useCallback(
    (unitNum: number, positionMs: number = 0) => {
      loadAndPlayUnit(unitNum, positionMs, true);
    },
    [loadAndPlayUnit]
  );

  return (
    <div className="animate-fade-in space-y-5 max-w-5xl mx-auto pb-8">
      {/* 1. Compact "Where You Left Off" Hero Pill */}
      <StudyDeskResumeHero
        units={units}
        onSelectUnit={handleSelectUnit}
        onNavigate={onNavigate}
        isLoading={isLoading}
      />

      {/* 2. Yacht-Deck Folder Breadcrumb & Back Navigation Bar */}
      <StudyDeskBreadcrumbBar
        viewStep={viewStep}
        selectedLanguageName={localizedLanguageName}
        selectedLanguageFlag={selectedCourse?.flag}
        selectedLevelCode={selectedLevelFolder?.code}
        selectedLevelTitle={selectedLevelFolder?.title}
        totalLanguagesCount={availableCourses.length}
        onNavigateToLanguages={handleNavigateToLanguages}
        onNavigateToLevels={handleNavigateToLevels}
      />

      {/* 3. Direct 3-Step Folder Content View (Zero Accordion) */}
      {viewStep === 'languages' && (
        <StudyDeskLanguageGrid
          courses={availableCourses}
          activeCourse={activeCourse}
          onSelectLanguage={handleSelectLanguageFolder}
          isLoading={isLoadingCourses}
        />
      )}

      {viewStep === 'levels' && selectedCourse && (
        <StudyDeskLevelSelector
          course={selectedCourse}
          onSelectLevel={handleSelectLevelFolder}
        />
      )}

      {viewStep === 'units' && (
        <StudyDeskLessonList
          units={units}
          onSelectUnit={handleSelectUnit}
          onNavigate={onNavigate}
          levelCode={selectedLevelFolder?.code}
          levelTitle={selectedLevelFolder?.title}
          levelDescription={selectedLevelFolder?.description}
          isLevelAvailable={Boolean(selectedCourse?.isAvailable && selectedLevelFolder?.isAvailable)}
          onBackToLevels={handleNavigateToLevels}
          searchQuery={activeSearchQuery}
          onSearchChange={handleSearchChange}
          isLoading={isLoading}
          nested={false}
          error={error}
          onRetry={loadUnits}
        />
      )}

      {/* Fail-Loud Error Surface */}
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
