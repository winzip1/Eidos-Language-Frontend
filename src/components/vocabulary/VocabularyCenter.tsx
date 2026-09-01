import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Clock, RotateCcw } from 'lucide-react';
import type { VocabularyItem, AppView } from '../../types';
import { apiRequest } from '../../services/apiClient';
import { useDictionary, initialFallbackDict } from '../../context/DictionaryContext';
import { useCourse } from '../../context/CourseContext';
import { useAuth } from '../../context/AuthContext';
import { VocabularyHeader, type VocabularyViewMode } from './VocabularyHeader';
import { VocabularyStatsSummary } from './VocabularyStatsSummary';
import { WordMasteryCard } from './WordMasteryCard';
import { FlashcardDeck } from './FlashcardDeck';
import { WordFilterBar, type WordMasteryFilter, type WordSortOption } from './WordFilterBar';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ErrorToast } from '../common/ErrorToast';

interface VocabularyCenterProps {
  onNavigate: (view: AppView) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const VocabularyCenter: React.FC<VocabularyCenterProps> = ({
  onNavigate,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
}) => {
  const { dict } = useDictionary();
  const voc = dict?.vocabulary || initialFallbackDict.vocabulary;
  const { activeLanguageId, activeLevelId, activeCourse } = useCourse();
  const { progress, getWordStatus } = useAuth();

  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<number | 'all'>('all');
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = externalOnSearchChange || setInternalSearchQuery;

  const [selectedStatus, setSelectedStatus] = useState<WordMasteryFilter>('all');
  const [sortBy, setSortBy] = useState<WordSortOption>('default');
  const [viewMode, setViewMode] = useState<VocabularyViewMode>('grid');

  const loadVocab = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const lang = activeLanguageId || 'german';
      const lvl = activeLevelId || 'level1';
      const url =
        selectedUnit === 'all'
          ? `/api/v1/courses/${lang}/levels/${lvl}/vocabulary`
          : `/api/v1/courses/${lang}/levels/${lvl}/vocabulary?unit=${selectedUnit}`;
      const res = await apiRequest<{ items: VocabularyItem[]; totalWords: number }>(url);
      if (res && res.items) {
        setItems(res.items);
      }
    } catch (err: any) {
      console.error('[LOAD_VOCAB_ERROR]', err);
      setError(err.message || dict?.errors?.networkError || 'Failed to load vocabulary.');
    } finally {
      setIsLoading(false);
    }
  }, [activeLanguageId, activeLevelId, selectedUnit, dict?.errors?.networkError]);

  useEffect(() => {
    loadVocab();
  }, [loadVocab]);

  // Derived Honest Learning Metrics
  const masteredCount = progress?.vocabulary?.mastered || 0;
  const learningCount = progress?.vocabulary?.learning || 0;
  const totalLoadedCount = items.length;
  const unseenCount = Math.max(0, totalLoadedCount - (masteredCount + learningCount));

  // Words that are in 'learning' status (SRS Due Queue)
  const dueForReviewItems = useMemo(() => {
    return items.filter((item) => getWordStatus(item.id) === 'learning');
  }, [items, getWordStatus]);

  // Dynamic Filtering & Sorting
  const filteredItems = useMemo(() => {
    let result = [...items];

    // If SRS mode is active, filter only due/learning items
    if (viewMode === 'srs') {
      result = result.filter((item) => {
        const s = getWordStatus(item.id);
        return s === 'learning' || s === 'unseen';
      });
    }

    // 1. Search Query Filter
    if (activeSearchQuery.trim()) {
      const q = activeSearchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.german.toLowerCase().includes(q) ||
          (item.turkish && item.turkish.toLowerCase().includes(q)) ||
          (item.english && item.english.toLowerCase().includes(q))
      );
    }

    // 2. Mastery Status Filter
    if (selectedStatus !== 'all' && viewMode !== 'srs') {
      result = result.filter((item) => {
        const status = getWordStatus(item.id);
        return status === selectedStatus;
      });
    }

    // 3. Sort Order
    if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.german.localeCompare(b.german));
    } else if (sortBy === 'status') {
      const rank = { learning: 0, unseen: 1, mastered: 2 };
      result.sort((a, b) => {
        const rankA = rank[getWordStatus(a.id)];
        const rankB = rank[getWordStatus(b.id)];
        return rankA - rankB;
      });
    } else if (sortBy === 'unit') {
      result.sort((a, b) => a.unitNumber - b.unitNumber);
    }

    return result;
  }, [items, activeSearchQuery, selectedStatus, sortBy, getWordStatus, viewMode]);

  const handleResetFilters = () => {
    handleSearchChange('');
    setSelectedUnit('all');
    setSelectedStatus('all');
    setSortBy('default');
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* 1. Header Banner & View Mode Switcher */}
      <VocabularyHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={activeSearchQuery}
        onSearchChange={handleSearchChange}
        dueForReviewCount={dueForReviewItems.length}
      />

      {/* 2. Honest Learning Metrics Summary */}
      <VocabularyStatsSummary
        masteredCount={masteredCount}
        learningCount={learningCount}
        unseenCount={unseenCount}
        totalCount={items.length}
        dueForReviewCount={dueForReviewItems.length}
        activeStatus={viewMode === 'srs' ? 'learning' : selectedStatus}
        onSelectStatus={(status) => {
          setSelectedStatus(status);
          if (viewMode === 'srs') setViewMode('grid');
        }}
      />

      {/* 3. SRS Due Banner (Only when in SRS mode) */}
      {viewMode === 'srs' && (
        <div className="bg-gradient-to-r from-ocean-50 via-white to-amber-50/60 border border-ocean-200 rounded-3xl p-5 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-ocean-600 text-white shadow-soft-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {voc.srsDueTitle || 'Bugün Tekrar Edilecek Kelimeler'}
              </h3>
              <p className="text-xs text-slate-500">
                {voc.srsDueSubtitle || 'Aralıklı tekrar algoritması ile hafızanızı taze tutun.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-xl bg-white border border-ocean-200 text-xs font-bold text-ocean-700 shadow-2xs">
              {filteredItems.length} {voc.cardCountFormat}
            </span>
          </div>
        </div>
      )}

      {/* 4. Filter Bar (Search, Units, Status, Sort) */}
      {viewMode !== 'srs' && (
        <WordFilterBar
          searchQuery={activeSearchQuery}
          onSearchChange={handleSearchChange}
          selectedUnit={selectedUnit}
          onUnitChange={setSelectedUnit}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalCount={items.length}
          filteredCount={filteredItems.length}
          maxUnits={activeCourse?.levels?.[0]?.totalUnits || 10}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* 5. Error Toast if any */}
      {error && <ErrorToast message={error} />}

      {/* 6. Main Content: Skeleton, Empty State, 3D Flashcard Deck, or Card Grid */}
      {isLoading ? (
        <LoadingSkeleton count={6} heightClass="h-44" />
      ) : filteredItems.length === 0 ? (
        viewMode === 'srs' ? (
          <div className="bg-white border border-sand-200 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-soft">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <Sparkles className="w-7 h-7 text-emerald-600" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">
              {voc.srsEmptyTitle || 'Harika! Tekrar Bekleyen Kart Yok'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {voc.srsEmptyDesc || 'Bugün için planlanan tüm kelimeleri başarıyla tekrar ettiniz.'}
            </p>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs shadow-soft-sm transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Tüm Kelimeleri Görüntüle</span>
            </button>
          </div>
        ) : (
          <EmptyState
            title={dict?.emptyStates?.noVocabularyFound || voc.emptyTitle}
            description={voc.noVocabForFilter}
            actionLabel={voc.showAllUnits}
            onAction={handleResetFilters}
          />
        )
      ) : viewMode === 'deck' || viewMode === 'srs' ? (
        <div className="py-4">
          <FlashcardDeck
            items={filteredItems}
            onNavigateToPlayer={() => onNavigate('player')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <WordMasteryCard
              key={item.id}
              item={item}
              onNavigateToPlayer={() => onNavigate('player')}
            />
          ))}
        </div>
      )}
    </div>
  );
};
