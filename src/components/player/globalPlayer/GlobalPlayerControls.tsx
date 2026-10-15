import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Loader2,
} from 'lucide-react';
import { useDictionary } from '../../../context/DictionaryContext';
import { formatScrubberTime } from './GlobalPlayerScrubber';

interface GlobalPlayerControlsProps {
  isPlaying: boolean;
  isBuffering: boolean;
  currentMs: number;
  durationMs: number;
  unitNumber: number | null;
  totalUnits?: number;
  onTogglePlay: () => void;
  onSeekRelative: (sec: number) => void;
  onPlayPreviousUnit: () => void;
  onPlayNextUnit: () => void;
  disabled?: boolean;
}

export const GlobalPlayerControls: React.FC<GlobalPlayerControlsProps> = ({
  isPlaying,
  isBuffering,
  currentMs,
  durationMs,
  unitNumber,
  totalUnits = 30,
  onTogglePlay,
  onSeekRelative,
  onPlayPreviousUnit,
  onPlayNextUnit,
  disabled = false,
}) => {
  const { dict } = useDictionary();

  const isPrevDisabled = disabled || !unitNumber || unitNumber <= 1;
  const isNextDisabled = disabled || !unitNumber || unitNumber >= totalUnits;
  const isPlayDisabled = disabled || (durationMs === 0 && !isPlaying && !isBuffering);

  return (
    <div className="flex items-center gap-2 sm:gap-4 select-none">
      {/* Time Display (Hidden on very small screens, visible on sm+) */}
      <div className="hidden md:flex items-center gap-1.5 text-xs font-mono font-medium text-slate-600 mr-1">
        <span className="font-bold text-ocean-700 bg-ocean-50/90 border border-ocean-200/80 px-2 py-0.5 rounded-lg shadow-2xs">
          {formatScrubberTime(currentMs)}
        </span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-500">{formatScrubberTime(durationMs)}</span>
      </div>

      {/* Main Buttons Deck */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Previous Unit Button */}
        <button
          type="button"
          onClick={onPlayPreviousUnit}
          disabled={isPrevDisabled}
          aria-label={dict.globalPlayer.previousUnit}
          title={dict.globalPlayer.previousUnit}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-sand-100/80 disabled:opacity-30 disabled:pointer-events-none rounded-xl transition-all active:scale-95"
        >
          <SkipBack className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        {/* Rewind -5s Button */}
        <button
          type="button"
          onClick={() => onSeekRelative(-5)}
          disabled={disabled || durationMs === 0}
          aria-label={dict.globalPlayer.seekBack5s}
          title={dict.globalPlayer.seekBack5s}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-sand-100 hover:bg-sand-200/80 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-ocean-700 shrink-0" />
          <span className="text-[11px] font-mono font-bold hidden xs:inline">-5s</span>
        </button>

        {/* Hero Play / Pause Button with Luxury Wave Glow */}
        <div className="relative flex items-center justify-center">
          {isPlaying && !isBuffering && (
            <div className="absolute inset-0 rounded-full bg-ocean-400 opacity-30 animate-ping pointer-events-none" />
          )}

          <button
            type="button"
            onClick={onTogglePlay}
            disabled={isPlayDisabled}
            aria-label={isPlaying ? dict.globalPlayer.pauseAction : dict.globalPlayer.playAction}
            title={isPlaying ? dict.globalPlayer.pauseAction : dict.globalPlayer.playAction}
            className={`relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white shadow-soft transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
              isPlaying
                ? 'bg-gradient-to-br from-ocean-600 to-ocean-800 ring-3 ring-ocean-200'
                : 'bg-gradient-to-br from-ocean-500 via-ocean-600 to-ocean-700 hover:from-ocean-600 hover:to-ocean-800 ring-2 ring-ocean-100 hover:ring-ocean-200'
            }`}
          >
            {isBuffering ? (
              <Loader2 className="w-5 h-5 sm:w-5.5 sm:h-5.5 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 sm:w-5.5 sm:h-5.5 fill-current" />
            ) : (
              <Play className="w-5 h-5 sm:w-5.5 sm:h-5.5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Forward +5s Button */}
        <button
          type="button"
          onClick={() => onSeekRelative(5)}
          disabled={disabled || durationMs === 0}
          aria-label={dict.globalPlayer.seekForward5s}
          title={dict.globalPlayer.seekForward5s}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-sand-100 hover:bg-sand-200/80 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs"
        >
          <span className="text-[11px] font-mono font-bold hidden xs:inline">+5s</span>
          <RotateCw className="w-3.5 h-3.5 text-ocean-700 shrink-0" />
        </button>

        {/* Next Unit Button */}
        <button
          type="button"
          onClick={onPlayNextUnit}
          disabled={isNextDisabled}
          aria-label={dict.globalPlayer.nextUnit}
          title={dict.globalPlayer.nextUnit}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-sand-100/80 disabled:opacity-30 disabled:pointer-events-none rounded-xl transition-all active:scale-95"
        >
          <SkipForward className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>
      </div>
    </div>
  );
};
