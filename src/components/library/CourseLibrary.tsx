import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { UnitSummary, AppView } from '../../types';
import { apiRequest } from '../../services/apiClient';
import { useDictionary } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { LevelHeroCard } from './LevelHeroCard';
import { UnitFilterBar, type UnitFilterStatus } from './UnitFilterBar';
import { UnitCard } from './UnitCard';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ErrorToast } from '../common/ErrorToast';

interface CourseLibraryProps {
  onNavigate: (view: AppView) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const CourseLibrary: React.FC<CourseLibraryProps> = ({
  onNavigate,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
}) => {
  const { dict } = useDictionary();
  const { loadAndPlayUnit, unitNumber: activeUnitNumber } = usePlayer();
  const { progress } = useAuth();

  const [units, setUnits] = useState<UnitSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<UnitFilterStatus>('all');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = externalOnSearchChange || setInternalSearchQuery;

  // Global keyboard shortcut: Press '/' to jump to search bar
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUnits() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiRequest<{ units: UnitSummary[]; totalUnits: number }>(
          '/api/v1/courses/german/levels/level1/units'
        );
        if (isMounted && res && Array.isArray(res.units)) {
          setUnits(res.units);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[LOAD_UNITS_ERROR]', err);
          setError(err?.message || dict.errors.networkError);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUnits();

    return () => {
      isMounted = false;
    };
  }, [dict.errors.networkError]);

  const handleSelectUnit = useCallback(
    (unitNum: number) => {
      loadAndPlayUnit(unitNum, 0, true);
      onNavigate('player');
    },
    [loadAndPlayUnit, onNavigate]
  );

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      // 1. Search text match
      const q = activeSearchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        unit.title.toLowerCase().includes(q) ||
        String(unit.unitNumber).includes(q);

      if (!matchesQuery) return false;

      // 2. Status filter match
      const p = progress?.units[unit.unitNumber];
      if (filterStatus === 'completed') return Boolean(p?.completed);
      if (filterStatus === 'in_progress') return Boolean(p && !p.completed && p.lastPositionMs > 0);
      if (filterStatus === 'not_started') return !p || (!p.completed && p.lastPositionMs === 0);

      return true;
    });
  }, [units, activeSearchQuery, filterStatus, progress]);

  return (
    <div className="animate-fade-in space-y-2">
      {/* Top Hero Banner & Quick Resume Card */}
      <LevelHeroCard
        totalUnits={units.length || 10}
        onSelectUnit={handleSelectUnit}
        units={units}
      />

      {/* Filter and Search Bar */}
      <UnitFilterBar
        searchQuery={activeSearchQuery}
        onSearchChange={handleSearchChange}
        selectedFilter={filterStatus}
        onFilterChange={setFilterStatus}
        unitsCount={filteredUnits.length}
        totalUnitsCount={units.length}
        searchInputRef={searchInputRef}
      />

      {error && <ErrorToast message={error} onDismiss={() => setError(null)} />}

      {/* Main Units Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <LoadingSkeleton count={6} heightClass="h-48" />
        </div>
      ) : filteredUnits.length === 0 ? (
        <EmptyState
          title={dict.library.noUnitsFoundTitle}
          description={dict.library.noUnitsFoundDesc}
          actionText={dict.library.clearFilters}
          onAction={() => {
            handleSearchChange('');
            setFilterStatus('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredUnits.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              progress={progress?.units[unit.unitNumber]}
              isCurrentlyPlaying={activeUnitNumber === unit.unitNumber}
              onSelect={handleSelectUnit}
            />
          ))}
        </div>
      )}
    </div>
  );
};
