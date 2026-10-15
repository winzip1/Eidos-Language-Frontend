/**
 * Eidos Language OS - Drill Pronunciation Modal
 * High-craftsmanship pronunciation & voice recognition practice modal with A-B loop and mastery actions.
 * Redesigned into a single focused voice & audio studio box to prevent vertical viewport overflow.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  CheckCircle2,
  BookmarkPlus,
  Sparkles,
  User,
  BookOpen,
  Mic,
  MicOff,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import type { Segment } from '../../types';
import { isFragmentSegment } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { toast } from 'sonner';

export interface DrillPronunciationModalProps {
  segment: Segment | null;
  isOpen: boolean;
  onClose: () => void;
  unitNumber?: number;
}

// Deterministic similarity score calculation (0 - 100%)
function calculateSimilarity(str1: string, str2: string): number {
  const clean1 = str1.toLowerCase().replace(/[^a-zA-Zäöüß0-9]/g, ' ').trim();
  const clean2 = str2.toLowerCase().replace(/[^a-zA-Zäöüß0-9]/g, ' ').trim();
  if (!clean1 || !clean2) return 0;
  if (clean1 === clean2) return 100;

  const words1 = clean1.split(/\s+/);
  const words2 = clean2.split(/\s+/);

  let matchCount = 0;
  words1.forEach((w) => {
    if (words2.includes(w)) matchCount++;
  });

  const baseScore = (matchCount / Math.max(words1.length, words2.length)) * 100;
  return Math.min(100, Math.max(0, Math.round(baseScore)));
}

export const DrillPronunciationModal: React.FC<DrillPronunciationModalProps> = ({
  segment,
  isOpen,
  onClose,
  unitNumber: propUnitNumber,
}) => {
  const { dict } = useDictionary();
  const { seek, unitNumber: contextUnitNumber, speed, setSpeed } = usePlayer();
  const { saveWordMastery } = useAuth();

  const [drillSpeed, setDrillSpeed] = useState<number>(1.0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedTranscript, setRecordedTranscript] = useState<string>('');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const activeUnitNumber = propUnitNumber || contextUnitNumber || 1;

  const handlePlaySnippet = useCallback(() => {
    if (!segment) return;
    // Acoustic isolation: Stop mic recording if active to prevent audio feedback loop
    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      setIsRecording(false);
    }
    if (drillSpeed !== speed) {
      setSpeed(drillSpeed);
    }
    seek(segment.startMs);
  }, [segment, isRecording, drillSpeed, speed, setSpeed, seek]);

  // Clean up recognition on modal close or unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setRecordedTranscript('');
      setMatchScore(null);
      setSpeechError(null);
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsRecording(false);
    }
  }, [isOpen, segment]);

  // Keyboard shortcut inside modal: Space triggers audio snippet replay
  useEffect(() => {
    if (!isOpen || !segment) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isRecording) {
        e.preventDefault();
        handlePlaySnippet();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, segment, isRecording, handlePlaySnippet]);

  // Initialize Speech Recognition if supported
  const handleToggleVoicePractice = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsRecording(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechError(dict.player.voiceNotSupported);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'de-DE';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
        setRecordedTranscript('');
        setMatchScore(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setRecordedTranscript(transcript);
        if (segment) {
          const score = calculateSimilarity(segment.rawText, transcript);
          setMatchScore(score);
        }
      };

      recognition.onerror = (event: any) => {
        const errDetail = event.error === 'not-allowed'
          ? 'Mikrofon izni reddedildi (Permission Denied)'
          : event.error === 'no-speech'
          ? 'Ses algılanamadı (No Speech)'
          : event.error;
        setSpeechError(`${dict.player.voicePracticeTitle}: ${errDetail}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setSpeechError(err?.message || dict.player.voiceNotSupported);
      setIsRecording(false);
    }
  };

  if (!segment) return null;

  const handleSaveStatus = (status: 'learning' | 'mastered') => {
    saveWordMastery(
      segment.id,
      status,
      activeUnitNumber,
      segment.rawText,
      segment.turkishText || '',
      segment.englishText || ''
    );
    toast.success(
      status === 'mastered' ? dict.badges.mastered : dict.badges.learning,
      {
        description: segment.rawText,
      }
    );
    onClose();
  };

  const renderSpeakerBadge = () => {
    switch (segment.speaker) {
      case 'GERMAN_MALE':
        return (
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-bold bg-ocean-50 text-ocean-800 border border-ocean-200 shadow-2xs">
            <User className="w-3.5 h-3.5 text-ocean-600" />
            <span>{dict.speakers.GERMAN_MALE}</span>
          </div>
        );
      case 'GERMAN_FEMALE':
        return (
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs">
            <User className="w-3.5 h-3.5 text-purple-600" />
            <span>{dict.speakers.GERMAN_FEMALE}</span>
          </div>
        );
      case 'UNKNOWN':
      case 'NARRATOR':
      default:
        return (
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-bold bg-sand-100 text-slate-700 border border-sand-200 shadow-2xs">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>{segment.speaker ? (dict.speakers as any)[segment.speaker] || dict.speakers.NARRATOR : dict.speakers.NARRATOR}</span>
          </div>
        );
    }
  };

  // Split sentence to highlight spoken words
  const recognizedWords = recordedTranscript
    ? recordedTranscript.toLowerCase().replace(/[^a-zA-Zäöüß0-9]/g, ' ').split(/\s+/)
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dict.player.drillPracticeTitle}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-4 select-text">
        {/* 1. Sentence Hero Card (Compact, readable, non-overflowing) */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-sand-50 via-white to-ocean-50/20 border border-sand-200 rounded-2xl space-y-3 shadow-2xs">
          <div className="flex items-center justify-between gap-2 border-b border-sand-100 pb-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              {renderSpeakerBadge()}
              <span className="text-xs font-mono font-medium text-slate-500 bg-sand-100/90 px-2 py-0.5 rounded-lg border border-sand-200/80">
                {segment.startTimeFormatted} - {segment.endTimeFormatted}
              </span>
            </div>

            {isFragmentSegment(segment) ? (
              <div
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg shadow-2xs"
                title={
                  segment.displayContext ||
                  (segment.targetPhrase
                    ? dict.player.partOfTargetPhrase.replace('{target}', segment.targetPhrase)
                    : dict.player.drillFragmentLabel)
                }
              >
                <span className="text-xs" aria-hidden="true">🧩</span>
                <span>{dict.player.drillFragmentLabel}</span>
                {segment.targetPhrase && (
                  <span className="font-semibold text-indigo-900 ml-0.5 hidden xs:inline">
                    · «{segment.targetPhrase}»
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] font-bold text-ocean-700 bg-ocean-50 border border-ocean-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                <Sparkles className="w-3 h-3 text-ocean-600" aria-hidden="true" />
                <span>{dict.player.listenAndRepeatLabel}</span>
              </div>
            )}
          </div>

          {/* German Sentence with Word Highlight */}
          <div className="text-center py-1 space-y-1.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug tracking-tight">
              {segment.words && segment.words.length > 0 ? (
                <span className="inline-flex flex-wrap justify-center gap-x-1.5 gap-y-1">
                  {segment.words.map((w, idx) => {
                    const cleanW = w.t.toLowerCase().replace(/[^a-zA-Zäöüß0-9]/g, '');
                    const isSpoken = recognizedWords.includes(cleanW);
                    return (
                      <span
                        key={idx}
                        className={`transition-colors rounded-md px-1 ${
                          recordedTranscript && isSpoken
                            ? 'text-emerald-700 bg-emerald-50 font-extrabold ring-1 ring-emerald-200'
                            : 'text-slate-900'
                        }`}
                      >
                        {w.t}
                      </span>
                    );
                  })}
                </span>
              ) : (
                `"${segment.rawText}"`
              )}
            </h2>

            {/* Syllable Context */}
            {isFragmentSegment(segment) && (segment.displayContext || segment.targetPhrase) && (
              <p className="text-xs text-indigo-700 font-medium italic select-text flex items-center justify-center gap-1.5">
                <span className="text-xs" aria-hidden="true">🧩</span>
                <span>
                  {segment.displayContext ||
                    dict.player.partOfTargetPhrase.replace('{target}', segment.targetPhrase || '')}
                </span>
              </p>
            )}

            {/* Translation */}
            {segment.turkishText && (
              <p className="text-xs sm:text-sm text-slate-600 font-medium italic">
                {segment.turkishText}
              </p>
            )}
            {segment.englishText && !segment.turkishText && (
              <p className="text-xs sm:text-sm text-slate-600 font-medium italic">
                {segment.englishText}
              </p>
            )}
          </div>
        </div>

        {/* 2. Unified Focus Studio Box (Audio Playback + Voice Recording + Live Feedback in ONE Box) */}
        <div className="bg-sand-50/70 border border-sand-200 rounded-2xl p-4 space-y-3.5 shadow-2xs">
          {/* Controls Bar: Play Audio + Speed Toggle + Mic Trigger */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
            {/* Audio Snippet Replay with Speed Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePlaySnippet}
                aria-label={`${dict.vocabulary.playPronunciation} (${segment.startTimeFormatted})`}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow-2xs hover:shadow-soft transition-all active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>{dict.vocabulary.playPronunciation}</span>
              </button>

              <div className="flex items-center gap-0.5 bg-white border border-sand-200 p-0.5 rounded-xl shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => setDrillSpeed(1.0)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    drillSpeed === 1.0
                      ? 'bg-ocean-50 text-ocean-700'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  1.0x
                </button>
                <button
                  type="button"
                  onClick={() => setDrillSpeed(0.75)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    drillSpeed === 0.75
                      ? 'bg-ocean-50 text-ocean-700'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  0.75x
                </button>
              </div>
            </div>

            {/* Voice Recording Button */}
            <button
              type="button"
              onClick={handleToggleVoicePractice}
              aria-label={isRecording ? dict.player.stopRecording : dict.player.startRecording}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-white border border-sand-200 text-slate-700 hover:border-ocean-300 hover:text-ocean-700 hover:bg-sand-50'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>{dict.player.stopRecording}</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-ocean-600" />
                  <span>{dict.player.startRecording}</span>
                </>
              )}
            </button>
          </div>

          {/* Live Recording / Listening Status */}
          {isRecording && (
            <div className="p-2 bg-ocean-50/80 border border-ocean-200 rounded-xl flex items-center justify-center gap-2 text-xs text-ocean-800 font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{dict.player.listeningVoice}</span>
            </div>
          )}

          {speechError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{speechError}</span>
            </div>
          )}

          {/* Voice Heard & Match Score Feedback */}
          {recordedTranscript ? (
            <div className="p-3 bg-white border border-sand-200 rounded-xl space-y-1.5 shadow-2xs animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">
                  {dict.player.voiceHeard}:
                </span>
                {matchScore !== null && (
                  <span
                    className={`font-bold px-2 py-0.5 rounded-lg border text-xs ${
                      matchScore >= 80
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : matchScore >= 50
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-rose-50 border-rose-300 text-rose-800'
                    }`}
                  >
                    {dict.player.voiceMatchScore}: %{matchScore}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 italic">
                "{recordedTranscript}"
              </p>
            </div>
          ) : (
            !isRecording && (
              <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1 py-0.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>{dict.player.voicePracticeDesc}</span>
              </p>
            )
          )}
        </div>

        {/* 3. Learning & Mastery Status Buttons */}
        <div className="pt-2 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSaveStatus('learning')}
            aria-label={dict.vocabulary.learningButton}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 bg-sand-100/90 hover:bg-sand-200 border border-sand-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <BookmarkPlus className="w-4 h-4 text-ocean-600" />
            <span>{dict.vocabulary.learningButton}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveStatus('mastered')}
            aria-label={dict.vocabulary.masteredButton}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{dict.vocabulary.masteredButton}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
