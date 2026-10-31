import React from 'react';
import {
  Search,
  X,
  CheckCircle2,
  BookmarkPlus,
  Sparkles,
  Filter,
  RotateCcw,
  ArrowUpDown,
} from 'lucide-react';
import { useDictionary, initialFallbackDict } from '../../context/DictionaryContext';

export type WordMasteryFilter = 'all' | 'mastered' | 'learning' | 'unseen';
export type WordSortOption = 'default' | 'alphabetical' | 'status' | 'unit';

interface WordFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedUnit: number | 'all';
  onUnitChange: (unit: number | 'all') => void;
  selectedStatus: WordMasteryFilter;
  onStatusChange: (status: WordMasteryFilter) => void;
  sortBy: WordSortOption;
  onSortChange: (sort: WordSortOption) => void;
  totalCount: number;
  filteredCount: number;
  maxUnits?: number;
  onResetFilters: () => void;
}

export const WordFilterBar: React.FC<WordFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedUnit,
  onUnitChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  totalCount,
  filteredCount,
  maxUnits = 30,
  onResetFilters,
}) => {
  const { dict } = useDictionary();
  const voc = dict?.vocabulary || initialFallbackDict.vocabulary;

  const isFiltered =
    searchQuery.trim() !== '' || selectedUnit !== 'all' || selectedStatus !== 'all' || sortBy !== 'default';

  const statusOptions: Array<{
    id: WordMasteryFilter;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    activeClass: string;
  }> = [
    {
      id: 'all',
      label: voc.filterAll,
      icon: Filter,
      activeClass: 'bg-slate-900 text-white shadow-2xs',
    },
    {
      id: 'mastered',
      label: voc.filterMastered,
      icon: CheckCircle2,
      activeClass: 'bg-emerald-600 text-white shadow-soft-sm',
    },
    {
      id: 'learning',
      label: voc.filterLearning,
      icon: BookmarkPlus,
      activeClass: 'bg-ocean-600 text-white shadow-soft-sm',
    },
    {
      id: 'unseen',
      label: voc.filterUnseen,
      icon: Sparkles,
      activeClass: 'bg-amber-600 text-white shadow-soft-sm',
    },
  ];

  return (
    <div className="bg-white border border-sand-200/90 rounded-3xl p-4 sm:p-5 shadow-soft space-y-4">
      {/* Top Row: Search Input, Unit Selector & Sort */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={voc.searchPlaceholder}
            className="w-full pl-10 pr-10 py-2.5 bg-sand-50/80 border border-sand-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-ocean-500 focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-sand-200/60 transition-colors cursor-pointer"
              title={voc.clearSearch}
              aria-label={voc.clearSearch}
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controls Cluster: Unit Selector & Sort Options */}
        <div className="flex items-center gap-2">
          {/* Unit Selector Dropdown */}
          <div className="flex-1 sm:flex-initial">
            <label htmlFor="unit-select" className="sr-only">
              {voc.unitSelectorLabel}
            </label>
            <select
              id="unit-select"
              value={selectedUnit}
              onChange={(e) =>
                onUnitChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
              }
              className="w-full sm:w-auto px-4 py-2.5 bg-sand-50/80 border border-sand-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-ocean-500 focus:bg-white shadow-2xs cursor-pointer transition-all"
            >
              <option value="all">{voc.allUnits}</option>
              {Array.from({ length: maxUnits }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {voc.unitBadge} {i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex-1 sm:flex-initial flex items-center bg-sand-50/80 border border-sand-200 rounded-2xl px-3 py-1 shadow-2xs focus-within:ring-2 focus-within:ring-ocean-500">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
            <label htmlFor="sort-select" className="sr-only">
              {voc.sortLabel}
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as WordSortOption)}
              className="w-full sm:w-auto py-1.5 bg-transparent border-0 text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="default">{voc.sortDefault}</option>
              <option value="alphabetical">{voc.sortAlphabetical}</option>
              <option value="status">{voc.sortStatus}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bottom Row: Status Filter Chips, Stats Counter & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-sand-100">
        {/* Status Chips */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold text-slate-400 mr-1 hidden md:inline">
            {voc.statusFilterLabel}:
          </span>
          {statusOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedStatus === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onStatusChange(opt.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? opt.activeClass
                    : 'bg-sand-50 hover:bg-sand-100 text-slate-600 border border-sand-200/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Counter and Reset Action */}
        <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold self-end sm:self-auto">
          <span className="bg-sand-100 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold">
            {filteredCount} / {totalCount} {voc.cardCountFormat}
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-[11px] text-ocean-600 hover:text-ocean-800 font-bold hover:underline transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{voc.resetFilter}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
