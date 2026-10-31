/**
 * Eidos Language OS - Unit Workspace Section 4: Interactive Vocabulary Summary Table
 * Live search, dynamic grammatical role pills, copy & WebSpeech pronunciation actions.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, Copy, Check, Volume2, Bookmark, Filter } from 'lucide-react';
import type { GuideSectionVocab, GuideVocabItem } from '../../../types';
import { useDictionary, interpolate } from '../../../context/DictionaryContext';

export interface UnitVocabSummaryTableProps {
  vocab: GuideSectionVocab;
  unitNumber: number;
  className?: string;
}

type RoleCategory = 'all' | 'noun' | 'verb' | 'adjective' | 'preposition' | 'phrase' | 'number';

function detectRoleCategory(roleText: string): RoleCategory {
  if (!roleText) return 'phrase';
  const lower = roleText.toLowerCase();

  if (lower.includes('isim') || lower.includes('nomen') || lower.includes('substantiv')) {
    return 'noun';
  }
  if (
    lower.includes('fiil') ||
    lower.includes('verb') ||
    lower.includes('trennbar') ||
    lower.includes('mastar')
  ) {
    return 'verb';
  }
  if (lower.includes('sıfat') || lower.includes('zarf') || lower.includes('adjektiv') || lower.includes('adverb') || lower.includes('miktar')) {
    return 'adjective';
  }
  if (lower.includes('edat') || lower.includes('bağlaç') || lower.includes('präposition') || lower.includes('konjunktion')) {
    return 'preposition';
  }
  if (lower.includes('sayı') || lower.includes('numara') || lower.includes('zahl') || lower.includes('onluk') || lower.includes('basamak')) {
    return 'number';
  }
  return 'phrase';
}

function getRoleBadgeStyle(category: RoleCategory): string {
  switch (category) {
    case 'noun':
      return 'bg-sky-50 text-sky-800 border-sky-200/80';
    case 'verb':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
    case 'adjective':
      return 'bg-amber-50 text-amber-800 border-amber-200/80';
    case 'preposition':
      return 'bg-violet-50 text-violet-800 border-violet-200/80';
    case 'number':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200/80';
    case 'phrase':
    default:
      return 'bg-rose-50 text-rose-800 border-rose-200/80';
  }
}

export const UnitVocabSummaryTable: React.FC<UnitVocabSummaryTableProps> = ({
  vocab,
  unitNumber,
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<RoleCategory>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const rawItems: GuideVocabItem[] = useMemo(() => {
    return Array.isArray(vocab?.vocabItems) ? vocab.vocabItems : [];
  }, [vocab?.vocabItems]);

  // Copy handler with visual feedback
  const handleCopyWord = useCallback((text: string, index: number) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex((prev) => (prev === index ? null : prev));
      }, 1800);
    }
  }, []);

  // Web Speech API German pronunciation trigger
  const handlePronounce = useCallback((text: string, index: number) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.9;
      setSpeakingIndex(index);
      utterance.onend = () => {
        setSpeakingIndex((prev) => (prev === index ? null : prev));
      };
      utterance.onerror = () => {
        setSpeakingIndex((prev) => (prev === index ? null : prev));
      };
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Filter items by search query and role category
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rawItems.filter((item) => {
      // Role filter check
      if (selectedRole !== 'all') {
        const cat = detectRoleCategory(item.role || '');
        if (cat !== selectedRole) return false;
      }

      // Search query check
      if (!q) return true;
      return (
        item.german.toLowerCase().includes(q) ||
        item.turkish.toLowerCase().includes(q) ||
        (item.phonetic && item.phonetic.toLowerCase().includes(q)) ||
        (item.role && item.role.toLowerCase().includes(q))
      );
    });
  }, [rawItems, searchQuery, selectedRole]);

  // Role category counts
  const roleCounts = useMemo(() => {
    const counts: Record<RoleCategory, number> = {
      all: rawItems.length,
      noun: 0,
      verb: 0,
      adjective: 0,
      preposition: 0,
      phrase: 0,
      number: 0,
    };
    rawItems.forEach((item) => {
      const cat = detectRoleCategory(item.role || '');
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [rawItems]);

  const rolePills: Array<{ key: RoleCategory; label: string }> = [
    { key: 'all', label: dh.filterAllRoles || 'Tüm Roller' },
    { key: 'noun', label: 'İsim' },
    { key: 'verb', label: 'Fiil' },
    { key: 'adjective', label: 'Sıfat / Zarf' },
    { key: 'preposition', label: 'Edat' },
    { key: 'number', label: 'Sayı' },
    { key: 'phrase', label: 'Kalıp' },
  ];

  return (
    <div
      data-testid="unit-vocab-summary-table"
      className={`bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-4 ${className}`}
    >
      {/* 1. Header & Live Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {vocab.title || dh.tabVocabSummary}
            </h2>
            {vocab.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{vocab.description}</p>
            )}
          </div>
        </div>

        {/* Search input with clear button */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={dh.searchVocabPlaceholder}
            className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
              aria-label={dict.buttons.clear}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Grammatical Role Filters (Scrollable Pills) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1 hidden sm:block" />
        {rolePills.map((pill) => {
          const count = roleCounts[pill.key] || 0;
          if (pill.key !== 'all' && count === 0) return null;
          const isActive = selectedRole === pill.key;

          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => setSelectedRole(pill.key)}
              className={`shrink-0 min-h-[36px] px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-sky-700 text-sky-100' : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Word Count & Filter Stats Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
        <span className="font-semibold text-slate-700">
          {interpolate(dh.totalWordsBadge, { count: filteredItems.length })}
        </span>
        {(searchQuery || selectedRole !== 'all') && (
          <span className="text-[11px] text-slate-400">
            {interpolate(dh.filteredFromTotalWords, {
              total: rawItems.length,
              count: filteredItems.length,
            })}
          </span>
        )}
      </div>

      {/* 4. Table Body / Empty State */}
      {filteredItems.length === 0 ? (
        <div className="py-10 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 p-6 space-y-2.5">
          <p className="text-xs sm:text-sm font-medium text-slate-600">{dh.noVocabFound}</p>
          {(searchQuery || selectedRole !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedRole('all');
              }}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-sky-600 hover:bg-slate-50 shadow-xs transition-colors"
            >
              {dict.buttons.clear}
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto -mx-1 sm:mx-0 rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse min-w-[320px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-2.5 sm:px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-2.5 sm:px-3">{dh.targetLanguageColumn}</th>
                <th className="py-2.5 px-2.5 sm:px-3">{dh.nativeLanguageColumn}</th>
                <th className="py-2.5 px-2.5 sm:px-3">{dh.roleOrNotesColumn}</th>
                <th className="py-2.5 px-2 text-right w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.map((item, idx) => {
                const category = detectRoleCategory(item.role || '');
                const isCopied = copiedIndex === idx;
                const isSpeaking = speakingIndex === idx;

                return (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-2.5 px-2.5 sm:px-3 font-mono text-slate-400 text-[11px] text-center">
                      {idx + 1}
                    </td>

                    {/* German Word & Phonetics */}
                    <td className="py-2.5 px-2.5 sm:px-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors text-xs sm:text-sm">
                          {item.german}
                        </span>
                        {item.phonetic && (
                          <span className="text-[11px] font-mono text-slate-400 tracking-tight">
                            [{item.phonetic.replace(/[\/\[\]]/g, '')}]
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Turkish Translation */}
                    <td className="py-2.5 px-2.5 sm:px-3 font-medium text-slate-700">
                      {item.turkish}
                    </td>

                    {/* Grammatical Role Badge */}
                    <td className="py-2.5 px-2.5 sm:px-3">
                      {item.role && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border ${getRoleBadgeStyle(
                            category
                          )}`}
                        >
                          {item.role}
                        </span>
                      )}
                    </td>

                    {/* Actions: Pronounce & Copy */}
                    <td className="py-1 px-1 sm:px-2 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        {/* Pronounce Button */}
                        <button
                          type="button"
                          onClick={() => handlePronounce(item.german, idx)}
                          title={dh.listenPronunciation}
                          aria-label={dh.listenPronunciation}
                          className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors ${
                            isSpeaking ? 'text-sky-600 bg-sky-50 animate-pulse' : ''
                          }`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyWord(item.german, idx)}
                          title={isCopied ? dh.wordCopied : dh.copyWord}
                          aria-label={isCopied ? dh.wordCopied : dh.copyWord}
                          className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-colors ${
                            isCopied
                              ? 'text-emerald-600 bg-emerald-50'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
