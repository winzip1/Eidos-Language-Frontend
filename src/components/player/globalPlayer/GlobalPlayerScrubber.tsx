import React, { useState, useRef, useCallback } from 'react';
import { useDictionary } from '../../../context/DictionaryContext';

interface GlobalPlayerScrubberProps {
  currentMs: number;
  durationMs: number;
  onSeek: (targetMs: number) => void;
  disabled?: boolean;
}

export function formatScrubberTime(ms: number): string {
  const safeMs = Math.max(0, isNaN(ms) ? 0 : ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const GlobalPlayerScrubber: React.FC<GlobalPlayerScrubberProps> = ({
  currentMs,
  durationMs,
  onSeek,
  disabled = false,
}) => {
  const { dict } = useDictionary();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [hoverPosition, setHoverPosition] = useState<{
    percent: number;
    timeMs: number;
    pixelX: number;
  } | null>(null);

  const progressPercent =
    durationMs > 0 ? Math.min(100, Math.max(0, (currentMs / durationMs) * 100)) : 0;

  const calculatePosition = useCallback(
    (clientX: number) => {
      if (disabled || durationMs <= 0 || !containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return null;

      const rawOffset = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const percent = (rawOffset / rect.width) * 100;
      const timeMs = (percent / 100) * durationMs;
      // Clamped pixel coordinate so floating tooltip never clips off edges
      const clampedX = Math.max(32, Math.min(rect.width - 32, rawOffset));

      return {
        percent,
        timeMs,
        pixelX: clampedX,
      };
    },
    [disabled, durationMs]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const pos = calculatePosition(e.clientX);
      if (pos) setHoverPosition(pos);
    },
    [calculatePosition]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length > 0) {
        const pos = calculatePosition(e.touches[0].clientX);
        if (pos) setHoverPosition(pos);
      }
    },
    [calculatePosition]
  );

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setHoverPosition(null);
    }
  }, [isDragging]);

  const handleSeekChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || durationMs <= 0) return;
      const val = parseFloat(e.target.value);
      const targetMs = (val / 100) * durationMs;
      onSeek(targetMs);
    },
    [disabled, durationMs, onSeek]
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={() => setIsDragging(true)}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => {
        setIsDragging(false);
        setHoverPosition(null);
      }}
      className={`relative w-full group select-none flex items-center ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      {/* Background Track with expansion on hover */}
      <div className="relative w-full h-1.5 group-hover:h-2.5 bg-sand-200/90 rounded-full overflow-hidden transition-all duration-150 shadow-inner">
        {/* Hover Highlight Ghost Bar */}
        {hoverPosition && !disabled && (
          <div
            className="absolute top-0 bottom-0 left-0 bg-ocean-200/60 pointer-events-none transition-all duration-75"
            style={{ width: `${hoverPosition.percent}%` }}
          />
        )}

        {/* Active Filled Progress Bar */}
        <div
          className="h-full bg-gradient-to-r from-ocean-500 via-ocean-600 to-ocean-500 rounded-full transition-all duration-75 relative shadow-xs"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Active shimmer line at head */}
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/70 shadow-xs" />
        </div>
      </div>

      {/* Invisible High-Precision Range Input */}
      <input
        type="range"
        min="0"
        max="100"
        step="0.01"
        value={progressPercent || 0}
        onChange={handleSeekChange}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => {
          setIsDragging(false);
          setHoverPosition(null);
        }}
        disabled={disabled}
        aria-label={dict.player.audioProgress}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 focus:outline-hidden disabled:cursor-not-allowed"
      />

      {/* Visual Thumb Follower */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 bg-white border-2 border-ocean-600 rounded-full shadow-soft pointer-events-none -translate-x-1/2 transition-transform duration-100 ${
          hoverPosition || isDragging
            ? 'scale-125 ring-3 ring-ocean-200/90'
            : 'group-hover:scale-110'
        }`}
        style={{ left: `${progressPercent}%` }}
      />

      {/* Floating Hover Time Preview Tooltip (Clamped to Screen) */}
      {hoverPosition && !disabled && (
        <div
          className="absolute bottom-full mb-2.5 pointer-events-none z-30 transform -translate-x-1/2 animate-fade-in"
          style={{ left: `${hoverPosition.pixelX}px` }}
        >
          <div className="bg-slate-900/95 text-white text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md shadow-lg border border-slate-700/60 backdrop-blur-xs flex items-center gap-1">
            <span className="text-ocean-300">
              {formatScrubberTime(hoverPosition.timeMs)}
            </span>
          </div>
          {/* Small Tooltip Arrow */}
          <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-0.5 border-r border-b border-slate-700/60" />
        </div>
      )}
    </div>
  );
};
