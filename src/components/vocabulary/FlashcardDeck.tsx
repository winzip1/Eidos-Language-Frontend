import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Volume2,
  CheckCircle2,
  BookmarkPlus,
  Sparkles,
  Shuffle,
  ExternalLink,
  VolumeX,
  Keyboard,
} from 'lucide-react';
import type { VocabularyItem } from '../../types';
import { useDictionary, initialFallbackDict } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { audioPlayer } from '../../services/audioPlayer';

interface FlashcardDeckProps {
  items: VocabularyItem[];
  onNavigateToPlayer?: (unitNumber: number, startMs: number) => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  items,
  onNavigateToPlayer,
}) => {
  const { dict } = useDictionary();
  const voc = dict?.vocabulary || initialFallbackDict.vocabulary;
  const spk = dict?.speakers || initialFallbackDict.speakers;
  const { loadAndPlayUnit, playSnippet } = usePlayer();
  const { saveWordMastery, getWordStatus } = useAuth();

  const [deck, setDeck] = useState<VocabularyItem[]>(items);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isDeckCompleted, setIsDeckCompleted] = useState<boolean>(false);

  // Touch Swipe coordinates
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    setDeck(items);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsDeckCompleted(false);
  }, [items]);

  // Audio state listener
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

  const currentItem = deck[currentIndex];
  const currentStatus = currentItem ? getWordStatus(currentItem.id) : 'unseen';

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex + 1 >= deck.length) {
      setIsDeckCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, deck.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsDeckCompleted(false);
    }
  }, [currentIndex]);

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsDeckCompleted(false);
  };

  const handleRestart = () => {
    setIsFlipped(false);
    setCurrentIndex(0);
    setIsDeckCompleted(false);
  };

  const handlePlayAudio = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (!currentItem) return;
      setIsPlayingAudio(true);
      playSnippet(currentItem.unitNumber, currentItem.startMs, currentItem.endMs);
    },
    [currentItem, playSnippet]
  );

  const handleJumpToPlayer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentItem) return;
    loadAndPlayUnit(currentItem.unitNumber, currentItem.startMs, true);
    if (onNavigateToPlayer) {
      onNavigateToPlayer(currentItem.unitNumber, currentItem.startMs);
    }
  };

  const handleSaveStatus = useCallback(
    (status: 'learning' | 'mastered') => {
      if (!currentItem) return;
      saveWordMastery(
        currentItem.id,
        status,
        currentItem.unitNumber,
        currentItem.german,
        currentItem.turkish,
        currentItem.english
      );
      handleNext();
    },
    [currentItem, handleNext, saveWordMastery]
  );

  // Desktop Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'Digit1') {
        e.preventDefault();
        handleSaveStatus('learning');
      } else if (e.code === 'Digit2') {
        e.preventDefault();
        handleSaveStatus('mastered');
      } else if (e.code === 'KeyP' || e.code === 'KeyS') {
        e.preventDefault();
        handlePlayAudio();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleSaveStatus, handlePlayAudio]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(diffX) > 60) {
      if (diffX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    touchStartXRef.current = null;
  };

  if (!items || items.length === 0) return null;

  // Deck Completed Celebration Screen
  if (isDeckCompleted) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-sand-200 rounded-3xl p-8 sm:p-12 shadow-soft-lg text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-soft">
          <Sparkles className="w-8 h-8 text-emerald-600" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {voc.deckCompletedTitle}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {voc.deckCompletedDesc}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-sand-50 border border-sand-200 rounded-2xl text-xs font-bold text-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            {deck.length} {voc.cardCountFormat}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={handleRestart}
            className="flex items-center gap-2 px-5 py-3 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-2xl shadow-soft transition-all cursor-pointer active:scale-95"
          >
            <RotateCw className="w-4 h-4" />
            <span>{voc.restartDeck}</span>
          </button>
          <button
            type="button"
            onClick={handleShuffle}
            className="flex items-center gap-2 px-5 py-3 bg-sand-100 hover:bg-sand-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer active:scale-95"
          >
            <Shuffle className="w-4 h-4" />
            <span>{voc.shuffleDeck}</span>
          </button>
        </div>
      </div>
    );
  }

  if (!currentItem) return null;

  const speakerLabel =
    currentItem.speaker === 'GERMAN_MALE'
      ? spk.GERMAN_MALE
      : currentItem.speaker === 'GERMAN_FEMALE'
      ? spk.GERMAN_FEMALE
      : currentItem.speaker === 'NARRATOR'
      ? spk.NARRATOR
      : spk.UNKNOWN;

  const progressPercentage = Math.round(((currentIndex + 1) / deck.length) * 100);

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Progress & Deck Meta Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-ocean-500 inline-block"></span>
            {voc.cardOfFormat} {currentIndex + 1} / {deck.length}
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            {progressPercentage}%
          </span>
        </div>
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-sand-200/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-ocean-500 to-ocean-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="perspective-1000 min-h-[340px] sm:min-h-[360px]"
      >
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          role="button"
          tabIndex={0}
          aria-label={isFlipped ? voc.backSide : voc.frontSide}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setIsFlipped(!isFlipped);
          }}
          className={`relative w-full h-full min-h-[340px] sm:min-h-[360px] transform-style-3d transition-transform duration-500 cursor-pointer select-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500 rounded-3xl ${
            isFlipped ? 'rotate-y-180' : 'rotate-y-0'
          }`}
        >
          {/* ================= FRONT SIDE (GERMAN) ================= */}
          <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            className="absolute inset-0 backface-hidden bg-white border border-sand-200 rounded-3xl p-6 sm:p-8 shadow-soft-lg flex flex-col justify-between items-center text-center hover:border-ocean-300 hover:shadow-soft-xl transition-all"
          >
            {/* Front Card Header */}
            <div className="w-full flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="bg-ocean-50 text-ocean-700 text-[11px] font-bold px-3 py-1 rounded-full border border-ocean-200">
                  {voc.unitBadge} {currentItem.unitNumber}
                </span>
                <span className="bg-sand-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md hidden sm:inline">
                  {speakerLabel}
                </span>
              </div>

              {/* Status Pill */}
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  currentStatus === 'mastered'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : currentStatus === 'learning'
                    ? 'bg-ocean-50 text-ocean-700 border-ocean-200'
                    : 'bg-sand-100 text-slate-500 border-sand-200'
                }`}
              >
                {currentStatus === 'mastered'
                  ? voc.masteredCountLabel
                  : currentStatus === 'learning'
                  ? voc.learningCountLabel
                  : voc.unseenCountLabel}
              </span>
            </div>

            {/* Front Card Body */}
            <div className="my-auto py-6 space-y-3 max-w-md">
              <span className="text-[11px] uppercase tracking-widest font-extrabold text-ocean-600">
                {voc.frontSide}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                {currentItem.german}
              </h2>
            </div>

            {/* Front Card Bottom Hint */}
            <div className="w-full flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-sand-100">
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 group-hover:text-ocean-600">
                <RotateCw className="w-3.5 h-3.5" />
                <span>{voc.cardFlipInstruction}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {currentIndex + 1} / {deck.length}
              </span>
            </div>
          </div>

          {/* ================= BACK SIDE (TRANSLATION) ================= */}
          <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-b from-white to-sand-50/60 border border-ocean-200 rounded-3xl p-6 sm:p-8 shadow-soft-lg flex flex-col justify-between items-center text-center"
          >
            {/* Back Card Header */}
            <div className="w-full flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200">
                  {voc.unitBadge} {currentItem.unitNumber}
                </span>
                <span className="bg-sand-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                  {voc.backSide}
                </span>
              </div>

              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  currentStatus === 'mastered'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : currentStatus === 'learning'
                    ? 'bg-ocean-50 text-ocean-700 border-ocean-200'
                    : 'bg-sand-100 text-slate-500 border-sand-200'
                }`}
              >
                {currentStatus === 'mastered'
                  ? voc.masteredCountLabel
                  : currentStatus === 'learning'
                  ? voc.learningCountLabel
                  : voc.unseenCountLabel}
              </span>
            </div>

            {/* Back Card Body */}
            <div className="my-auto py-6 space-y-3 max-w-md">
              <span className="text-[11px] uppercase tracking-widest font-extrabold text-emerald-600">
                {voc.backSide}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
                {currentItem.turkish || currentItem.english}
              </h2>
              <p className="text-xs font-semibold text-slate-400 pt-1">
                {currentItem.german}
              </p>
            </div>

            {/* Back Card Bottom Hint */}
            <div className="w-full flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-sand-100">
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <RotateCw className="w-3.5 h-3.5" />
                <span>{voc.tapToFlipHint}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {currentIndex + 1} / {deck.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="bg-white border border-sand-200 rounded-2xl p-3 shadow-soft flex flex-wrap items-center justify-between gap-3">
        {/* Audio & Player Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlayAudio}
            disabled={isPlayingAudio}
            className={`p-2.5 rounded-xl border font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              isPlayingAudio
                ? 'bg-ocean-100 text-ocean-800 border-ocean-300 animate-pulse'
                : 'bg-sand-50 hover:bg-ocean-50 text-slate-700 hover:text-ocean-700 border-sand-200 hover:border-ocean-200'
            }`}
            title={isPlayingAudio ? voc.playingAudio : voc.playPronunciation}
            aria-label={isPlayingAudio ? voc.playingAudio : voc.playPronunciation}
          >
            {isPlayingAudio ? (
              <VolumeX className="w-4 h-4 text-ocean-600" />
            ) : (
              <Volume2 className="w-4 h-4 text-ocean-600" />
            )}
            <span className="hidden sm:inline">
              {isPlayingAudio ? voc.playingAudio : voc.playPronunciation}
            </span>
          </button>

          {onNavigateToPlayer && (
            <button
              type="button"
              onClick={handleJumpToPlayer}
              className="p-2.5 bg-sand-50 hover:bg-sand-100 text-slate-600 hover:text-slate-900 border border-sand-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              title={voc.jumpToPlayer}
              aria-label={voc.jumpToPlayer}
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">{voc.jumpToPlayer}</span>
            </button>
          )}
        </div>

        {/* Status Mastery Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSaveStatus('learning')}
            aria-label={voc.hardButton || voc.learningButton}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              currentStatus === 'learning'
                ? 'bg-ocean-600 text-white shadow-soft ring-2 ring-ocean-200'
                : 'bg-sand-100 hover:bg-ocean-50 text-slate-700 hover:text-ocean-700 border border-sand-200 hover:border-ocean-200'
            }`}
          >
            <BookmarkPlus className={`w-4 h-4 ${currentStatus === 'learning' ? 'text-white' : 'text-ocean-600'}`} />
            <span>{voc.hardButton || voc.learningButton}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveStatus('mastered')}
            aria-label={voc.easyButton || voc.masteredButton}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              currentStatus === 'mastered'
                ? 'bg-emerald-600 text-white shadow-soft ring-2 ring-emerald-200'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${currentStatus === 'mastered' ? 'text-white' : 'text-emerald-600'}`} />
            <span>{voc.easyButton || voc.masteredButton}</span>
          </button>
        </div>
      </div>

      {/* Bottom Deck Navigation Controls */}
      <div className="flex items-center justify-between px-1 pt-1">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label={voc.prevCard}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
            currentIndex === 0
              ? 'bg-sand-100 text-slate-400 cursor-not-allowed border border-sand-200/60'
              : 'bg-white border border-sand-200 hover:bg-sand-50 text-slate-700 shadow-soft'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{voc.prevCard}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShuffle}
            className="p-2.5 bg-white border border-sand-200 hover:bg-sand-50 text-slate-600 hover:text-slate-900 rounded-2xl text-xs font-bold shadow-soft transition-all cursor-pointer active:scale-95"
            title={voc.shuffleDeck}
            aria-label={voc.shuffleDeck}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="p-2.5 bg-white border border-sand-200 hover:bg-sand-50 text-slate-700 rounded-2xl text-xs font-bold shadow-soft transition-all cursor-pointer active:scale-95"
            title={voc.flipCard}
            aria-label={voc.flipCard}
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleNext}
          aria-label={voc.nextCard}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-sand-200 hover:bg-sand-50 rounded-2xl text-xs font-bold text-slate-700 shadow-soft transition-all cursor-pointer active:scale-95"
        >
          <span>{voc.nextCard}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard Shortcuts Hint Bar */}
      <div className="hidden sm:flex items-center justify-center gap-3 text-[10px] text-slate-400 font-semibold py-1">
        <Keyboard className="w-3 h-3 text-slate-400" />
        <span>{voc.shortcutFlip || voc.shortcutSpaceFlip}</span>
        <span>•</span>
        <span>{voc.shortcutNav || voc.shortcutArrows}</span>
        <span>•</span>
        <span>{voc.shortcutGrade || voc.shortcutMastered}</span>
      </div>
    </div>
  );
};
