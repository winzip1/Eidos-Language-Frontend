import React, { useState, useEffect } from 'react';
import { Volume2, CheckCircle2, BookmarkPlus, RotateCw, ExternalLink, VolumeX } from 'lucide-react';
import type { VocabularyItem } from '../../types';
import { useDictionary, initialFallbackDict } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { audioPlayer } from '../../services/audioPlayer';

interface WordMasteryCardProps {
  item: VocabularyItem;
  currentStatus?: 'learning' | 'mastered' | 'unseen';
  onNavigateToPlayer?: (unitNumber: number, startMs: number) => void;
}

export const WordMasteryCard: React.FC<WordMasteryCardProps> = ({
  item,
  currentStatus: propStatus,
  onNavigateToPlayer,
}) => {
  const { dict } = useDictionary();
  const voc = dict?.vocabulary || initialFallbackDict.vocabulary;
  const spk = dict?.speakers || initialFallbackDict.speakers;
  const { loadAndPlayUnit, playSnippet } = usePlayer();
  const { saveWordMastery, getWordStatus } = useAuth();
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const status = propStatus || getWordStatus(item.id);

  useEffect(() => {
    const unsubState = audioPlayer.onStateChange((playing) => {
      if (!playing) setIsPlayingAudio(false);
    });
    const unsubEnd = audioPlayer.onEnded(() => {
      setIsPlayingAudio(false);
    });
    return () => {
      unsubState();
      unsubEnd();
    };
  }, []);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingAudio(true);
    playSnippet(item.unitNumber, item.startMs, item.endMs);
  };

  const handleJumpToPlayer = (e: React.MouseEvent) => {
    e.stopPropagation();
    loadAndPlayUnit(item.unitNumber, item.startMs, true);
    if (onNavigateToPlayer) {
      onNavigateToPlayer(item.unitNumber, item.startMs);
    }
  };

  const handleStatusChange = (e: React.MouseEvent, newStatus: 'learning' | 'mastered') => {
    e.stopPropagation();
    saveWordMastery(item.id, newStatus, item.unitNumber, item.german, item.turkish, item.english);
  };

  const speakerLabel =
    item.speaker === 'GERMAN_MALE'
      ? spk.GERMAN_MALE
      : item.speaker === 'GERMAN_FEMALE'
      ? spk.GERMAN_FEMALE
      : item.speaker === 'NARRATOR'
      ? spk.NARRATOR
      : spk.UNKNOWN;

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      role="button"
      tabIndex={0}
      aria-label={item.german}
      onKeyDown={(e) => {
        if (e.key === 'Enter') setIsFlipped(!isFlipped);
      }}
      className={`group relative bg-white border rounded-3xl p-5 shadow-soft hover:shadow-soft-md transition-all cursor-pointer flex flex-col justify-between min-h-[195px] select-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500 ${
        status === 'mastered'
          ? 'border-emerald-200 bg-emerald-50/15 hover:border-emerald-300'
          : status === 'learning'
          ? 'border-ocean-200 bg-ocean-50/15 hover:border-ocean-300'
          : 'border-sand-200 hover:border-sand-300'
      }`}
    >
      {/* 1. Header: Unit, Speaker & Status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-ocean-700 bg-ocean-50 border border-ocean-200 px-2.5 py-0.5 rounded-full">
            {voc.unitBadge} {item.unitNumber}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 bg-sand-100 px-2 py-0.5 rounded-md hidden sm:inline">
            {speakerLabel}
          </span>
        </div>

        {/* Flip hint & Status Pill */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              status === 'mastered'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : status === 'learning'
                ? 'bg-ocean-50 text-ocean-700 border-ocean-200'
                : 'bg-sand-100 text-slate-500 border-sand-200'
            }`}
          >
            {status === 'mastered'
              ? voc.masteredCountLabel
              : status === 'learning'
              ? voc.learningCountLabel
              : voc.unseenCountLabel}
          </span>

          <span
            title={voc.flipCard}
            aria-label={voc.flipCard}
            className="text-[10px] text-slate-400 group-hover:text-ocean-600 flex items-center gap-1 font-medium transition-colors"
          >
            <RotateCw className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* 2. Body: German Phrase or Translation */}
      <div className="flex-1 flex flex-col justify-center my-3">
        {!isFlipped ? (
          <div>
            <span className="text-[10px] uppercase font-extrabold text-ocean-600 tracking-wider">
              {voc.frontSide}
            </span>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1 leading-snug">
              {item.german}
            </h4>
            <p className="text-xs font-medium text-slate-400 mt-1 line-clamp-1">
              {item.turkish || item.english}
            </p>
          </div>
        ) : (
          <div>
            <span className="text-[10px] uppercase font-extrabold text-emerald-600 tracking-wider">
              {voc.backSide}
            </span>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1 leading-snug">
              {item.turkish || item.english}
            </h4>
            <p className="text-xs font-medium text-slate-400 mt-1 line-clamp-1">
              {item.german}
            </p>
          </div>
        )}
      </div>

      {/* 3. Footer: Audio, Navigation & Status Actions */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="pt-3 border-t border-sand-100 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePlay}
            disabled={isPlayingAudio}
            className={`p-2 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer active:scale-90 ${
              isPlayingAudio
                ? 'bg-ocean-100 text-ocean-800 animate-pulse'
                : 'bg-sand-50 hover:bg-ocean-50 text-slate-600 hover:text-ocean-700 border border-sand-200 hover:border-ocean-200'
            }`}
            title={voc.playPronunciation}
            aria-label={voc.playPronunciation}
          >
            {isPlayingAudio ? (
              <VolumeX className="w-3.5 h-3.5 text-ocean-600" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>

          {onNavigateToPlayer && (
            <button
              type="button"
              onClick={handleJumpToPlayer}
              className="p-2 bg-sand-50 hover:bg-sand-100 text-slate-500 hover:text-slate-800 border border-sand-200 rounded-xl text-xs transition-colors cursor-pointer active:scale-90"
              title={voc.jumpToPlayer}
              aria-label={voc.jumpToPlayer}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => handleStatusChange(e, 'learning')}
            aria-label={voc.hardButton || voc.learningButton}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
              status === 'learning'
                ? 'bg-ocean-600 text-white shadow-2xs'
                : 'bg-sand-50 hover:bg-ocean-50 text-slate-600 hover:text-ocean-700 border border-sand-200 hover:border-ocean-200'
            }`}
          >
            <BookmarkPlus className={`w-3.5 h-3.5 ${status === 'learning' ? 'text-white' : 'text-ocean-600'}`} />
            <span className="hidden xs:inline">{voc.hardButton || voc.learningButton}</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleStatusChange(e, 'mastered')}
            aria-label={voc.easyButton || voc.masteredButton}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
              status === 'mastered'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-sand-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-sand-200 hover:border-emerald-200'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${status === 'mastered' ? 'text-white' : 'text-emerald-600'}`} />
            <span className="hidden xs:inline">{voc.easyButton || voc.masteredButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
