/**
 * Eidos Language OS - Transcript Segment Card
 * Luxury interactive segment card with karaoke word highlighting, dual-translation, and studio actions.
 */
import React, { useRef, useEffect } from 'react';
import {
  Play,
  Repeat,
  Sparkles,
  BookmarkPlus,
  User,
  BookOpen,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import type { Segment } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { KaraokeWordHighlighter } from './KaraokeWordHighlighter';
import { toast } from 'sonner';

interface TranscriptSegmentCardProps {
  segment: Segment;
  isActive: boolean;
  isLooped: boolean;
  showTranslation: boolean;
  currentMs: number;
  unitNumber?: number | null;
  onSeek: (startMs: number) => void;
  onToggleLoop: (segmentId: string) => void;
  onOpenDrill: (segment: Segment) => void;
  onOpenInspector: (segment: Segment) => void;
}

export const TranscriptSegmentCard: React.FC<TranscriptSegmentCardProps> = ({
  segment,
  isActive,
  isLooped,
  showTranslation,
  currentMs,
  unitNumber,
  onSeek,
  onToggleLoop,
  onOpenDrill,
  onOpenInspector,
}) => {
  const { dict } = useDictionary();
  const { saveWordMastery } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  const isGermanSpeaker =
    segment.speaker === 'GERMAN_MALE' || segment.speaker === 'GERMAN_FEMALE';

  // Speaker Badge Helper
  const renderSpeakerBadge = () => {
    switch (segment.speaker) {
      case 'GERMAN_MALE':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-ocean-50 text-ocean-800 border border-ocean-200/80 shadow-xs">
            <User className="w-3.5 h-3.5 text-ocean-600" />
            <span>{dict.speakers.GERMAN_MALE}</span>
          </div>
        );
      case 'GERMAN_FEMALE':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200/80 shadow-xs">
            <User className="w-3.5 h-3.5 text-purple-600" />
            <span>{dict.speakers.GERMAN_FEMALE}</span>
          </div>
        );
      case 'UNKNOWN':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-sand-100 text-slate-700 border border-sand-200/90 shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>{dict.speakers.UNKNOWN}</span>
          </div>
        );
      case 'NARRATOR':
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-sand-100 text-slate-700 border border-sand-200/90 shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>{dict.speakers.NARRATOR}</span>
          </div>
        );
    }
  };

  const handleBookmarkSentence = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveWordMastery(
      segment.id,
      'learning',
      unitNumber || 1,
      segment.rawText,
      segment.turkishText || '',
      segment.englishText || ''
    );
    toast.success(dict.player.addedToVocabulary, {
      description: segment.rawText,
    });
  };

  const handleCopySentence = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(segment.rawText);
    setCopied(true);
    toast.success(dict.player.segmentCopied, {
      description: segment.rawText,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={cardRef}
      id={`seg-${segment.id}`}
      onClick={() => onSeek(segment.startMs)}
      className={`group relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 cursor-pointer ${
        isActive
          ? 'border-l-4 border-l-ocean-600 bg-gradient-to-r from-ocean-50/80 via-white to-white border-ocean-200 ring-1 ring-ocean-100/70 shadow-soft'
          : isLooped
          ? 'border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/60 to-white border-amber-200 shadow-soft'
          : 'bg-white border-sand-200/80 hover:border-ocean-200 hover:bg-sand-50/40 hover:shadow-xs'
      }`}
    >
      {/* 1. Header: Speaker Badge, Timestamp, Active Pill & Action Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center flex-wrap gap-2">
          {renderSpeakerBadge()}

          {/* Timestamp Badge */}
          <span className="text-[11px] font-mono font-semibold text-slate-500 bg-sand-100/90 border border-sand-200/80 px-2 py-0.5 rounded-lg">
            {segment.startTimeFormatted}
          </span>

          {/* Active indicator */}
          {isActive && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-ocean-800 bg-ocean-100/80 border border-ocean-200 px-2 py-0.5 rounded-lg shadow-xs animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-ocean-600 animate-ping" />
              {dict.player.activeSegmentBadge}
            </span>
          )}

          {/* Looped indicator */}
          {isLooped && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-lg animate-pulse">
              <Repeat className="w-2.5 h-2.5" />
              {dict.player.loopActive}
            </span>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity"
        >
          {/* Repeat sentence loop button */}
          <button
            onClick={() => onToggleLoop(segment.id)}
            aria-label={dict.player.repeatSentence}
            title={dict.player.repeatSentence}
            className={`p-2 rounded-xl text-xs transition-all shadow-xs ${
              isLooped
                ? 'bg-amber-100 text-amber-800 font-bold ring-1 ring-amber-300'
                : 'bg-sand-50 border border-sand-200 text-slate-500 hover:text-slate-800 hover:bg-sand-100'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Open Sentence Inspector */}
          <button
            onClick={() => onOpenInspector(segment)}
            aria-label={dict.player.openInspector}
            title={dict.player.openInspector}
            className="p-2 bg-sand-50 hover:bg-sand-100 border border-sand-200 text-slate-600 hover:text-ocean-700 rounded-xl text-xs transition-all shadow-xs"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Drill Modal Trigger */}
          {isGermanSpeaker && (
            <button
              onClick={() => onOpenDrill(segment)}
              aria-label={dict.player.drillFragment}
              title={dict.player.drillFragment}
              className="p-2 bg-ocean-50 hover:bg-ocean-100 border border-ocean-200 text-ocean-700 hover:text-ocean-900 rounded-xl text-xs transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-ocean-600" />
            </button>
          )}

          {/* Bookmark to Vocabulary button */}
          {isGermanSpeaker && (
            <button
              onClick={handleBookmarkSentence}
              aria-label={dict.player.saveToVocabulary}
              title={dict.player.saveToVocabulary}
              className="p-2 bg-sand-50 hover:bg-sand-100 border border-sand-200 text-slate-500 hover:text-ocean-700 rounded-xl text-xs transition-all shadow-xs"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Copy sentence button */}
          <button
            onClick={handleCopySentence}
            aria-label={dict.player.copySentence}
            title={dict.player.copySentence}
            className="p-2 bg-sand-50 hover:bg-sand-100 border border-sand-200 text-slate-500 hover:text-slate-800 rounded-xl text-xs transition-all shadow-xs"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Play Segment Button */}
          <button
            onClick={() => onSeek(segment.startMs)}
            aria-label={dict.player.jumpToSegment}
            title={dict.player.jumpToSegment}
            className={`p-2 rounded-xl text-xs transition-all shadow-xs ${
              isActive
                ? 'bg-ocean-600 text-white hover:bg-ocean-700 ring-2 ring-ocean-200'
                : 'bg-sand-50 border border-sand-200 text-slate-600 hover:text-slate-900 hover:bg-sand-100'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Karaoke German Text */}
      <div className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
        <KaraokeWordHighlighter
          words={segment.words}
          rawText={segment.rawText}
          isActive={isActive}
          currentMs={currentMs}
          onSeekWord={onSeek}
        />
      </div>

      {/* 3. Dual Translation Display */}
      {showTranslation && (segment.turkishText || segment.englishText) && (
        <div className="mt-3 pt-2.5 border-t border-sand-100 flex items-center justify-between text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
          <p className="line-clamp-2">
            {segment.turkishText || segment.englishText}
          </p>
        </div>
      )}
    </div>
  );
};
