/**
 * Eidos Language OS - Sentence Inspector Drawer
 * In-depth morphological & word-by-word timing inspection drawer for active German sentences.
 * Elevated with modern Yacht-Deck aesthetic, body scroll-lock, Esc/backdrop dismissal,
 * and high-ergonomics 44px+ touch targets.
 */
import React, { useEffect, useRef } from 'react';
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
  Activity,
} from 'lucide-react';
import type { Segment, WordToken } from '../../types';
import { isFragmentSegment, getFragmentRoleLabel } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export interface SentenceInspectorDrawerProps {
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
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  // Close on Escape key press and manage body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !segment) return null;

  const currentUnitNum = unitNumber || 1;

  const handleCopyText = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(segment.rawText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = segment.rawText;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success(dict.player.segmentCopied, {
        description: segment.rawText,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(dict.errors?.unexpected || 'Copy failed');
    }
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
            <span>
              {segment.speaker
                ? (dict.speakers as any)[segment.speaker] || dict.speakers.NARRATOR
                : dict.speakers.NARRATOR}
            </span>
          </div>
        );
    }
  };

  const wordsList = segment.words || [];

  return (
    <div
      onMouseDown={(e) => {
        mouseDownTargetRef.current = e.target;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && mouseDownTargetRef.current === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/35 backdrop-blur-xs flex justify-end animate-fade-in"
    >
      <div
        className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl bg-white h-full shadow-2xl border-l border-sand-200 flex flex-col transform transition-transform duration-300 ease-in-out animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-label={dict.player.inspectorTitle}
      >
        {/* 1. Drawer Header (Sticky & High-Contrast) */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-sand-100 flex items-center justify-between gap-3 bg-sand-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-ocean-50 text-ocean-600 flex items-center justify-center border border-ocean-200/80 shadow-2xs shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                {dict.player.inspectorTitle}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {dict.player.inspectorSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleCopyText}
              aria-label={dict.player.copySentence}
              title={dict.player.copySentence}
              className="p-2 bg-sand-100 hover:bg-sand-200 text-slate-600 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={dict.player.closeInspector}
              title={dict.player.closeInspector}
              className="p-2 bg-sand-100 hover:bg-sand-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 select-text overscroll-contain">
          {/* Main Sentence Hero Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-sand-50 via-white to-ocean-50/20 border border-sand-200 rounded-2xl space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center flex-wrap gap-2">
                {renderSpeakerBadge()}
                <span className="text-xs font-mono font-medium text-slate-500 bg-sand-100/90 border border-sand-200/80 px-2 py-0.5 rounded-lg">
                  {segment.startTimeFormatted} - {segment.endTimeFormatted}
                </span>

                {/* Language Pill Badge (DE / EN) */}
                {segment.textLanguage && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border tracking-wider uppercase shadow-2xs ${
                      segment.textLanguage.toLowerCase() === 'de'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                        : 'bg-amber-50 text-amber-800 border-amber-200/90'
                    }`}
                    title={
                      segment.textLanguage.toLowerCase() === 'de'
                        ? dict.player.languageGerman
                        : dict.player.languageEnglish
                    }
                  >
                    {segment.textLanguage.toLowerCase() === 'de'
                      ? dict.player.languageBadgeDe
                      : dict.player.languageBadgeEn}
                  </span>
                )}

                {isFragmentSegment(segment) && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-lg shadow-2xs">
                    <span className="text-xs" aria-hidden="true">🧩</span>
                    <span>{dict.player.drillFragmentLabel}</span>
                    {segment.targetPhrase && (
                      <span className="font-semibold text-indigo-900 ml-0.5">
                        · «{segment.targetPhrase}»
                      </span>
                    )}
                  </span>
                )}
              </div>

              <span className="text-[11px] font-semibold text-slate-500 bg-white border border-sand-200 px-2 py-0.5 rounded-lg shadow-2xs">
                {dict.player.sentenceLength}: {wordsList.length}
              </span>
            </div>

            <div className="pt-0.5">
              <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                "{segment.rawText}"
              </p>
            </div>

            {/* Translation Block */}
            {segment.turkishText || segment.englishText ? (
              <div className="pt-2.5 border-t border-sand-100 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Languages className="w-3.5 h-3.5 text-ocean-600" />
                  <span>{dict.player.showTranslation}</span>
                </div>
                {segment.turkishText && (
                  <p className="text-xs sm:text-sm font-medium text-slate-700 italic">
                    {segment.turkishText}
                  </p>
                )}
                {segment.englishText && !segment.turkishText && (
                  <p className="text-xs sm:text-sm font-medium text-slate-600 italic">
                    {segment.englishText}
                  </p>
                )}
              </div>
            ) : isFragmentSegment(segment) ? (
              <div className="pt-2.5 border-t border-sand-100 flex items-center gap-2 text-xs text-slate-500">
                <Languages className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="italic text-slate-600 text-xs">
                  {dict.player.partOfTargetPhrase.replace('{target}', segment.targetPhrase || '')}
                </span>
              </div>
            ) : null}

            {/* Quick Actions Row */}
            <div className="pt-3 border-t border-sand-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => seek(segment.startMs)}
                aria-label={dict.player.jumpToSegment}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
              >
                <Volume2 className="w-4 h-4" />
                <span>{dict.player.playLabel}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDrill(segment);
                }}
                aria-label={dict.player.practicePronunciation}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-ocean-50 hover:bg-ocean-100/90 border border-ocean-200 text-ocean-800 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
              >
                <Sparkles className="w-4 h-4 text-ocean-600" />
                <span>{dict.player.practicePronunciation}</span>
              </button>
            </div>
          </div>

          {/* Acoustic F0 Pitch & Diarization Metrics Card */}
          {(segment.pitch || segment.bilingualDetection) && (
            <div className="p-3.5 rounded-2xl bg-ocean-50/50 border border-ocean-200/70 space-y-2.5 animate-fade-in shadow-2xs">
              {segment.pitch && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ocean-900 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-ocean-600" />
                      <span>{dict.player.pitchGenderLabel}</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-ocean-200 text-ocean-800 shadow-2xs">
                      {segment.pitch.estimatedGender === 'FEMALE'
                        ? dict.player.pitchVocalProfileFemale
                        : segment.pitch.estimatedGender === 'MALE'
                        ? dict.player.pitchVocalProfileMale
                        : segment.pitch.estimatedGender === 'UNVOICED'
                        ? dict.player.pitchVocalProfileUnvoiced
                        : dict.player.pitchVocalProfileAmbiguous}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-0.5 text-xs">
                    <div className="bg-white/95 p-2 rounded-xl border border-ocean-100 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-500 font-medium">{dict.player.pitchF0Label}:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {segment.pitch.f0MedianHz > 0 ? `${segment.pitch.f0MedianHz.toFixed(1)} Hz` : '—'}
                      </span>
                    </div>
                    <div className="bg-white/95 p-2 rounded-xl border border-ocean-100 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-500 font-medium">{dict.player.pitchVoicedRatioLabel}:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {(segment.pitch.voicedRatio * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </>
              )}

              {segment.bilingualDetection && (
                <div className="pt-2 border-t border-ocean-100/80 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-ocean-600" />
                    <span>{dict.player.bilingualDetectionLabel}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-ocean-900 bg-white px-2 py-0.5 rounded-md border border-ocean-200 shadow-2xs">
                    {segment.bilingualDetection.rationale || `${segment.bilingualDetection.language.toUpperCase()} (${(segment.bilingualDetection.confidence * 100).toFixed(0)}%)`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Pedagogical Back-Chaining Syllable Card */}
          {isFragmentSegment(segment) && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2 animate-fade-in shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <span className="text-xs" aria-hidden="true">🧩</span>
                  <span>{dict.player.syllableBreakdownLabel}</span>
                </span>
                {segment.fragmentRole && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-md shadow-2xs">
                    {getFragmentRoleLabel(segment.fragmentRole, dict.player)}
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-800 font-medium italic leading-relaxed">
                {segment.displayContext ||
                  dict.player.partOfTargetPhrase.replace('{target}', segment.targetPhrase || '')}
              </p>
              {segment.flags && segment.flags.length > 0 && (
                <div className="flex items-center flex-wrap gap-1 pt-0.5">
                  {segment.flags.map((flag, fIdx) => (
                    <span
                      key={fIdx}
                      className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Word-by-Word Breakdown Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900">
                  {dict.player.wordBreakdown}
                </h3>
                <span className="text-[11px] font-mono font-bold text-ocean-700 bg-ocean-50 border border-ocean-200/80 px-2 py-0.5 rounded-lg shadow-2xs">
                  {wordsList.length}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
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
                      className="p-3 bg-white hover:bg-sand-50/70 border border-sand-200 rounded-2xl flex items-center justify-between gap-3 transition-colors shadow-2xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono font-bold text-slate-400 w-5 shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900">
                              {word.t}
                            </span>
                            {wordStatus !== 'unseen' && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shadow-2xs ${
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
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {(word.s / 1000).toFixed(2)}s - {(word.e / 1000).toFixed(2)}s
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Play Word Audio */}
                        <button
                          type="button"
                          onClick={() => handlePlayWordSnippet(word)}
                          aria-label={`${dict.player.listenWord}: ${word.t}`}
                          title={`${dict.player.listenWord}: ${word.t}`}
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 bg-sand-100 hover:bg-ocean-50 hover:text-ocean-700 border border-sand-200 text-slate-600 rounded-xl text-xs transition-all shadow-2xs active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Bookmark Word */}
                        <button
                          type="button"
                          onClick={() => handleBookmarkWord(word)}
                          aria-label={`${dict.player.saveToVocabulary}: ${word.t}`}
                          title={`${dict.player.saveToVocabulary}: ${word.t}`}
                          className={`min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl text-xs transition-all shadow-2xs active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40 ${
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
        <div className="shrink-0 p-4 sm:p-5 border-t border-sand-100 bg-sand-50/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.player.closeInspector}
            className="w-full py-2.5 px-4 bg-white hover:bg-sand-100 border border-sand-200 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
          >
            {dict.player.closeInspector}
          </button>
        </div>
      </div>
    </div>
  );
};
