import React from 'react';
import { CheckCircle2, BookmarkPlus, Sparkles, Clock, TrendingUp } from 'lucide-react';
import { useDictionary, initialFallbackDict } from '../../context/DictionaryContext';

interface VocabularyStatsSummaryProps {
  masteredCount: number;
  learningCount: number;
  unseenCount: number;
  totalCount: number;
  dueForReviewCount: number;
  activeStatus?: 'all' | 'mastered' | 'learning' | 'unseen';
  onSelectStatus?: (status: 'all' | 'mastered' | 'learning' | 'unseen') => void;
}

export const VocabularyStatsSummary: React.FC<VocabularyStatsSummaryProps> = ({
  masteredCount,
  learningCount,
  unseenCount,
  totalCount,
  dueForReviewCount,
  activeStatus,
  onSelectStatus,
}) => {
  const { dict } = useDictionary();
  const voc = dict?.vocabulary || initialFallbackDict.vocabulary;

  const masteryPercent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white border border-sand-200/90 rounded-3xl p-5 sm:p-6 shadow-soft-sm space-y-4">
      {/* Top Header Row with Progress Meter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-ocean-50 text-ocean-700">
            <TrendingUp className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {voc.statsSummaryTitle || 'Kelime Ustalığı Özeti'}
            </h3>
            <p className="text-xs text-slate-500">
              {totalCount} {voc.totalWordsCount}
            </p>
          </div>
        </div>

        {/* Mastery Percentage Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400 block">
              {voc.masteryRateLabel || 'Ustalık Oranı'}
            </span>
            <span className="text-base font-extrabold text-emerald-600">
              %{masteryPercent}
            </span>
          </div>
        </div>
      </div>

      {/* Mastery Progress Bar */}
      <div className="w-full h-2 bg-sand-100 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${(masteredCount / Math.max(totalCount, 1)) * 100}%` }}
          title={`${voc.masteredCountLabel}: ${masteredCount}`}
        />
        <div
          className="h-full bg-ocean-500 transition-all duration-500"
          style={{ width: `${(learningCount / Math.max(totalCount, 1)) * 100}%` }}
          title={`${voc.learningCountLabel}: ${learningCount}`}
        />
        <div
          className="h-full bg-sand-300 transition-all duration-500"
          style={{ width: `${(unseenCount / Math.max(totalCount, 1)) * 100}%` }}
          title={`${voc.unseenCountLabel}: ${unseenCount}`}
        />
      </div>

      {/* Dynamic Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {/* Mastered Counter Card */}
        <button
          type="button"
          onClick={() => onSelectStatus && onSelectStatus('mastered')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs hover:shadow-soft-sm active:scale-98 ${
            activeStatus === 'mastered'
              ? 'bg-emerald-100/90 border-emerald-400 ring-2 ring-emerald-200'
              : 'bg-emerald-50/70 hover:bg-emerald-50 border-emerald-200/80'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{voc.masteredCountLabel}</span>
          </div>
          <div className="text-xl font-black text-emerald-950">{masteredCount}</div>
        </button>

        {/* Learning Counter Card */}
        <button
          type="button"
          onClick={() => onSelectStatus && onSelectStatus('learning')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs hover:shadow-soft-sm active:scale-98 ${
            activeStatus === 'learning'
              ? 'bg-ocean-100/90 border-ocean-400 ring-2 ring-ocean-200'
              : 'bg-ocean-50/70 hover:bg-ocean-50 border-ocean-200/80'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-ocean-800 mb-1">
            <BookmarkPlus className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
            <span>{voc.learningCountLabel}</span>
          </div>
          <div className="text-xl font-black text-ocean-950">{learningCount}</div>
        </button>

        {/* Unseen Counter Card */}
        <button
          type="button"
          onClick={() => onSelectStatus && onSelectStatus('unseen')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs hover:shadow-soft-sm active:scale-98 ${
            activeStatus === 'unseen'
              ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-200'
              : 'bg-sand-50/90 hover:bg-sand-100/80 border-sand-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{voc.unseenCountLabel}</span>
          </div>
          <div className="text-xl font-black text-slate-800">{unseenCount}</div>
        </button>

        {/* SRS Due for Review Card */}
        <button
          type="button"
          onClick={() => onSelectStatus && onSelectStatus('learning')}
          className="p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-50 border border-amber-200/80 text-left transition-all cursor-pointer shadow-2xs hover:shadow-soft-sm active:scale-98"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{voc.srsDueCountLabel || 'Tekrar Bekleyen'}</span>
          </div>
          <div className="text-xl font-black text-amber-950">{dueForReviewCount}</div>
        </button>
      </div>
    </div>
  );
};
