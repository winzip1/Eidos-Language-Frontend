/**
 * Eidos Language OS - Timestamp Audio Playback Button Component
 * Transforms static Whisper timestamp badges (e.g. 00:18.250) into interactive, touch-friendly audio buttons.
 * Supports active playing state with dynamic wave equalizer animation and seamless snippet seeking.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - 360dp Ergonomics.
 */
import React from 'react';
import { Volume2 } from 'lucide-react';
import { useDictionary, interpolate } from '../../../context/DictionaryContext';

export interface TimestampAudioButtonProps {
  timeStr: string;
  timeMs: number;
  isPlaying?: boolean;
  isLooping?: boolean;
  onClick?: () => void;
  title?: string;
  ariaLabel?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const TimestampAudioButton: React.FC<TimestampAudioButtonProps> = ({
  timeStr,
  timeMs,
  isPlaying = false,
  isLooping = false,
  onClick,
  title,
  ariaLabel,
  className = '',
  size = 'md',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  const defaultTitle = isPlaying
    ? dh.audioSnippetPlaying
    : interpolate(dh.jumpToTimestamp, { time: timeStr });

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="timestamp-audio-button"
      data-time-ms={timeMs}
      data-playing={isPlaying ? 'true' : 'false'}
      data-looping={isLooping ? 'true' : 'false'}
      title={title || defaultTitle}
      aria-label={ariaLabel || title || defaultTitle}
      className={`inline-flex items-center gap-1.5 font-mono font-semibold transition-all active:scale-95 cursor-pointer select-none rounded-xl border ${
        size === 'sm'
          ? 'px-2 py-1 text-[11px] min-h-[36px]'
          : 'px-2.5 py-1.5 text-xs min-h-[44px]'
      } ${
        isPlaying
          ? 'bg-sky-100 text-sky-900 border-sky-300 shadow-xs ring-2 ring-sky-400/30'
          : 'bg-sky-50/90 text-sky-700 hover:bg-sky-100/90 border-sky-200/80 hover:border-sky-300 hover:text-sky-800'
      } ${className}`}
    >
      {/* Icon or Animated Audio Wave Equalizer */}
      {isPlaying ? (
        <span
          className="flex items-end gap-0.5 h-3.5 w-3.5 justify-center py-0.5"
          aria-hidden="true"
        >
          <span className="w-0.5 h-2 bg-sky-600 rounded-full animate-pulse" />
          <span className="w-0.5 h-3.5 bg-sky-700 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-0.5 h-2.5 bg-sky-600 rounded-full animate-pulse" />
        </span>
      ) : (
        <Volume2 className="w-3.5 h-3.5 text-sky-600 shrink-0" aria-hidden="true" />
      )}

      {/* Timestamp Text Display */}
      <span className="tracking-tight">{timeStr}</span>

      {/* Subtle indicator dot when this timestamp is looping */}
      {isLooping && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping ml-0.5"
          title={dh.loopActiveBadge}
        />
      )}
    </button>
  );
};
