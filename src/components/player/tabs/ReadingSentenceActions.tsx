/**
 * Eidos Language OS - Reading Sentence Actions Toolbar
 * High-craftsmanship modular action toolbar for sentence cards:
 * Replay, Pronunciation Practice Modal Trigger, Sentence Inspector Drawer Trigger,
 * Quick Copy with fallback, and Save to Vocabulary / Bookmark Mastery.
 * Strictly Light Mode - Zero Hardcode - Full ARIA Accessibility & Touch Ergonomics.
 */
import React, { useState } from 'react';
import { Copy, Check, Bookmark, BookmarkCheck, RotateCcw, Mic, Loader2, Layers } from 'lucide-react';
import type { Segment } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'sonner';

export interface ReadingSentenceActionsProps {
  segment: Segment;
  unitNumber?: number | null;
  onReplay?: (segment: Segment) => void;
  onPracticePronunciation?: (segment: Segment) => void;
  onOpenInspector?: (segment: Segment) => void;
  className?: string;
}

export const ReadingSentenceActions: React.FC<ReadingSentenceActionsProps> = ({
  segment,
  unitNumber,
  onReplay,
  onPracticePronunciation,
  onOpenInspector,
  className = '',
}) => {
  const { dict } = useDictionary();
  const { saveWordMastery, getWordStatus } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isSavingVocab, setIsSavingVocab] = useState(false);

  const wordStatus = getWordStatus(segment.id);
  const isSavedInVocab = wordStatus === 'learning' || wordStatus === 'mastered';

  // Quick Copy Sentence Text with reliable fallback for WebViews
  const handleCopy = async (e: React.SyntheticEvent) => {
    e.stopPropagation();
    const textToCopy = segment.rawText.trim();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success(dict.player?.tabs?.sentenceCopied || dict.player.segmentCopied);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(dict.errors.networkError);
    }
  };

  // Bookmark / Save Sentence to Vocabulary
  const handleToggleBookmark = async (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (isSavingVocab) return;

    try {
      setIsSavingVocab(true);
      await saveWordMastery(
        segment.id,
        'learning',
        unitNumber || 1,
        segment.rawText.trim(),
        (segment.turkishText || '').trim(),
        (segment.englishText || '').trim()
      );
      toast.success(dict.player?.tabs?.addedToVocabulary || dict.player.addedToVocabulary);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || dict.errors.internalServerError);
    } finally {
      setIsSavingVocab(false);
    }
  };

  const replaySentenceLabel = dict.player?.tabs?.replaySentence || dict.lessonPlayer.repeatSentence;
  const practicePronunciationLabel = dict.player?.tabs?.practicePronunciation || dict.player.practicePronunciation;
  const openInspectorLabel = dict.player?.tabs?.openInspector || dict.player.openInspector;
  const copySentenceLabel = dict.player?.tabs?.copySentence || dict.player.copySentence;
  const saveToVocabularyLabel = dict.player?.tabs?.saveToVocabulary || dict.player.saveToVocabulary;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center gap-1 sm:gap-1.5 shrink-0 opacity-90 group-hover:opacity-100 sm:opacity-80 sm:group-hover:opacity-100 transition-opacity duration-150 select-none ${className}`}
    >
      {/* 1. Replay Segment Button */}
      {onReplay && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReplay(segment);
          }}
          aria-label={replaySentenceLabel}
          title={replaySentenceLabel}
          className="min-w-[34px] min-h-[34px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-xl text-slate-500 hover:text-ocean-700 hover:bg-ocean-50/80 active:bg-ocean-100/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/50 cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}

      {/* 2. Practice Pronunciation Modal Button */}
      {onPracticePronunciation && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPracticePronunciation(segment);
          }}
          aria-label={practicePronunciationLabel}
          title={practicePronunciationLabel}
          className="min-w-[34px] min-h-[34px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-xl text-slate-500 hover:text-amber-700 hover:bg-amber-50/80 active:bg-amber-100/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 cursor-pointer active:scale-95"
        >
          <Mic className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}

      {/* 3. Open Sentence Inspector Drawer */}
      {onOpenInspector && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenInspector(segment);
          }}
          aria-label={openInspectorLabel}
          title={openInspectorLabel}
          className="min-w-[34px] min-h-[34px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-xl text-slate-500 hover:text-ocean-700 hover:bg-ocean-50/80 active:bg-ocean-100/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/50 cursor-pointer active:scale-95"
        >
          <Layers className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}

      {/* 4. Copy Sentence */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copySentenceLabel}
        title={copySentenceLabel}
        className="min-w-[34px] min-h-[34px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-sand-100/90 active:bg-sand-200/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/50 cursor-pointer active:scale-95"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>

      {/* 5. Save to Vocabulary Bookmark */}
      <button
        type="button"
        onClick={handleToggleBookmark}
        disabled={isSavingVocab}
        aria-label={saveToVocabularyLabel}
        title={saveToVocabularyLabel}
        className={`min-w-[34px] min-h-[34px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/50 cursor-pointer active:scale-95 ${
          isSavedInVocab
            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/70 shadow-2xs'
            : 'text-slate-500 hover:text-slate-800 hover:bg-sand-100/90 active:bg-sand-200/90'
        }`}
      >
        {isSavingVocab ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-ocean-600" />
        ) : isSavedInVocab ? (
          <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
        ) : (
          <Bookmark className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};
