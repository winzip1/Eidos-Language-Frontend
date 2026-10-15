import React from 'react';
import {
  BookMarked,
  LayoutGrid,
  Layers,
  Sparkles,
  Search,
  X,
  Clock,
} from 'lucide-react';
import { useDictionary, initialFallbackDict } from '../../context/DictionaryContext';
import { useCourse } from '../../context/CourseContext';

export type VocabularyViewMode = 'grid' | 'deck' | 'srs';

interface VocabularyHeaderProps {
  viewMode: VocabularyViewMode;
  onViewModeChange: (mode: VocabularyViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dueForReviewCount: number;
}

export const VocabularyHeader: React.FC<VocabularyHeaderProps> = ({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  dueForReviewCount,
}) => {
  const { dict } = useDictionary();
  const voc = dict?.vocabulary || initialFallbackDict.vocabulary;
  const { activeCourse, activeLevel } = useCourse();

  return (
    <div className="bg-white border border-sand-200/90 rounded-3xl p-6 sm:p-7 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-5">
      {/* Title & Context */}
      <div className="space-y-2 max-w-xl">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-ocean-50 border border-ocean-200 rounded-full text-ocean-700 text-xs font-bold shadow-2xs">
            <BookMarked className="w-3.5 h-3.5" />
            <span>{voc.contextBanner}</span>
          </div>

          {activeCourse && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sand-100 text-slate-700 text-xs font-semibold border border-sand-200">
              {activeCourse.flag} {activeCourse.languageName} {activeLevel?.cefrLevel}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {voc.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          {voc.subtitle}
        </p>
      </div>

      {/* Controls: Search & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search input in header */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={voc.searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 bg-sand-50/70 hover:bg-white focus:bg-white rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-ocean-500 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-sand-200/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Switcher: Grid vs Deck vs SRS */}
        <div className="flex items-center bg-sand-50/80 p-1 rounded-2xl border border-sand-200 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-ocean-700 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{voc.viewModeGrid}</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('deck')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'deck'
                ? 'bg-white text-ocean-700 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{voc.viewModeSingle}</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('srs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'srs'
                ? 'bg-ocean-600 text-white shadow-soft-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{voc.viewModeSrs || 'SRS Tekrar'}</span>
            {dueForReviewCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                viewMode === 'srs' ? 'bg-white text-ocean-700' : 'bg-ocean-100 text-ocean-800'
              }`}>
                {dueForReviewCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
