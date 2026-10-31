/**
 * Eidos Language OS - Unit Workspace Section 1: Introduction & Dialogue View
 * Displays unit goals/objectives and Section 1 conversational dialogue items
 * rendered as interactive sentence table cards with audio snippet & loop synchronization.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React, { useState, useEffect } from 'react';
import { CheckCircle2, MessageSquare, Mic } from 'lucide-react';
import type { GuideSectionIntro, GuideSectionDialogue, GuideItem } from '../../../types';
import { useDictionary, interpolate } from '../../../context/DictionaryContext';
import { audioPlayer } from '../../../services/audioPlayer';
import { calculateSentenceEndMs } from '../../../utils/audioTime';
import { SentenceTableCard } from './SentenceTableCard';
import { DialogueRoleplayModal } from '../DialogueRoleplayModal';

export interface UnitIntroSectionProps {
  intro: GuideSectionIntro;
  dialogue: GuideSectionDialogue;
  unitNumber: number;
  languageId?: string;
  levelId?: string;
  className?: string;
}

export const UnitIntroSection: React.FC<UnitIntroSectionProps> = ({
  intro,
  dialogue,
  unitNumber,
  languageId = 'german',
  levelId = 'level1',
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  // Active loop, playing snippet state & roleplay modal state
  const [loopingItemId, setLoopingItemId] = useState<string | null>(null);
  const [activePlayingItemId, setActivePlayingItemId] = useState<string | null>(null);
  const [isRoleplayOpen, setIsRoleplayOpen] = useState<boolean>(false);

  const dialogueItems = dialogue?.items || [];

  // Synchronize loop and audio playback state
  useEffect(() => {
    const initialLoop = audioPlayer.getActiveLoop();
    if (initialLoop?.itemId) {
      setLoopingItemId(initialLoop.itemId);
    } else {
      setLoopingItemId(null);
    }

    const unsubscribeLoop = audioPlayer.onLoopChange((loop) => {
      setLoopingItemId(loop ? loop.itemId || null : null);
    });

    let lastActiveId: string | null = null;
    const unsubscribeTime = audioPlayer.onTimeUpdate((currentMs) => {
      if (!audioPlayer.getIsPlaying()) {
        if (lastActiveId !== null) {
          lastActiveId = null;
          setActivePlayingItemId(null);
        }
        return;
      }

      const currentLoop = audioPlayer.getActiveLoop();
      if (currentLoop?.itemId) {
        if (lastActiveId !== currentLoop.itemId) {
          lastActiveId = currentLoop.itemId;
          setActivePlayingItemId(currentLoop.itemId);
        }
        return;
      }

      let matchedId: string | null = null;
      for (let i = 0; i < dialogueItems.length; i++) {
        const it = dialogueItems[i];
        const start = it.primaryTimeMs || 0;
        const nextIt = i < dialogueItems.length - 1 ? dialogueItems[i + 1] : null;
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
  }, [dialogueItems]);

  // Handle loop toggle for a specific sentence card
  const handleToggleLoop = (itemId: string, item: GuideItem) => {
    if (loopingItemId === itemId) {
      audioPlayer.stopLoop();
      return;
    }

    const startMs = item.primaryTimeMs || 0;
    const currentIndex = dialogueItems.findIndex((i) => i.id === itemId);
    const nextItem =
      currentIndex >= 0 && currentIndex < dialogueItems.length - 1
        ? dialogueItems[currentIndex + 1]
        : null;
    const endMs = calculateSentenceEndMs(startMs, nextItem?.primaryTimeMs, item.originalSentence);

    audioPlayer.setLoop(startMs, endMs, itemId, unitNumber, languageId, levelId);
  };

  // Handle snippet play for a specific sentence card
  const handlePlaySnippet = (itemId: string, item: GuideItem) => {
    const startMs = item.primaryTimeMs || 0;
    const currentIndex = dialogueItems.findIndex((i) => i.id === itemId);
    const nextItem =
      currentIndex >= 0 && currentIndex < dialogueItems.length - 1
        ? dialogueItems[currentIndex + 1]
        : null;
    const endMs = calculateSentenceEndMs(startMs, nextItem?.primaryTimeMs, item.originalSentence);

    audioPlayer.playSnippet(unitNumber, startMs, endMs, itemId, languageId, levelId);
  };

  return (
    <div data-testid="unit-intro-section" className={`space-y-4 ${className}`}>
      {/* 1. Unit Objectives & Goals Card */}
      {intro && (
        <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {intro.title || dh.tabIntroDialogue}
            </h2>
          </div>

          {intro.description && (
            <p className="text-xs sm:text-sm text-slate-600 mb-3 leading-relaxed">
              {intro.description}
            </p>
          )}

          {Array.isArray(intro.objectives) && intro.objectives.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
              {intro.objectives.map((obj, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded-xl bg-slate-50/70 border border-slate-200/60 text-xs text-slate-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                  <span className="font-medium leading-normal">{obj}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2. Section 1: Dialogue Items Card */}
      <section className="space-y-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {dialogue.title || dh.tabIntroDialogue}
              </h2>
              {dialogue.description && (
                <p className="text-xs text-slate-500">{dialogue.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dialogueItems.length > 0 && (
              <button
                type="button"
                data-testid="open-roleplay-modal-btn"
                onClick={() => setIsRoleplayOpen(true)}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
                title={dh.roleplayMode}
              >
                <Mic className="w-4 h-4 text-indigo-600" />
                <span>{dh.roleplayMode}</span>
              </button>
            )}
            <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200/60 hidden xs:inline-block">
              {interpolate(dh.tablesCount, { count: dialogueItems.length })}
            </span>
          </div>
        </div>

        {/* Dialogue Items Stream */}
        {dialogueItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400">
            {dh.noGuidesFoundDesc}
          </div>
        ) : (
          <div className="space-y-3.5">
            {dialogueItems.map((item) => (
              <SentenceTableCard
                key={item.id}
                item={item}
                unitNumber={unitNumber}
                languageId={languageId}
                levelId={levelId}
                isLooping={loopingItemId === item.id}
                isPlayingSnippet={activePlayingItemId === item.id}
                onToggleLoop={handleToggleLoop}
                onPlaySnippet={handlePlaySnippet}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Roleplay Simulation Modal */}
      {isRoleplayOpen && (
        <DialogueRoleplayModal
          isOpen={isRoleplayOpen}
          onClose={() => setIsRoleplayOpen(false)}
          unitNumber={unitNumber}
          unitTitle={intro?.title || dialogue?.title}
          items={dialogueItems}
          languageId={languageId}
          levelId={levelId}
        />
      )}
    </div>
  );
};
