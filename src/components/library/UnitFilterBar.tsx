import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';

export type UnitFilterStatus = 'all' | 'completed' | 'in_progress' | 'not_started';

interface UnitFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedFilter: UnitFilterStatus;
  onFilterChange: (status: UnitFilterStatus) => void;
  unitsCount: number;
  totalUnitsCount?: number;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const UnitFilterBar: React.FC<UnitFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  unitsCount,
  totalUnitsCount,
  searchInputRef,
}) => {
  const { dict } = useDictionary();

  const filterTabs: Array<{ id: UnitFilterStatus; label: string }> = [
    { id: 'all', label: dict.library.filterAll },
    { id: 'completed', label: dict.library.filterCompleted },
    { id: 'in_progress', label: dict.library.filterInProgress },
    { id: 'not_started', label: dict.library.filterNotStarted },
  ];

  const hasActiveFilters = Boolean(searchQuery || selectedFilter !== 'all');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onSearchChange('');
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 mb-6 bg-sand-50/60 p-2.5 sm:p-3 rounded-2xl border border-sand-200 shadow-2xs">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dict.library.searchPlaceholder}
          aria-label={dict.library.searchPlaceholder}
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-sand-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-ocean-400 shadow-2xs transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            aria-label={dict.library.clearFilters}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-sand-100 transition-colors cursor-pointer"
            title={dict.library.clearFilters}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Tabs & Count */}
      <div className="flex items-center justify-between md:justify-end gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-sand-200 shadow-2xs" role="tablist">
          {filterTabs.map((tab) => {
            const isSelected = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onFilterChange(tab.id)}
                role="tab"
                aria-selected={isSelected}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ocean-300 ${
                  isSelected
                    ? 'bg-ocean-600 text-white shadow-soft'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-sand-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Units Count Pill */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-sand-200 rounded-xl text-xs font-medium text-slate-500 whitespace-nowrap shadow-2xs">
          <Filter className="w-3.5 h-3.5 text-ocean-600" />
          <span className="font-bold text-slate-800">{unitsCount}</span>
          {totalUnitsCount !== undefined && totalUnitsCount !== unitsCount && (
            <span className="text-slate-400">/ {totalUnitsCount}</span>
          )}
          <span>{dict.library.filterCountLabel}</span>
        </div>

        {/* Clear Filter Quick Button (When Filtered) */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              onSearchChange('');
              onFilterChange('all');
            }}
            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-ocean-600 hover:text-ocean-800 hover:bg-ocean-50 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>{dict.library.clearFilters}</span>
          </button>
        )}
      </div>
    </div>
  );
};
