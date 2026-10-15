/**
 * Eidos Language OS - Study Desk Center (Clean Orchestrator)
 * Reimagined, airy Study Desk with:
 * 1. Smart Resume Hero Card ("Kaldığınız Yer")
 * 2. 6-Level Packages Hierarchy (A1 - C2, 30 days/lessons per level)
 * 3. Sleek Horizontal Thin Line Lesson Rows (Yatay İnce Çizgi)
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React, { useState, useEffect, useCallback } from 'react';
import type { UnitSummary, AppView } from '../../types';
import { apiRequest } from '../../services/apiClient';
import { useDictionary } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { useCourse } from '../../context/CourseContext';
import { StudyDeskResumeHero } from './StudyDeskResumeHero';
import { StudyDeskLevelSelector } from './StudyDeskLevelSelector';
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
  const { activeCourse } = useCourse();
  const { loadAndPlayUnit } = usePlayer();

  const [units, setUnits] = useState<UnitSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');

  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = externalOnSearchChange || setInternalSearchQuery;

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
  }, [activeCourse, dict.errors.networkError]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  // Handle unit selection with accurate millisecond positioning
  const handleSelectUnit = useCallback(
    (unitNum: number, positionMs: number = 0) => {
      loadAndPlayUnit(unitNum, positionMs, true);
    },
    [loadAndPlayUnit]
  );

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto pb-8">
      {/* 1. Smart "Where You Left Off" Hero Pill with Streak & Level Progress */}
      <StudyDeskResumeHero
        units={units}
        onSelectUnit={handleSelectUnit}
        onNavigate={onNavigate}
        isLoading={isLoading}
      />

      {/* 2. Hierarchical 6-Level Folder Tree (A1 - C2, Nested Accordion) */}
      <StudyDeskLevelSelector
        units={units}
        onSelectUnit={handleSelectUnit}
        onNavigate={onNavigate}
        searchQuery={activeSearchQuery}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
        error={error}
        onRetry={loadUnits}
      />

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
