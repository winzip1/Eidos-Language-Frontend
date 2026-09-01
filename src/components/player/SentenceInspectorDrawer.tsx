/**
 * Eidos Language OS - Sentence Inspector Drawer
 * In-depth morphological & word-by-word timing inspection drawer for active German sentences.
 */
import React, { useEffect } from 'react';
import {
  X,
  Volume2,
  Copy,
  Sparkles,
  BookmarkPlus,
  User,
  BookOpen,
  Check,
  Languages,
  Clock,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import type { Segment, WordToken } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface SentenceInspectorDrawerProps {
  segment: Segment | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenDrill: (segment: Segment) => void;
  unitNumber: number | null;
}

export const SentenceInspectorDrawer: React.FC<SentenceInspectorDrawerProps> = ({
  segment,
  isOpen,
  onClose,
  onOpenDrill,
  unitNumber,
}) => {
  const { dict } = useDictionary();
  const { playSnippet, seek } = usePlayer();
  const { saveWordMastery, getWordStatus } = useAuth();
  const [copied, setCopied] = React.useState(false);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !segment) return null;

  const currentUnitNum = unitNumber || 1;

  const handleCopyText = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(segment.rawText);
    setCopied(true);
    toast.success(dict.player.segmentCopied, {
      description: segment.rawText,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayWordSnippet = (word: WordToken) => {
    playSnippet(currentUnitNum, word.s, word.e + 150);
  };

  const handleBookmarkWord = (word: WordToken) => {
    const wordKey = `word-${word.s}-${word.e}`;
    const currentStatus = getWordStatus(wordKey);
    const nextStatus = currentStatus === 'learning' ? 'mastered' : 'learning';

    saveWordMastery(
      wordKey,
      nextStatus,
      currentUnitNum,
      word.t,
      segment.turkishText || '',
      segment.englishText || ''
    );
    toast.success(
      nextStatus === 'mastered' ? dict.badges.mastered : dict.badges.learning,
      {
        description: word.t,
      }
    );
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

  const wordsList = segment.words || [];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end animate-fade-in"
    >
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-sand-200 flex flex-col transform transition-transform duration-300 ease-in-out"
        role="dialog"
        aria-modal="true"
        aria-label={dict.player.inspectorTitle}
      >
        {/* 1. Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-sand-100 flex items-center justify-between gap-3 bg-sand-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-ocean-50 border border-ocean-200/80 rounded-2xl text-ocean-700">
              <Layers className="w-5 h-5 text-ocean-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">
                {dict.player.inspectorTitle}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {dict.player.inspectorSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyText}
              aria-label={dict.player.copySentence}
              title={dict.player.copySentence}
              className="p-2 bg-sand-100 hover:bg-sand-200 text-slate-600 rounded-xl transition-all shadow-xs"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              aria-label={dict.player.closeInspector}
              title={dict.player.closeInspector}
              className="p-2 bg-sand-100 hover:bg-sand-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all shadow-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 select-text">
          {/* Main Sentence Card */}
          <div className="p-5 bg-gradient-to-br from-sand-50 via-white to-ocean-50/20 border border-sand-200 rounded-3xl space-y-3.5 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {renderSpeakerBadge()}
                <span className="text-xs font-mono font-medium text-slate-500 bg-sand-100/90 border border-sand-200/80 px-2 py-0.5 rounded-lg">
                  {segment.startTimeFormatted} - {segment.endTimeFormatted}
                </span>
              </div>

              <span className="text-[11px] font-semibold text-slate-500 bg-sand-50 border border-sand-200 px-2 py-0.5 rounded-lg">
                {dict.player.sentenceLength}: {wordsList.length}
              </span>
            </div>

            <div className="pt-1">
              <p className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                "{segment.rawText}"
              </p>
            </div>

            {/* Translation Block */}
            {(segment.turkishText || segment.englishText) && (
              <div className="pt-3 border-t border-sand-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Languages className="w-3.5 h-3.5 text-ocean-600" />
                  <span>{dict.player.showTranslation}</span>
                </div>
                {segment.turkishText && (
                  <p className="text-sm font-medium text-slate-700 italic">
                    {segment.turkishText}
                  </p>
                )}
                {segment.englishText && !segment.turkishText && (
                  <p className="text-sm font-medium text-slate-600 italic">
                    {segment.englishText}
                  </p>
                )}
              </div>
            )}

            {/* Quick Actions Row */}
            <div className="pt-3 border-t border-sand-100 flex items-center justify-between gap-2">
              <button
                onClick={() => seek(segment.startMs)}
                aria-label={dict.player.jumpToSegment}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
              >
                <Volume2 className="w-4 h-4" />
                <span>{dict.player.playLabel}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenDrill(segment);
                }}
                aria-label={dict.player.practicePronunciation}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-ocean-50 hover:bg-ocean-100 border border-ocean-200 text-ocean-800 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-ocean-600" />
                <span>{dict.player.practicePronunciation}</span>
              </button>
            </div>
          </div>

          {/* Word-by-Word Breakdown Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {dict.player.wordBreakdown}
                </h3>
                <span className="text-xs font-mono font-bold text-ocean-700 bg-ocean-50 border border-ocean-200/80 px-2 py-0.5 rounded-lg">
                  {wordsList.length}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {dict.player.wordTiming}
              </span>
            </div>

            {wordsList.length === 0 ? (
              <div className="p-4 bg-sand-50 rounded-2xl border border-sand-200 text-center text-xs text-slate-500">
                {dict.player.noMatchingSegments}
              </div>
            ) : (
              <div className="space-y-2">
                {wordsList.map((word, idx) => {
                  const wordKey = `word-${word.s}-${word.e}`;
                  const wordStatus = getWordStatus(wordKey);

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white hover:bg-sand-50/60 border border-sand-200 rounded-2xl flex items-center justify-between gap-3 transition-colors shadow-2xs group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-400 w-5">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {word.t}
                            </span>
                            {wordStatus !== 'unseen' && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                                  wordStatus === 'mastered'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-ocean-50 text-ocean-800 border-ocean-200'
                                }`}
                              >
                                {wordStatus === 'mastered'
                                  ? dict.badges.mastered
                                  : dict.badges.learning}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {(word.s / 1000).toFixed(2)}s - {(word.e / 1000).toFixed(2)}s
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                        <button
                          onClick={() => handlePlayWordSnippet(word)}
                          aria-label={`${dict.player.listenWord}: ${word.t}`}
                          title={`${dict.player.listenWord}: ${word.t}`}
                          className="p-2 bg-sand-100 hover:bg-ocean-50 hover:text-ocean-700 border border-sand-200 text-slate-600 rounded-xl text-xs transition-all shadow-xs"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleBookmarkWord(word)}
                          aria-label={`${dict.player.saveToVocabulary}: ${word.t}`}
                          title={`${dict.player.saveToVocabulary}: ${word.t}`}
                          className={`p-2 rounded-xl text-xs transition-all shadow-xs ${
                            wordStatus === 'mastered'
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                              : wordStatus === 'learning'
                              ? 'bg-ocean-50 border border-ocean-200 text-ocean-700'
                              : 'bg-sand-100 hover:bg-sand-200 border border-sand-200 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {wordStatus === 'mastered' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <BookmarkPlus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. Drawer Footer */}
        <div className="p-4 sm:p-5 border-t border-sand-100 bg-sand-50/40 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            aria-label={dict.player.closeInspector}
            className="w-full py-2.5 px-4 bg-sand-100 hover:bg-sand-200 text-slate-700 font-bold text-xs rounded-2xl transition-all shadow-xs active:scale-95"
          >
            {dict.player.closeInspector}
          </button>
        </div>
      </div>
    </div>
  );
};
