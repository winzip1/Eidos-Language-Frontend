/**
 * Eidos Language OS - Drill Pronunciation Modal
 * High-craftsmanship pronunciation & voice recognition practice modal with A-B loop and mastery actions.
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
} from 'lucide-react';
import type { Segment } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { toast } from 'sonner';

interface DrillPronunciationModalProps {
  segment: Segment | null;
  isOpen: boolean;
  onClose: () => void;
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
}) => {
  const { dict } = useDictionary();
  const { seek, unitNumber, speed, setSpeed } = usePlayer();
  const { saveWordMastery } = useAuth();

  const [drillSpeed, setDrillSpeed] = useState<number>(1.0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedTranscript, setRecordedTranscript] = useState<string>('');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const handlePlaySnippet = useCallback(() => {
    if (!segment) return;
    if (drillSpeed !== speed) {
      setSpeed(drillSpeed);
    }
    seek(segment.startMs);
  }, [segment, drillSpeed, speed, setSpeed, seek]);

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
        console.error('Speech recognition error:', event.error);
        setSpeechError(`${dict.player.voicePracticeTitle}: ${event.error}`);
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
      unitNumber || 1,
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
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-ocean-50 text-ocean-800 border border-ocean-200 shadow-xs">
            <User className="w-3.5 h-3.5 text-ocean-600" />
            <span>{dict.speakers.GERMAN_MALE}</span>
          </div>
        );
      case 'GERMAN_FEMALE':
        return (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 shadow-xs">
            <User className="w-3.5 h-3.5 text-purple-600" />
            <span>{dict.speakers.GERMAN_FEMALE}</span>
          </div>
        );
      case 'UNKNOWN':
        return (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-sand-100 text-slate-700 border border-sand-200 shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>{dict.speakers.UNKNOWN}</span>
          </div>
        );
      case 'NARRATOR':
      default:
        return (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-sand-100 text-slate-700 border border-sand-200 shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>{dict.speakers.NARRATOR}</span>
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
      <div className="space-y-5 select-text">
        {/* 1. German Sentence Card */}
        <div className="p-6 bg-gradient-to-br from-sand-50 via-white to-ocean-50/30 border border-sand-200 rounded-3xl space-y-4 shadow-soft">
          <div className="flex items-center justify-between gap-2 border-b border-sand-100 pb-3">
            <div className="flex items-center gap-2">
              {renderSpeakerBadge()}
              <span className="text-xs font-mono font-medium text-slate-500 bg-sand-100/80 px-2 py-0.5 rounded-lg">
                {segment.startTimeFormatted} - {segment.endTimeFormatted}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-ocean-700 bg-ocean-50 border border-ocean-200 px-2.5 py-0.5 rounded-lg">
              <Sparkles className="w-3 h-3" />
              <span>{dict.player.drillFragment}</span>
            </div>
          </div>

          {/* Sentence Title with Word Recognition Highlighting */}
          <div className="text-center py-2 space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug tracking-tight">
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
                            ? 'text-emerald-700 bg-emerald-50 font-extrabold'
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
            {segment.turkishText && (
              <p className="text-sm sm:text-base text-slate-600 font-medium italic">
                {segment.turkishText}
              </p>
            )}
            {segment.englishText && !segment.turkishText && (
              <p className="text-sm sm:text-base text-slate-600 font-medium italic">
                {segment.englishText}
              </p>
            )}
          </div>
        </div>

        {/* 2. Audio Pronunciation & Speed Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Main Play Audio Button */}
          <button
            onClick={handlePlaySnippet}
            aria-label={`${dict.vocabulary.playPronunciation} (${segment.startTimeFormatted})`}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 bg-gradient-to-r from-ocean-600 to-ocean-700 hover:from-ocean-700 hover:to-ocean-800 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-soft transition-all"
          >
            <Volume2 className="w-5 h-5" />
            <span>
              {dict.vocabulary.playPronunciation} ({segment.startTimeFormatted})
            </span>
          </button>

          {/* Practice Speed Toggle (1.0x vs 0.75x Slow) */}
          <div className="flex items-center gap-1 bg-sand-100/90 border border-sand-200 p-1 rounded-2xl">
            <button
              onClick={() => setDrillSpeed(1.0)}
              aria-label={dict.player.normalSpeed}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                drillSpeed === 1.0
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {dict.player.normalSpeed}
            </button>
            <button
              onClick={() => setDrillSpeed(0.75)}
              aria-label={dict.player.slowSpeed}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                drillSpeed === 0.75
                  ? 'bg-ocean-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {dict.player.slowSpeed}
            </button>
          </div>
        </div>

        {/* 3. Voice Microphone Pronunciation Practice */}
        <div className="p-4 bg-sand-50/70 border border-sand-200 rounded-3xl space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-ocean-100 text-ocean-700 rounded-xl">
                <Mic className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                {dict.player.voicePracticeTitle}
              </span>
            </div>

            <button
              onClick={handleToggleVoicePractice}
              aria-label={isRecording ? dict.player.stopRecording : dict.player.startRecording}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-white border border-sand-200 text-slate-700 hover:border-ocean-300 hover:text-ocean-700'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>{dict.player.stopRecording}</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-ocean-600" />
                  <span>{dict.player.startRecording}</span>
                </>
              )}
            </button>
          </div>

          {isRecording && (
            <p className="text-xs text-ocean-700 font-semibold animate-pulse text-center py-1">
              {dict.player.listeningVoice}
            </p>
          )}

          {speechError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{speechError}</span>
            </div>
          )}

          {recordedTranscript && (
            <div className="p-3 bg-white border border-sand-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">
                  {dict.player.voiceHeard}:
                </span>
                {matchScore !== null && (
                  <span
                    className={`font-bold px-2 py-0.5 rounded-lg border ${
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
              <p className="text-sm font-semibold text-slate-800 italic">
                "{recordedTranscript}"
              </p>
            </div>
          )}
        </div>

        {/* 4. Learning & Mastery Status Buttons */}
        <div className="pt-3 border-t border-sand-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => handleSaveStatus('learning')}
            aria-label={dict.vocabulary.learningButton}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-sand-100 hover:bg-sand-200 border border-sand-200 text-slate-700 rounded-2xl text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <BookmarkPlus className="w-4 h-4 text-ocean-600" />
            <span>{dict.vocabulary.learningButton}</span>
          </button>

          <button
            onClick={() => handleSaveStatus('mastered')}
            aria-label={dict.vocabulary.masteredButton}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{dict.vocabulary.masteredButton}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
