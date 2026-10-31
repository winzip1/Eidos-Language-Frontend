/**
 * Eidos Language OS - Unit Workspace Section 3: Reading & Pronunciation View
 * Displays reading practice items, phonetic guides, and pronunciation rules
 * with interactive timestamp audio button and wave state synchronization.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React, { useState, useEffect } from 'react';
import { BookOpen, Info, Headphones } from 'lucide-react';
import type { GuideSectionReading, GuideItem } from '../../../types';
import { useDictionary, interpolate } from '../../../context/DictionaryContext';
import { audioPlayer } from '../../../services/audioPlayer';
import { calculateSentenceEndMs } from '../../../utils/audioTime';
import { TimestampAudioButton } from './TimestampAudioButton';

export interface UnitReadingSectionProps {
  reading: GuideSectionReading;
  unitNumber: number;
  languageId?: string;
  levelId?: string;
  className?: string;
}

export const UnitReadingSection: React.FC<UnitReadingSectionProps> = ({
  reading,
  unitNumber,
  languageId = 'german',
  levelId = 'level1',
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  const [activePlayingItemId, setActivePlayingItemId] = useState<string | null>(null);

  const readingItems = Array.isArray(reading?.items) ? reading.items : [];
  const hasReadingItems = readingItems.length > 0;

  // Track playback time to highlight active playing reading item
  useEffect(() => {
    let lastActiveId: string | null = null;
    const unsubscribeTime = audioPlayer.onTimeUpdate((currentMs) => {
      if (!audioPlayer.getIsPlaying()) {
        if (lastActiveId !== null) {
          lastActiveId = null;
          setActivePlayingItemId(null);
        }
        return;
      }

      let matchedId: string | null = null;
      for (let i = 0; i < readingItems.length; i++) {
        const it = readingItems[i];
        const start = it.primaryTimeMs || 0;
        const nextIt = i < readingItems.length - 1 ? readingItems[i + 1] : null;
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
      unsubscribeTime();
      unsubscribeState();
    };
  }, [readingItems]);

  const handlePlaySnippet = (item: GuideItem) => {
    const startMs = item.primaryTimeMs || 0;
    const currentIndex = readingItems.findIndex((i) => i.id === item.id);
    const nextItem =
      currentIndex >= 0 && currentIndex < readingItems.length - 1
        ? readingItems[currentIndex + 1]
        : null;
    const endMs = calculateSentenceEndMs(startMs, nextItem?.primaryTimeMs, item.originalSentence);

    audioPlayer.playSnippet(unitNumber, startMs, endMs, item.id, languageId, levelId);
  };

  return (
    <div data-testid="unit-reading-section" className={`space-y-4 ${className}`}>
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {reading.title || dh.tabReading}
              </h2>
              {reading.description && (
                <p className="text-xs text-slate-500">{reading.description}</p>
              )}
            </div>
          </div>

          {hasReadingItems && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              {interpolate(dh.tablesCount, { count: readingItems.length })}
            </span>
          )}
        </div>

        {/* Phonetic Notes Card (if present) */}
        {reading.phoneticNotes && (
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">{dh.phoneticNotesTitle}:</strong>
              <span>{reading.phoneticNotes}</span>
            </div>
          </div>
        )}

        {/* Reading Items */}
        {!hasReadingItems ? (
          <div className="py-8 px-4 text-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200">
            <Headphones className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-medium text-slate-600">
              {dh.readingSectionNotice}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {readingItems.map((item, idx) => {
              const isPlaying = activePlayingItemId === item.id;
              return (
                <div
                  key={item.id || idx}
                  data-testid={`reading-item-${idx}`}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                    isPlaying
                      ? 'bg-sky-50/40 border-sky-400 ring-2 ring-sky-400/30 shadow-xs'
                      : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-slate-400 font-semibold">#{idx + 1}</span>
                    {item.primaryTimeStr && (
                      <TimestampAudioButton
                        timeStr={item.primaryTimeStr}
                        timeMs={item.primaryTimeMs}
                        isPlaying={isPlaying}
                        onClick={() => handlePlaySnippet(item)}
                        size="sm"
                      />
                    )}
                  </div>

                  <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {item.originalSentence}
                  </p>

                  {item.table?.fullTranslation && (
                    <p className="text-xs sm:text-sm text-slate-600 font-medium">
                      {item.table.fullTranslation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
