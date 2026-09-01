/**
 * Eidos Language OS - Player Progress Bar
 * High-precision audio progress bar with hover time preview and smooth ocean gradient fill.
 */
import React, { useState, useRef, useCallback } from 'react';
import { useDictionary } from '../../context/DictionaryContext';

interface PlayerProgressBarProps {
  currentMs: number;
  durationMs: number;
  onSeek: (targetMs: number) => void;
  disabled?: boolean;
}

export function formatTime(ms: number): string {
  const safeMs = Math.max(0, isNaN(ms) ? 0 : ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const PlayerProgressBar: React.FC<PlayerProgressBarProps> = ({
  currentMs,
  durationMs,
  onSeek,
  disabled = false,
}) => {
  const { dict } = useDictionary();
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverData, setHoverData] = useState<{
    percent: number;
    timeMs: number;
    pixelX: number;
  } | null>(null);

  const progressPercent =
    durationMs > 0 ? Math.min(100, Math.max(0, (currentMs / durationMs) * 100)) : 0;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || durationMs <= 0 || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;

      const rawOffset = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const percent = (rawOffset / rect.width) * 100;
      const timeMs = (percent / 100) * durationMs;
      const clampedX = Math.max(28, Math.min(rect.width - 28, rawOffset));

      setHoverData({
        percent,
        timeMs,
        pixelX: clampedX,
      });
    },
    [disabled, durationMs]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverData(null);
  }, []);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const targetMs = (val / 100) * durationMs;
    onSeek(targetMs);
  };

  return (
    <div className="w-full space-y-2">
      {/* Time & Progress Info */}
      <div className="flex items-center justify-between text-xs font-mono font-medium text-slate-600 select-none">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-ocean-700 bg-ocean-50 border border-ocean-200/80 px-2 py-0.5 rounded-lg shadow-xs">
            {formatTime(currentMs)}
          </span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-500">{formatTime(durationMs)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {dict.player.audioProgress}
          </span>
          <span className="text-[11px] font-bold text-slate-700 bg-sand-100/90 border border-sand-200 px-2 py-0.5 rounded-lg">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>

      {/* Interactive Track & Slider */}
      <div
        ref={trackRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative group flex items-center h-5 cursor-pointer"
      >
        {/* Floating Hover Time Tooltip */}
        {hoverData && (
          <div
            className="absolute -top-7 -translate-x-1/2 z-30 pointer-events-none px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[10px] font-mono font-bold shadow-soft animate-fade-in whitespace-nowrap"
            style={{ left: `${hoverData.pixelX}px` }}
          >
            {formatTime(hoverData.timeMs)}
          </div>
        )}

        {/* Custom Progress Bar Background & Filled Ocean Gradient */}
        <div className="absolute inset-x-0 h-2 bg-sand-100 border border-sand-200/80 rounded-full overflow-hidden pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-ocean-500 via-ocean-600 to-ocean-500 transition-all duration-75 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Range Input for Scrubbing */}
        <input
          type="range"
          min="0"
          max="100"
          step="0.05"
          value={progressPercent || 0}
          onChange={handleSeekChange}
          disabled={disabled || durationMs <= 0}
          aria-label={dict.player.audioProgress}
          className="relative w-full h-2 opacity-0 cursor-pointer z-10 focus:outline-none disabled:cursor-not-allowed"
        />

        {/* Animated Thumb Visual Indicator */}
        <div
          className="absolute h-4 w-4 bg-white border-2 border-ocean-600 rounded-full shadow-soft pointer-events-none -translate-x-1/2 transition-transform group-hover:scale-125"
          style={{ left: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
