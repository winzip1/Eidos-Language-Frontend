import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import type { UnitDialogue } from '../../types';
import { useDictionary, initialFallbackDict } from '../../context/DictionaryContext';
import { audioPlayer } from '../../services/audioPlayer';
import { toast } from 'sonner';

interface DialogueRoleplayModalProps {
  unitDialogue: UnitDialogue;
  isOpen: boolean;
  onClose: () => void;
}

export const DialogueRoleplayModal: React.FC<DialogueRoleplayModalProps> = ({
  unitDialogue,
  isOpen,
  onClose,
}) => {
  const { dict } = useDictionary();
  const ds = dict?.dialogueStudy || initialFallbackDict.dialogueStudy;
  const ply = dict?.player || initialFallbackDict.player;

  // Selected User Role: 'GERMAN_MALE' or 'GERMAN_FEMALE'
  const [userRole, setUserRole] = useState<'GERMAN_MALE' | 'GERMAN_FEMALE'>('GERMAN_MALE');
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  const lines = unitDialogue.lines || [];
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
      // Partner's turn: play native audio
      setRecognizedText('');
      setMatchScore(null);
      audioPlayer.playSnippet(unitDialogue.unitNumber, activeLine.startMs, activeLine.endMs);
    } else {
      // User's turn: stop any audio, wait for user input
      audioPlayer.pause();
      setRecognizedText('');
      setMatchScore(null);
    }
  }, [isOpen, currentLineIndex, isUserTurn, unitDialogue.unitNumber, activeLine, isFinished]);

  // Normalize German text for comparison
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
      toast.error(ply.voiceNotSupported || 'FAIL-LOUD: Tarayıcınızda konuşma tanıma (SpeechRecognition) desteklenmiyor.');
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

          const targetWords = target.split(/\s+/);
          const heardWords = heard.split(/\s+/);

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
          const charScore = Math.max(target.length, 1) > 0 ? (charMatches / Math.max(target.length, 1)) * 100 : 0;

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
      audioPlayer.playSnippet(unitDialogue.unitNumber, activeLine.startMs, activeLine.endMs);
    }
  };

  const handleRestart = () => {
    setCurrentLineIndex(0);
    setIsFinished(false);
    setRecognizedText('');
    setMatchScore(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-sand-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sand-100/90 via-white to-ocean-50/70 p-5 border-b border-sand-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-ocean-100 text-ocean-700">
              <Mic className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {ds.roleplayMode || 'Rol Simülasyonu'} • {ds.unitChipPrefix} {unitDialogue.unitNumber}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">{unitDialogue.title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Kapat"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-sand-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-sand-50/30">
          {/* Character Role Selector */}
          <div className="bg-white p-4 rounded-2xl border border-sand-200 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-600 block">
              Hangi karakterin rolünü canlandırmak istersiniz?
            </span>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setUserRole('GERMAN_MALE');
                  handleRestart();
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  userRole === 'GERMAN_MALE'
                    ? 'bg-ocean-600 text-white shadow-soft-sm ring-2 ring-ocean-200 border-ocean-600'
                    : 'bg-sand-50 hover:bg-sand-100 text-slate-700 border-sand-200'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{ds.roleplayMalePrompt || 'Erkek Rolü (Sen)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserRole('GERMAN_FEMALE');
                  handleRestart();
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  userRole === 'GERMAN_FEMALE'
                    ? 'bg-rose-600 text-white shadow-soft-sm ring-2 ring-rose-200 border-rose-600'
                    : 'bg-sand-50 hover:bg-sand-100 text-slate-700 border-sand-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{ds.roleplayFemalePrompt || 'Kadın Rolü (Sen)'}</span>
              </button>
            </div>
          </div>

          {/* Finished Celebration Screen */}
          {isFinished ? (
            <div className="bg-white rounded-3xl border border-emerald-200 p-8 text-center space-y-4 shadow-soft">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                <Sparkles className="w-7 h-7 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">
                Tebrikler! Diyaloğu Tamamladınız
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tüm replikleri başarıyla seslendirdiniz ve diyalog pratiğini bitirdiniz.
              </p>
              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs shadow-soft-sm transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Diyaloğu Baştan Oyna</span>
              </button>
            </div>
          ) : activeLine ? (
            /* Active Turn Card */
            <div className="space-y-4">
              {/* Turn Indicator & Line Steps */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5 text-slate-800">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isUserTurn ? 'bg-emerald-500 animate-pulse' : 'bg-ocean-500'
                    }`}
                  />
                  {isUserTurn ? 'Senin Sıran! (Konuş)' : 'Partnerinin Sırası (Dinle)'}
                </span>
                <span className="text-slate-400">
                  {currentLineIndex + 1} / {lines.length}
                </span>
              </div>

              {/* Line Card */}
              <div
                className={`p-6 rounded-3xl border transition-all ${
                  isUserTurn
                    ? 'bg-white border-emerald-300 ring-2 ring-emerald-100 shadow-soft-md'
                    : 'bg-white border-ocean-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isUserTurn
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-ocean-50 text-ocean-700 border border-ocean-200'
                    }`}
                  >
                    {isUserTurn ? 'Senin Repliğin' : activeLine.speakerDisplayName}
                  </span>

                  <button
                    type="button"
                    onClick={handlePlayActiveReference}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sand-100 hover:bg-ocean-50 text-slate-700 hover:text-ocean-700 border border-sand-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Örnek Sesi Dinle</span>
                  </button>
                </div>

                {/* German Sentence */}
                <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-relaxed mb-2">
                  {activeLine.germanText}
                </h4>

                {/* Turkish Translation */}
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-normal mb-4">
                  {activeLine.turkishText}
                </p>

                {/* Speech Recording Button (If user turn) */}
                {isUserTurn && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={isRecognizing ? stopVoiceRecognition : startVoiceRecognition}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 ${
                          isRecognizing
                            ? 'bg-rose-600 text-white shadow-soft animate-pulse'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft'
                        }`}
                      >
                        {isRecognizing ? (
                          <>
                            <MicOff className="w-4 h-4" />
                            <span>Kaydı Durdur</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            <span>Mikrofon ile Seslendir</span>
                          </>
                        )}
                      </button>

                      {matchScore !== null && (
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                            matchScore >= 75
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : matchScore >= 40
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Doğruluk: %{matchScore}</span>
                        </div>
                      )}
                    </div>

                    {recognizedText && (
                      <p className="text-xs text-slate-600 bg-sand-100/60 p-2.5 rounded-xl">
                        <span className="font-bold text-slate-800 mr-1">Algılanan:</span>
                        {recognizedText}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-white p-4 border-t border-sand-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrevLine}
            disabled={currentLineIndex === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentLineIndex === 0
                ? 'bg-sand-100 text-slate-400 cursor-not-allowed'
                : 'bg-sand-100 hover:bg-sand-200 text-slate-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Önceki Replik</span>
          </button>

          <button
            type="button"
            onClick={handleNextLine}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-bold shadow-soft-sm transition-all cursor-pointer active:scale-95"
          >
            <span>{currentLineIndex + 1 >= lines.length ? 'Tamamla' : 'Sonraki Replik'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
