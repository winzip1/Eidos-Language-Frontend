import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, VolumeX, Mic } from 'lucide-react';
import type { AppView, UnitDialogue, DialogueLine, DialoguesApiResponse } from '../../types';
import { useDictionary, initialFallbackDict } from '../../context/DictionaryContext';
import { useCourse } from '../../context/CourseContext';
import { apiRequest } from '../../services/apiClient';
import { audioPlayer } from '../../services/audioPlayer';
import { toast } from 'sonner';
import { DialogueHeader, type DialogueTabMode, type DialogueSpeakerFilter } from './DialogueHeader';
import { UnitDialogueCard } from './UnitDialogueCard';
import { DialogueCheatSheet } from './DialogueCheatSheet';
import { DialogueRoleplayModal } from './DialogueRoleplayModal';
import { DrillPronunciationModal } from '../player/DrillPronunciationModal';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { FALLBACK_DIALOGUES } from './dialoguesData';

interface DialogueStudyCenterProps {
  onNavigate: (view: AppView) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const DialogueStudyCenter: React.FC<DialogueStudyCenterProps> = ({
  onNavigate,
  searchQuery = '',
  onSearchChange,
}) => {
  const { dict } = useDictionary();
  const ds = dict?.dialogueStudy || initialFallbackDict.dialogueStudy;
  const { activeLanguageId, activeLevelId } = useCourse();

  const [dialogues, setDialogues] = useState<UnitDialogue[]>(FALLBACK_DIALOGUES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Tab mode: 'units' | 'cheatSheet' | 'roleplay'
  const [activeTab, setActiveTab] = useState<DialogueTabMode>('units');
  // Selected unit filter (1..10 or 'all')
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<number | 'all'>('all');
  // Speaker filter
  const [speakerFilter, setSpeakerFilter] = useState<DialogueSpeakerFilter>('ALL');

  // Search state
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);

  // Modals state
  const [roleplayModalUnit, setRoleplayModalUnit] = useState<UnitDialogue | null>(null);
  const [drillLine, setDrillLine] = useState<{ unitNumber: number; line: DialogueLine } | null>(null);

  // Audio Playback state
  const [playingUnitNum, setPlayingUnitNum] = useState<number | null>(null);
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);
  const [isPlayingWhole, setIsPlayingWhole] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('eidos_dialogue_speed');
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });

  const [currentMs, setCurrentMs] = useState<number>(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  // Sync with audio engine & cleanup on unmount
  useEffect(() => {
    const unsubTime = audioPlayer.onTimeUpdate((cur) => {
      setCurrentMs(cur);
    });

    const unsubState = audioPlayer.onStateChange((playing) => {
      setIsAudioPlaying(playing);
      if (!playing) {
        setPlayingLineId(null);
        setIsPlayingWhole(false);
      }
    });

    const unsubEnd = audioPlayer.onEnded(() => {
      setIsAudioPlaying(false);
      setPlayingLineId(null);
      setIsPlayingWhole(false);
    });

    const unsubError = audioPlayer.onError((err) => {
      setIsAudioPlaying(false);
      setPlayingLineId(null);
      setIsPlayingWhole(false);
      toast.error(`FAIL-LOUD [AUDIO]: ${err.message}`);
    });

    return () => {
      audioPlayer.pause();
      unsubTime();
      unsubState();
      unsubEnd();
      unsubError();
    };
  }, []);

  // Fetch Dialogues API
  const fetchDialogues = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const lang = activeLanguageId || 'german';
      const lvl = activeLevelId || 'level1';
      const response = await apiRequest<DialoguesApiResponse>(
        `/api/v1/courses/${lang}/levels/${lvl}/dialogues`
      );
      if (response && response.success && response.data?.units && response.data.units.length > 0) {
        setDialogues(response.data.units);
      }
    } catch (err: any) {
      console.warn('[DIALOGUES_FETCH_FALLBACK]', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeLanguageId, activeLevelId]);

  useEffect(() => {
    fetchDialogues();
  }, [fetchDialogues]);

  // Set Speed Handler
  const handleSetSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    audioPlayer.setPlaybackRate(newSpeed);
    try {
      localStorage.setItem('eidos_dialogue_speed', String(newSpeed));
    } catch {
      // ignore
    }
  };

  // Play Whole Dialogue Native Audio
  const handlePlayWholeDialogue = (unit: UnitDialogue) => {
    audioPlayer.setPlaybackRate(speed);
    setPlayingUnitNum(unit.unitNumber);
    setPlayingLineId(null);
    setIsPlayingWhole(true);
    audioPlayer.playSnippet(unit.unitNumber, unit.startMs, unit.endMs);
  };

  // Play Individual Line Native Audio
  const handlePlayLine = (unitNumber: number, line: DialogueLine) => {
    audioPlayer.setPlaybackRate(speed);
    setPlayingUnitNum(unitNumber);
    setPlayingLineId(line.id);
    setIsPlayingWhole(false);
    audioPlayer.playSnippet(unitNumber, line.startMs, line.endMs);
  };

  // Play Generic Snippet (e.g. from cheat sheet)
  const handlePlaySnippet = (unitNumber: number, startMs: number, endMs: number) => {
    audioPlayer.setPlaybackRate(speed);
    setPlayingUnitNum(unitNumber);
    setPlayingLineId(null);
    setIsPlayingWhole(false);
    audioPlayer.playSnippet(unitNumber, startMs, endMs);
  };

  // Stop Audio
  const handleStopAudio = () => {
    audioPlayer.pause();
    setIsAudioPlaying(false);
    setPlayingLineId(null);
    setIsPlayingWhole(false);
  };

  // Handle Tab Change with Audio Safety
  const handleTabChange = (tab: DialogueTabMode) => {
    handleStopAudio();
    if (tab === 'roleplay' && dialogues.length > 0) {
      const selected =
        selectedUnitNumber !== 'all'
          ? dialogues.find((u) => u.unitNumber === selectedUnitNumber) || dialogues[0]
          : dialogues[0];
      setRoleplayModalUnit(selected);
    } else {
      setActiveTab(tab);
    }
  };

  // Compute Active Line ID when whole dialogue or line is playing
  const computedActiveLineId = useMemo<string | null>(() => {
    if (!isAudioPlaying) return null;
    if (playingLineId) return playingLineId;

    if (isPlayingWhole && playingUnitNum) {
      const activeUnit = dialogues.find((u) => u.unitNumber === playingUnitNum);
      if (activeUnit) {
        const found = activeUnit.lines.find(
          (l) => currentMs >= l.startMs && currentMs <= l.endMs + 150
        );
        return found ? found.id : null;
      }
    }

    return null;
  }, [isAudioPlaying, playingLineId, isPlayingWhole, playingUnitNum, dialogues, currentMs]);

  // Search filter
  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  // Filtered unit dialogues
  const filteredUnits = useMemo(() => {
    let list = dialogues;
    if (selectedUnitNumber !== 'all') {
      list = list.filter((u) => u.unitNumber === selectedUnitNumber);
    }

    // Filter lines by speaker if needed
    if (speakerFilter !== 'ALL') {
      list = list
        .map((u) => ({
          ...u,
          lines: u.lines.filter((l) => l.speaker === speakerFilter),
        }))
        .filter((u) => u.lines.length > 0);
    }

    const q = localSearch.toLowerCase().trim();
    if (!q) return list;

    return list.filter((u) => {
      const matchesTitle = (u.title || '').toLowerCase().includes(q);
      const matchesContext = (u.contextTr || '').toLowerCase().includes(q);
      const matchesLines = (u.lines || []).some(
        (l) =>
          (l.germanText || '').toLowerCase().includes(q) ||
          (l.turkishText || '').toLowerCase().includes(q) ||
          (l.englishExplanation || '').toLowerCase().includes(q)
      );
      const matchesVocab = (u.keyVocab || []).some(
        (v) => (v.term || '').toLowerCase().includes(q) || (v.tr || '').toLowerCase().includes(q)
      );

      return matchesTitle || matchesContext || matchesLines || matchesVocab;
    });
  }, [dialogues, selectedUnitNumber, speakerFilter, localSearch]);

  return (
    <div className="min-h-full flex flex-col bg-sand-50/40 pb-20">
      {/* Top Header Banner */}
      <DialogueHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        speakerFilter={speakerFilter}
        onSpeakerFilterChange={setSpeakerFilter}
        searchQuery={localSearch}
        onSearchChange={handleSearchChange}
        totalDialoguesCount={dialogues.length}
      />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Fail-Loud Error State */}
        {fetchError && (
          <EmptyState
            title="Diyaloglar Yüklenemedi (FAIL-LOUD)"
            description={fetchError}
            icon={VolumeX}
            actionLabel="Yeniden Dene"
            onAction={fetchDialogues}
          />
        )}

        {/* Loading Skeleton */}
        {isLoading && !fetchError && (
          <LoadingSkeleton count={3} heightClass="h-64" />
        )}

        {/* Loaded Content */}
        {!isLoading && !fetchError && (
          <>
            {activeTab === 'cheatSheet' ? (
              <DialogueCheatSheet
                onPlaySnippet={handlePlaySnippet}
                onSelectUnit={(unitNum) => {
                  handleStopAudio();
                  setSelectedUnitNumber(unitNum);
                  setActiveTab('units');
                }}
              />
            ) : (
              <div className="space-y-6">
                {/* Horizontal Unit Chip Selector */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 overflow-x-auto scrollbar-thin">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 shrink-0 select-none">
                      {ds.unitChipPrefix}:
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        handleStopAudio();
                        setSelectedUnitNumber('all');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        selectedUnitNumber === 'all'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-sand-100 hover:bg-sand-200/80 text-slate-700'
                      }`}
                    >
                      Tümü (1-10)
                    </button>

                    {dialogues.map((u) => (
                      <button
                        key={u.unitNumber}
                        type="button"
                        onClick={() => {
                          handleStopAudio();
                          setSelectedUnitNumber(u.unitNumber);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          selectedUnitNumber === u.unitNumber
                            ? 'bg-ocean-600 text-white shadow-2xs'
                            : 'bg-sand-100 hover:bg-sand-200/80 text-slate-700'
                        }`}
                      >
                        <span>Ünite {u.unitNumber}</span>
                      </button>
                    ))}
                  </div>

                  {/* Quick Roleplay launcher */}
                  <button
                    type="button"
                    onClick={() => {
                      const selected =
                        selectedUnitNumber !== 'all'
                          ? dialogues.find((u) => u.unitNumber === selectedUnitNumber) || dialogues[0]
                          : dialogues[0];
                      if (selected) setRoleplayModalUnit(selected);
                    }}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ocean-50 hover:bg-ocean-100 text-ocean-700 border border-ocean-200 text-xs font-bold shrink-0 transition-all cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-ocean-600" />
                    <span>{ds.roleplayMode || 'Rol Simülasyonu Başlat'}</span>
                  </button>
                </div>

                {/* Units List */}
                {filteredUnits.length > 0 ? (
                  <div className="space-y-8">
                    {filteredUnits.map((unit) => (
                      <UnitDialogueCard
                        key={unit.unitNumber}
                        unitDialogue={unit}
                        isPlayingWhole={isPlayingWhole && playingUnitNum === unit.unitNumber}
                        activeLineId={playingUnitNum === unit.unitNumber ? computedActiveLineId : null}
                        isPlayingAny={isAudioPlaying && playingUnitNum === unit.unitNumber}
                        speed={speed}
                        onSetSpeed={handleSetSpeed}
                        onPlayWholeDialogue={handlePlayWholeDialogue}
                        onStopAudio={handleStopAudio}
                        onPlayLine={handlePlayLine}
                        onNavigate={onNavigate}
                        onOpenRoleplay={(u) => setRoleplayModalUnit(u)}
                        onOpenDrill={(l) => setDrillLine({ unitNumber: unit.unitNumber, line: l })}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={ds.emptySearchTitle}
                    description={ds.emptySearchDesc}
                    icon={Search}
                    actionLabel="Aramayı Temizle"
                    onAction={() => handleSearchChange('')}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Roleplay Simulation Modal */}
      {roleplayModalUnit && (
        <DialogueRoleplayModal
          unitDialogue={roleplayModalUnit}
          isOpen={true}
          onClose={() => setRoleplayModalUnit(null)}
        />
      )}

      {/* Pronunciation Drill Modal */}
      {drillLine && (
        <DrillPronunciationModal
          isOpen={true}
          onClose={() => setDrillLine(null)}
          segment={{
            id: drillLine.line.id,
            segmentIndex: drillLine.line.segmentIndex,
            startMs: drillLine.line.startMs,
            endMs: drillLine.line.endMs,
            durationMs: drillLine.line.durationMs,
            startTimeFormatted: '',
            endTimeFormatted: '',
            speaker: drillLine.line.speaker,
            speakerDisplayName: drillLine.line.speakerDisplayName,
            textLanguage: 'de',
            rawText: drillLine.line.germanText,
            turkishText: drillLine.line.turkishText,
            englishText: drillLine.line.englishExplanation,
          }}
          unitNumber={drillLine.unitNumber}
        />
      )}
    </div>
  );
};
