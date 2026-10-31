/**
 * Eidos Language OS - Section Table Group Component
 * Manages thematic subgroups, global translation visibility toggle, and sentence audio looping.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - 360dp Responsive.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { Target, Eye, EyeOff } from 'lucide-react';
import type { GuideItem, GuideSubgroup } from '../../../types';
import { useDictionary, interpolate } from '../../../context/DictionaryContext';
import { audioPlayer } from '../../../services/audioPlayer';
import { calculateSentenceEndMs } from '../../../utils/audioTime';
import { SentenceTableCard } from './SentenceTableCard';

export interface SectionTableGroupProps {
  items: GuideItem[];
  subgroups?: GuideSubgroup[];
  unitNumber: number;
  languageId?: string;
  levelId?: string;
  title?: string;
  description?: string;
  className?: string;
}

export const SectionTableGroup: React.FC<SectionTableGroupProps> = ({
  items = [],
  subgroups = [],
  unitNumber,
  languageId = 'german',
  levelId = 'level1',
  title,
  description,
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  // Global hide translation toggle for the whole group
  const [globalHideTranslation, setGlobalHideTranslation] = useState<boolean>(false);

  // Selected subgroup filter
  const [selectedSubgroupTitle, setSelectedSubgroupTitle] = useState<string>('all');

  // Currently looping sentence item ID
  const [loopingItemId, setLoopingItemId] = useState<string | null>(null);

  // Currently playing sentence snippet ID (karaoke sync highlight)
  const [activePlayingItemId, setActivePlayingItemId] = useState<string | null>(null);

  // Filter items based on selected subgroup
  const filteredItems = useMemo(() => {
    if (selectedSubgroupTitle === 'all') return items;
    return items.filter((item) => item.groupTitle === selectedSubgroupTitle);
  }, [items, selectedSubgroupTitle]);

  // Synchronize with audioPlayer for loops and current snippet playback
  useEffect(() => {
    // Initial loop state sync
    const initialLoop = audioPlayer.getActiveLoop();
    if (initialLoop?.itemId) {
      setLoopingItemId(initialLoop.itemId);
    } else {
      setLoopingItemId(null);
    }

    // Subscribe to loop changes
    const unsubscribeLoop = audioPlayer.onLoopChange((loop) => {
      setLoopingItemId(loop ? loop.itemId || null : null);
    });

    let lastActiveId: string | null = null;

    // Track active playing item based on current audio playback position
    const unsubscribeTime = audioPlayer.onTimeUpdate((currentMs) => {
      if (!audioPlayer.getIsPlaying()) {
        if (lastActiveId !== null) {
          lastActiveId = null;
          setActivePlayingItemId(null);
        }
        return;
      }

      // If a loop is active, prioritize the looped item
      const currentLoop = audioPlayer.getActiveLoop();
      if (currentLoop?.itemId) {
        if (lastActiveId !== currentLoop.itemId) {
          lastActiveId = currentLoop.itemId;
          setActivePlayingItemId(currentLoop.itemId);
        }
        return;
      }

      // Otherwise match item based on timestamp boundaries
      let matchedId: string | null = null;
      for (let i = 0; i < filteredItems.length; i++) {
        const it = filteredItems[i];
        const start = it.primaryTimeMs || 0;
        const nextIt = i < filteredItems.length - 1 ? filteredItems[i + 1] : null;
        const end = calculateSentenceEndMs(start, nextIt?.primaryTimeMs, it.originalSentence);

        if (currentMs >= start && currentMs < end) {
          matchedId = it.id;
          break;
        }
      }

      if (matchedId !== lastActiveId) {
        lastActiveId = matchedId;
        setActivePlayingItemId(matchedId);
      }
    });

    const unsubscribeState = audioPlayer.onStateChange((playing) => {
      if (!playing) {
        lastActiveId = null;
        setActivePlayingItemId(null);
      }
    });

    return () => {
      unsubscribeLoop();
      unsubscribeTime();
      unsubscribeState();
    };
  }, [filteredItems]);

  // Handle loop toggle for a specific sentence card
  const handleToggleLoop = (itemId: string, item: GuideItem) => {
    if (loopingItemId === itemId) {
      audioPlayer.stopLoop();
      return;
    }

    const startMs = item.primaryTimeMs || 0;
    const currentIndex = filteredItems.findIndex((i) => i.id === itemId);
    const nextItem =
      currentIndex >= 0 && currentIndex < filteredItems.length - 1
        ? filteredItems[currentIndex + 1]
        : null;
    const endMs = calculateSentenceEndMs(startMs, nextItem?.primaryTimeMs, item.originalSentence);

    audioPlayer.setLoop(startMs, endMs, itemId, unitNumber, languageId, levelId);
  };

  // Handle snippet play for a specific sentence card
  const handlePlaySnippet = (itemId: string, item: GuideItem) => {
    const startMs = item.primaryTimeMs || 0;
    const currentIndex = filteredItems.findIndex((i) => i.id === itemId);
    const nextItem =
      currentIndex >= 0 && currentIndex < filteredItems.length - 1
        ? filteredItems[currentIndex + 1]
        : null;
    const endMs = calculateSentenceEndMs(startMs, nextItem?.primaryTimeMs, item.originalSentence);

    audioPlayer.playSnippet(unitNumber, startMs, endMs, itemId, languageId, levelId);
  };

  return (
    <div data-testid="section-table-group" className={`space-y-4 max-w-full ${className}`}>
      {/* Header & Global Action Card */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        {/* Top Title and Actions Row */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 flex-wrap">
          {/* Title & Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {title || dh.tabDrillPatterns}
              </h2>
              {description && (
                <p className="text-xs text-slate-500 line-clamp-1">{description}</p>
              )}
            </div>
          </div>

          {/* Quick Global Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Total Tables Badge */}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200/60">
              {interpolate(dh.tablesCount, { count: filteredItems.length })}
            </span>

            {/* Global Hide/Show All Translations Button (Min 44x44px touch area) */}
            <button
              type="button"
              data-testid="toggle-all-translations-btn"
              onClick={() => setGlobalHideTranslation((prev) => !prev)}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                globalHideTranslation
                  ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
              }`}
              title={globalHideTranslation ? dh.showTranslation : dh.hideTranslation}
              aria-label={globalHideTranslation ? dh.showTranslation : dh.hideTranslation}
            >
              {globalHideTranslation ? (
                <>
                  <EyeOff className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">{dh.showTranslation}</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">{dh.hideTranslation}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Thematic Subgroup Tabs (e.g. Tema 1, Tema 2) */}
        {Array.isArray(subgroups) && subgroups.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -mx-1 px-1">
            <button
              type="button"
              onClick={() => setSelectedSubgroupTitle('all')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                selectedSubgroupTitle === 'all'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {dict.studyDesk.filterAll} ({items.length})
            </button>

            {subgroups.map((sub: GuideSubgroup) => {
              const isSelected = selectedSubgroupTitle === sub.title;
              return (
                <button
                  key={sub.title}
                  type="button"
                  onClick={() => setSelectedSubgroupTitle(sub.title)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sub.title} ({sub.itemCount})
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Sentence Table Cards Stream */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400">
          {dh.noGuidesFoundDesc}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <SentenceTableCard
              key={item.id}
              item={item}
              unitNumber={unitNumber}
              languageId={languageId}
              levelId={levelId}
              globalHideTranslation={globalHideTranslation}
              isLooping={loopingItemId === item.id}
              isPlayingSnippet={activePlayingItemId === item.id}
              onToggleLoop={handleToggleLoop}
              onPlaySnippet={handlePlaySnippet}
            />
          ))}
        </div>
      )}
    </div>
  );
};
