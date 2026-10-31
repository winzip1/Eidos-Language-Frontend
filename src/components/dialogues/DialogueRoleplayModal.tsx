/**
 * Eidos Language OS - Dialogue Roleplay & Pronunciation Practice Modal
 * Full interactive conversational roleplay using Web Speech Recognition (de-DE)
 * and native audio snippet synchronization with partner auto-turn playback.
 * Compatible with both 30-Unit Guide Items (Phase 3-8) and legacy UnitDialogue structures.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X,
  Mic,
  MicOff,
  User,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Sparkles,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import type { GuideItem, UnitDialogue } from '../../types';
import { useDictionary, interpolate } from '../../context/DictionaryContext';
import { audioPlayer } from '../../services/audioPlayer';
import { calculateSentenceEndMs } from '../../utils/audioTime';
import { toast } from 'sonner';

export interface DialogueRoleplayModalProps {
  unitNumber: number;
  unitTitle?: string;
  items?: GuideItem[];
  unitDialogue?: UnitDialogue;
  languageId?: string;
  levelId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface RoleplayLine {
  id: string;
  speaker: 'GERMAN_MALE' | 'GERMAN_FEMALE';
  speakerDisplayName: string;
  germanText: string;
  turkishText: string;
  startMs: number;
  endMs: number;
}

export const DialogueRoleplayModal: React.FC<DialogueRoleplayModalProps> = ({
  unitNumber,
  unitTitle,
  items,
  unitDialogue,
  languageId = 'german',
  levelId = 'level1',
  isOpen,
  onClose,
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;
  const ply = dict?.player;

  // Selected User Role: 'GERMAN_MALE' or 'GERMAN_FEMALE'
  const [userRole, setUserRole] = useState<'GERMAN_MALE' | 'GERMAN_FEMALE'>('GERMAN_MALE');
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  // Derive lines from either GuideItem[] or legacy UnitDialogue
  const lines: RoleplayLine[] = useMemo(() => {
    if (items && items.length > 0) {
      return items.map((item, idx) => {
        const isFemale =
          item.speaker?.role === 'Kadın' ||
          item.speaker?.name?.toLowerCase().includes('kadın');
        const speakerCode: 'GERMAN_MALE' | 'GERMAN_FEMALE' = isFemale ? 'GERMAN_FEMALE' : 'GERMAN_MALE';
        const startMs = item.primaryTimeMs || 0;
        const nextItem = idx < items.length - 1 ? items[idx + 1] : null;
        const endMs = calculateSentenceEndMs(startMs, nextItem?.primaryTimeMs, item.originalSentence);

        return {
          id: item.id || `roleplay-line-${idx}`,
          speaker: speakerCode,
          speakerDisplayName: item.speaker?.name || item.speaker?.role || (isFemale ? 'Kadın' : 'Erkek'),
          germanText: item.originalSentence || item.table?.columns?.map((c) => c.german).join(' ') || '',
          turkishText: item.table?.fullTranslation || item.table?.columns?.map((c) => c.turkish).join(' ') || '',
          startMs,
          endMs,
        };
      });
    }

    if (unitDialogue?.lines && unitDialogue.lines.length > 0) {
      return unitDialogue.lines.map((l) => ({
        id: l.id,
        speaker: (l.speaker as 'GERMAN_MALE' | 'GERMAN_FEMALE') || 'GERMAN_MALE',
        speakerDisplayName: l.speakerDisplayName || 'Konuşmacı',
        germanText: l.germanText,
        turkishText: l.turkishText,
        startMs: l.startMs,
        endMs: l.endMs,
      }));
    }

    return [];
  }, [items, unitDialogue]);

  const activeLine = lines[currentLineIndex];

  // Whether current line belongs to the user
  const isUserTurn = activeLine && activeLine.speaker === userRole;

  const handleClose = useCallback(() => {
    audioPlayer.pause();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsRecognizing(false);
    onClose();
  }, [onClose]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Stop audio on unmount or close
  useEffect(() => {
    if (!isOpen) {
      audioPlayer.pause();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    }
  }, [isOpen]);

  // Autoplay partner's turn
  useEffect(() => {
    if (!isOpen || isFinished || !activeLine) return;

    if (!isUserTurn) {
      // Partner's turn: play native audio snippet
      setRecognizedText('');
      setMatchScore(null);
      audioPlayer.playSnippet(
        unitNumber,
        activeLine.startMs,
        activeLine.endMs,
        activeLine.id,
        languageId,
        levelId
      );
    } else {
      // User's turn: pause any playing audio and prepare for voice recognition
      audioPlayer.pause();
      setRecognizedText('');
      setMatchScore(null);
    }
  }, [isOpen, currentLineIndex, isUserTurn, unitNumber, activeLine, isFinished, languageId, levelId]);

  // Normalize German text for string comparison
  const normalizeGerman = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  };

  // Initialize Web Speech API for German
  const startVoiceRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        ply?.voiceNotSupported ||
          'FAIL-LOUD: Tarayıcınızda konuşma tanıma (SpeechRecognition) desteklenmiyor.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'de-DE';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecognizing(true);
        setRecognizedText('');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setRecognizedText(transcript);

        if (activeLine) {
          const target = normalizeGerman(activeLine.germanText);
          const heard = normalizeGerman(transcript);

          const targetWords = target.split(/\s+/).filter(Boolean);
          const heardWords = heard.split(/\s+/).filter(Boolean);

          let wordMatches = 0;
          for (const w of targetWords) {
            if (heardWords.includes(w)) wordMatches++;
          }

          const wordScore = targetWords.length > 0 ? (wordMatches / targetWords.length) * 100 : 0;

          // Character level score for precision
          let charMatches = 0;
          for (let i = 0; i < Math.min(target.length, heard.length); i++) {
            if (target[i] === heard[i]) charMatches++;
          }
          const charScore =
            Math.max(target.length, 1) > 0 ? (charMatches / Math.max(target.length, 1)) * 100 : 0;

          const combinedScore = Math.min(100, Math.round(wordScore * 0.7 + charScore * 0.3));
          setMatchScore(combinedScore);
        }
      };

      recognition.onerror = (event: any) => {
        setIsRecognizing(false);
        if (event.error !== 'no-speech') {
          toast.error(`FAIL-LOUD [SPEECH]: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsRecognizing(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsRecognizing(false);
      toast.error(`FAIL-LOUD: ${err?.message || 'Mikrofon başlatılamadı'}`);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsRecognizing(false);
  };

  const handleNextLine = () => {
    if (currentLineIndex + 1 >= lines.length) {
      setIsFinished(true);
    } else {
      setCurrentLineIndex((prev) => prev + 1);
    }
  };

  const handlePrevLine = () => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex((prev) => prev - 1);
      setIsFinished(false);
    }
  };

  const handlePlayActiveReference = () => {
    if (activeLine) {
      audioPlayer.playSnippet(
        unitNumber,
        activeLine.startMs,
        activeLine.endMs,
        activeLine.id,
        languageId,
        levelId
      );
    }
  };

  const handleRestart = () => {
    setCurrentLineIndex(0);
    setIsFinished(false);
    setRecognizedText('');
    setMatchScore(null);
  };

  if (!isOpen) return null;

  const resolvedTitle = unitTitle || unitDialogue?.title || interpolate(dh.unitLabel, { unit: unitNumber });

  return (
    <div
      data-testid="dialogue-roleplay-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        data-testid="dialogue-roleplay-modal"
        className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-50 via-white to-sky-50/50 p-4 sm:p-5 border-b border-slate-200/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs">
              <Mic className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {dh.roleplayMode} • {interpolate(dh.unitLabel, { unit: unitNumber })}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">{resolvedTitle}</p>
            </div>
          </div>

          <button
            type="button"
            data-testid="roleplay-modal-close-btn"
            onClick={handleClose}
            aria-label="Kapat"
            className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 bg-slate-50/40">
          {/* Character Role Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-700 block">
              {dh.roleplayCharacterPrompt}
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                data-testid="roleplay-select-male-btn"
                onClick={() => {
                  setUserRole('GERMAN_MALE');
                  handleRestart();
                }}
                className={`flex items-center justify-center gap-2 p-3 min-h-[44px] rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  userRole === 'GERMAN_MALE'
                    ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-200 border-sky-600'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{dh.roleplayMalePrompt}</span>
              </button>

              <button
                type="button"
                data-testid="roleplay-select-female-btn"
                onClick={() => {
                  setUserRole('GERMAN_FEMALE');
                  handleRestart();
                }}
                className={`flex items-center justify-center gap-2 p-3 min-h-[44px] rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  userRole === 'GERMAN_FEMALE'
                    ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200 border-indigo-600'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{dh.roleplayFemalePrompt}</span>
              </button>
            </div>
          </div>

          {/* Finished Celebration Screen */}
          {isFinished ? (
            <div
              data-testid="roleplay-finished-card"
              className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 text-center space-y-4 shadow-xs"
            >
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs border border-emerald-100">
                <Sparkles className="w-7 h-7 text-emerald-600" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                {dh.roleplayCompletedTitle}
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                {dh.roleplayCompletedDesc}
              </p>
              <button
                type="button"
                data-testid="roleplay-restart-btn"
                onClick={handleRestart}
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{dh.roleplayRestart}</span>
              </button>
            </div>
          ) : activeLine ? (
            /* Active Turn Card */
            <div className="space-y-3.5">
              {/* Turn Indicator & Line Steps */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-2 text-slate-800">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isUserTurn ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'
                    }`}
                  />
                  {isUserTurn ? dh.roleplayYourTurn : dh.roleplayPartnerTurn}
                </span>
                <span className="text-slate-400 font-mono">
                  {currentLineIndex + 1} / {lines.length}
                </span>
              </div>

              {/* Line Card */}
              <div
                data-testid="roleplay-line-card"
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isUserTurn
                    ? 'bg-white border-emerald-300 ring-2 ring-emerald-100 shadow-xs'
                    : 'bg-white border-slate-200/90 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isUserTurn
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}
                  >
                    {isUserTurn ? dh.roleplayYourLine : activeLine.speakerDisplayName}
                  </span>

                  <button
                    type="button"
                    data-testid="roleplay-listen-ref-btn"
                    onClick={handlePlayActiveReference}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{dh.roleplayListenReference}</span>
                  </button>
                </div>

                {/* German Sentence */}
                <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-relaxed mb-2">
                  {activeLine.germanText}
                </h4>

                {/* Turkish Translation */}
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-normal mb-3">
                  {activeLine.turkishText}
                </p>

                {/* Speech Recording Button (If user turn) */}
                {isUserTurn && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        data-testid="roleplay-mic-toggle-btn"
                        onClick={isRecognizing ? stopVoiceRecognition : startVoiceRecognition}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 ${
                          isRecognizing
                            ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        {isRecognizing ? (
                          <>
                            <MicOff className="w-4 h-4" />
                            <span>{dh.roleplayStopRecording}</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            <span>{dh.roleplayStartRecording}</span>
                          </>
                        )}
                      </button>

                      {matchScore !== null && (
                        <div
                          data-testid="roleplay-score-badge"
                          className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl border text-xs font-bold ${
                            matchScore >= 75
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : matchScore >= 40
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{interpolate(dh.roleplayAccuracy, { score: matchScore })}</span>
                        </div>
                      )}
                    </div>

                    {recognizedText && (
                      <p className="text-xs text-slate-600 bg-slate-100/70 p-2.5 rounded-xl border border-slate-200/60">
                        <span className="font-bold text-slate-800 mr-1.5">{dh.roleplayRecognized}</span>
                        {recognizedText}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
              {dh.noGuidesFoundDesc}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-white p-3.5 sm:p-4 border-t border-slate-200/90 flex items-center justify-between gap-3">
          <button
            type="button"
            data-testid="roleplay-prev-btn"
            onClick={handlePrevLine}
            disabled={currentLineIndex === 0}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentLineIndex === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{dh.roleplayPrevLine}</span>
          </button>

          <button
            type="button"
            data-testid="roleplay-next-btn"
            onClick={handleNextLine}
            className="inline-flex items-center gap-1.5 px-5 py-2 min-h-[44px] rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <span>{currentLineIndex + 1 >= lines.length ? dh.roleplayFinish : dh.roleplayNextLine}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogueRoleplayModal;
