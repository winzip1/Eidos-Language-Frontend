import React, { useState, useEffect, useCallback } from 'react';
import type { UnitSummary, AppView } from '../../types';
import { apiRequest } from '../../services/apiClient';
import { useDictionary } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { useCourse } from '../../context/CourseContext';
import { StudyDeskHeroCard } from './StudyDeskHeroCard';
import { StudyMetricsBanner } from './StudyMetricsBanner';
import { RecentActivityList } from './RecentActivityList';
import { UnitStudyGrid, type UnitFilterStatus } from './UnitStudyGrid';
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
  const [filterStatus, setFilterStatus] = useState<UnitFilterStatus>('all');

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
    } catch (err: any) {
      console.error('[STUDY_DESK_LOAD_UNITS_ERROR]', err);
      setError(err?.message || dict.errors.networkError);
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
    <div className="animate-fade-in space-y-2 max-w-7xl mx-auto">
      {/* 1. Hero Card: 1-Click Smart Resume & Course Metadata */}
      <StudyDeskHeroCard
        totalUnits={units.length || 30}
        units={units}
        onNavigate={onNavigate}
      />

      {/* 2. Key Daily Learning Metrics Banner */}
      <StudyMetricsBanner
        totalUnits={units.length || 30}
        onNavigate={onNavigate}
      />

      {/* 3. Recent Study Activity List */}
      <RecentActivityList
        units={units}
        onSelectUnit={handleSelectUnit}
        onNavigate={onNavigate}
      />

      {/* 4. Filter & Main Unit Grid */}
      <UnitStudyGrid
        units={units}
        onSelectUnit={handleSelectUnit}
        searchQuery={activeSearchQuery}
        onSearchChange={handleSearchChange}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        isLoading={isLoading}
      />

      {/* Fail-Loud Error Toast */}
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
