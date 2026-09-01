import React, { useState } from 'react';
import {
  Play,
  Square,
  Compass,
  ArrowRight,
  Bookmark,
  Gauge,
  Headphones,
  Mic,
  BookmarkPlus,
  Check,
  Volume2,
} from 'lucide-react';
import type { UnitDialogue, DialogueLine, AppView } from '../../types';
import { useDictionary, initialFallbackDict } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { DialogueLineItem } from './DialogueLineItem';
import { toast } from 'sonner';

interface UnitDialogueCardProps {
  unitDialogue: UnitDialogue;
  isPlayingWhole: boolean;
  activeLineId: string | null;
  isPlayingAny: boolean;
  speed: number;
  onSetSpeed: (rate: number) => void;
  onPlayWholeDialogue: (unit: UnitDialogue) => void;
  onStopAudio: () => void;
  onPlayLine: (unitNumber: number, line: DialogueLine) => void;
  onNavigate: (view: AppView) => void;
  onOpenRoleplay?: (unit: UnitDialogue) => void;
  onOpenDrill?: (line: DialogueLine) => void;
}

export const UnitDialogueCard: React.FC<UnitDialogueCardProps> = ({
  unitDialogue,
  isPlayingWhole,
  activeLineId,
  isPlayingAny,
  speed,
  onSetSpeed,
  onPlayWholeDialogue,
  onStopAudio,
  onPlayLine,
  onNavigate,
  onOpenRoleplay,
  onOpenDrill,
}) => {
  const { dict } = useDictionary();
  const ds = dict?.dialogueStudy || initialFallbackDict.dialogueStudy;
  const { loadAndPlayUnit, playSnippet } = usePlayer();
  const { saveWordMastery } = useAuth();

  const [savedVocabIds, setSavedVocabIds] = useState<Record<string, boolean>>({});

  const handleJumpToLesson = () => {
    loadAndPlayUnit(unitDialogue.unitNumber, unitDialogue.startMs, true);
    onNavigate('player');
  };

  const handleSaveVocabChip = (term: string, tr: string, en?: string) => {
    const id = `vocab-chip-${unitDialogue.unitNumber}-${term.toLowerCase().replace(/\s+/g, '-')}`;
    saveWordMastery(id, 'learning', unitDialogue.unitNumber, term, tr, en);
    setSavedVocabIds((prev) => ({ ...prev, [id]: true }));
    toast.success(ds.savedToVocab || 'Kelime Defterine Eklendi');
  };

  const handlePlayVocabSnippet = () => {
    playSnippet(unitDialogue.unitNumber, unitDialogue.startMs, unitDialogue.endMs);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-soft-sm overflow-hidden transition-all">
      {/* Top Banner & Context Scenario */}
      <div className="bg-gradient-to-r from-sand-100/90 via-white to-ocean-50/50 p-6 border-b border-sand-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-ocean-600 text-white font-bold text-xs tracking-wide shadow-2xs">
                {ds.unitChipPrefix} {unitDialogue.unitNumber}
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold">
                <Headphones className="w-3.5 h-3.5" />
                <span>{ds.audioNativeBadge}</span>
              </span>

              <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded-md bg-sand-200/60">
                {(unitDialogue.lines || []).length} {ds.practiceSentencesLabel}
              </span>

              <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded-md bg-sand-200/60 font-mono">
                {unitDialogue.durationMs ? (unitDialogue.durationMs / 1000).toFixed(1) : '0.0'}s
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {unitDialogue.title}
            </h3>

            {/* Context Box */}
            <div className="flex items-start gap-2 p-3 bg-white/80 rounded-2xl border border-sand-200 text-xs sm:text-sm text-slate-700 max-w-3xl">
              <Compass className="w-4 h-4 text-ocean-600 shrink-0 mt-0.5" />
              <p className="leading-snug">
                <span className="font-bold text-slate-900 mr-1.5">
                  {ds.contextLabel}:
                </span>
                {unitDialogue.contextTr}
              </p>
            </div>
          </div>

          {/* Action Bar (Audio Controls & Jump to Player & Roleplay) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            {/* Speed Control Chips */}
            <div className="flex items-center gap-1 bg-sand-100/90 p-1 rounded-xl border border-sand-200">
              <Gauge className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
              {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onSetSpeed(rate)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    speed === rate
                      ? 'bg-white text-ocean-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Roleplay Simulation Trigger */}
            {onOpenRoleplay && (
              <button
                type="button"
                onClick={() => onOpenRoleplay(unitDialogue)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-sand-100 hover:bg-ocean-50 text-slate-700 hover:text-ocean-800 border border-sand-200 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 text-ocean-600" />
                <span>{ds.roleplayMode || 'Rol Simülasyonu'}</span>
              </button>
            )}

            {/* Play/Stop All Native Dialogue Button */}
            {isPlayingWhole ? (
              <button
                type="button"
                onClick={onStopAudio}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-soft-sm hover:shadow-soft-md transition-all active:scale-95 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>{ds.stopAudioButton}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onPlayWholeDialogue(unitDialogue)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-bold shadow-soft-sm hover:shadow-soft-md transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{ds.listenAllButton}</span>
              </button>
            )}

            {/* Jump to Full Lesson Button */}
            <button
              type="button"
              onClick={handleJumpToLesson}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-sand-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <span>{ds.jumpToUnitPlayer}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Live Whole Dialogue Playback Strip */}
        {isPlayingWhole && (
          <div className="mt-4 pt-3 border-t border-ocean-100 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-1 h-3 bg-ocean-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-3 bg-ocean-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-3 bg-ocean-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs font-bold text-ocean-800">
                {ds.playingAudioLabel || 'Tüm diyalog kesintisiz oynatılıyor...'}
              </span>
            </div>
            <span className="text-[11px] font-mono font-semibold text-ocean-700 bg-ocean-100/60 px-2 py-0.5 rounded-md">
              {speed}x
            </span>
          </div>
        )}
      </div>

      {/* List of Dialogue Lines */}
      <div className="p-6 space-y-3.5 bg-sand-50/30">
        {(unitDialogue.lines || []).map((line) => {
          const isActive = activeLineId === line.id;
          return (
            <DialogueLineItem
              key={line.id}
              line={line}
              unitNumber={unitDialogue.unitNumber}
              isActive={isActive}
              isPlaying={isPlayingAny}
              onPlayLine={(l) => onPlayLine(unitDialogue.unitNumber, l)}
              onOpenDrill={onOpenDrill}
            />
          );
        })}
      </div>

      {/* Key Vocabulary Section */}
      {unitDialogue.keyVocab && unitDialogue.keyVocab.length > 0 && (
        <div className="p-6 bg-sand-50/80 border-t border-sand-200">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-ocean-600" />
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                {ds.keyVocabularyHeading}
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {unitDialogue.keyVocab.length} {ds.dialogueSummaryHeading || 'kilit kelime'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {unitDialogue.keyVocab.map((vocab, idx) => {
              const chipId = `vocab-chip-${unitDialogue.unitNumber}-${vocab.term.toLowerCase().replace(/\s+/g, '-')}`;
              const isChipSaved = !!savedVocabIds[chipId];
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-white border border-sand-200/90 shadow-2xs hover:border-ocean-200 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate select-text">
                      {vocab.term}
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium truncate select-text">
                      {vocab.tr}
                    </p>
                    {vocab.en && (
                      <span className="text-[10px] text-slate-400 italic truncate block">
                        {vocab.en}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePlayVocabSnippet()}
                      title="Telaffuzu Dinle"
                      aria-label="Telaffuzu Dinle"
                      className="p-1.5 rounded-lg bg-sand-100 hover:bg-ocean-100 text-slate-600 hover:text-ocean-700 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveVocabChip(vocab.term, vocab.tr, vocab.en)}
                      title={ds.saveToVocab || 'Kelime Defterine Ekle'}
                      aria-label={ds.saveToVocab || 'Kelime Defterine Ekle'}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isChipSaved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-sand-50 hover:bg-ocean-50 text-slate-500 hover:text-ocean-700 border-sand-200'
                      }`}
                    >
                      {isChipSaved ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <BookmarkPlus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
