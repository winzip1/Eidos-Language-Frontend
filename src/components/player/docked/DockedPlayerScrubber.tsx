/**
 * Eidos Language OS - Docked Player Scrubber
 * Modern, thin audio progress line with segment cue points (dots), precision scrubbing, and rich hover preview.
 * Strictly Light Mode - Zero Hardcode - High Craftsmanship & WAI-ARIA Compliant.
 */
import React, { useState, useRef, useCallback, useMemo } from 'react';
import type { Segment } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';
import {
  formatElapsed,
  formatRemaining,
  calculateProgressPercent,
  calculateSeekMsFromClientX,
  calculateSegmentPercent,
} from '../../../utils/audioTime';

export interface DockedPlayerScrubberProps {
  currentMs: number;
  durationMs: number;
  onSeek: (targetMs: number) => void;
  segments?: Segment[];
  activeSegmentId?: string | null;
  disabled?: boolean;
  showTimeLabels?: boolean;
  className?: string;
}

export const DockedPlayerScrubber: React.FC<DockedPlayerScrubberProps> = ({
  currentMs,
  durationMs,
  onSeek,
  segments = [],
  activeSegmentId = null,
  disabled = false,
  showTimeLabels = false,
  className = '',
}) => {
  const { dict } = useDictionary();
  const trackRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragMs, setDragMs] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{
    percent: number;
    timeMs: number;
    pixelX: number;
  } | null>(null);

  // Derived effective time: displays drag preview when actively scrubbing
  const effectiveMs = isDragging && dragMs !== null ? dragMs : currentMs;
  const progressPercent = calculateProgressPercent(effectiveMs, durationMs);

  const computeMsFromClientX = useCallback(
    (clientX: number): number | null => {
      if (!trackRef.current || durationMs <= 0) return null;
      const rect = trackRef.current.getBoundingClientRect();
      return calculateSeekMsFromClientX(clientX, rect, durationMs);
    },
    [durationMs]
  );

  // Snaps to segment start time if seek position is within 800ms of a sentence boundary
  const findSnappedMs = useCallback(
    (rawMs: number): number => {
      if (!segments || segments.length === 0) return rawMs;
      const snapThresholdMs = 800;
      const closeSegment = segments.find(
        (s) => Math.abs(s.startMs - rawMs) <= snapThresholdMs
      );
      return closeSegment ? closeSegment.startMs : rawMs;
    },
    [segments]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || durationMs <= 0) return;
    try {
      trackRef.current?.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore if unsupported
    }
    setIsDragging(true);
    const targetMs = computeMsFromClientX(e.clientX);
    if (targetMs !== null) {
      setDragMs(targetMs);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || durationMs <= 0 || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const targetMs = calculateSeekMsFromClientX(e.clientX, rect, durationMs);

    if (isDragging) {
      setDragMs(targetMs);
    }

    // Hover tooltip position (clamped to track width)
    const rawOffset = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percent = rect.width > 0 ? (rawOffset / rect.width) * 100 : 0;
    const clampedPixelX = Math.max(36, Math.min(rect.width - 36, rawOffset));
    setHoverPosition({
      percent,
      timeMs: targetMs,
      pixelX: clampedPixelX,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      trackRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore
    }
    const finalMs = computeMsFromClientX(e.clientX);
    const seekRaw = finalMs !== null ? finalMs : dragMs !== null ? dragMs : currentMs;
    const seekTo = findSnappedMs(seekRaw);
    setIsDragging(false);
    setDragMs(null);
    setHoverPosition(null);
    onSeek(seekTo);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      trackRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore
    }
    setIsDragging(false);
    setDragMs(null);
    setHoverPosition(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || durationMs <= 0) return;
    const shortStepMs = 5000;
    const longStepMs = 15000;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        onSeek(Math.max(0, currentMs - shortStepMs));
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        onSeek(Math.min(durationMs, currentMs + shortStepMs));
        break;
      case 'PageDown':
        e.preventDefault();
        onSeek(Math.max(0, currentMs - longStepMs));
        break;
      case 'PageUp':
        e.preventDefault();
        onSeek(Math.min(durationMs, currentMs + longStepMs));
        break;
      case 'Home':
        e.preventDefault();
        onSeek(0);
        break;
      case 'End':
        e.preventDefault();
        onSeek(durationMs);
        break;
    }
  };

  // Tooltip display coordinates and time
  const showTooltip = !disabled && (hoverPosition !== null || (isDragging && dragMs !== null));
  const tooltipTimeMs = isDragging && dragMs !== null ? dragMs : hoverPosition?.timeMs ?? 0;
  const tooltipPixelX = hoverPosition?.pixelX ?? (trackRef.current ? Math.max(32, Math.min(trackRef.current.clientWidth - 32, (progressPercent / 100) * trackRef.current.clientWidth)) : 0);

  // Find nearest segment for tooltip preview
  const nearestSegment = useMemo(() => {
    if (!segments || segments.length === 0 || !showTooltip) return null;
    return segments.find((s) => tooltipTimeMs >= s.startMs && tooltipTimeMs <= s.endMs) || null;
  }, [segments, showTooltip, tooltipTimeMs]);

  // Pre-calculate valid segment dots
  const segmentDots = useMemo(() => {
    if (!segments || segments.length === 0 || durationMs <= 0) return [];
    return segments
      .map((seg, idx) => ({
        id: seg.id,
        index: idx + 1,
        percent: calculateSegmentPercent(seg.startMs, durationMs),
        isActive: seg.id === activeSegmentId,
      }))
      .filter((dot) => dot.percent > 1 && dot.percent < 99);
  }, [segments, durationMs, activeSegmentId]);

  return (
    <div className={`w-full flex items-center gap-2 sm:gap-3 select-none ${className}`}>
      {/* Optional Left: Elapsed time label */}
      {showTimeLabels && (
        <span
          className="font-mono text-xs text-slate-500 font-medium tabular-nums min-w-[44px] sm:min-w-[48px] text-left select-none"
          aria-label={dict.player.dock.elapsedTime || dict.lessonPlayer.currentTimeLabel}
        >
          {formatElapsed(effectiveMs)}
        </span>
      )}

      {/* Main Interactive Scrubber Slider Track */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-orientation="horizontal"
        aria-label={dict.player.dock.scrubberAriaLabel || dict.lessonPlayer.scrubberAriaLabel}
        aria-valuemin={0}
        aria-valuemax={durationMs}
        aria-valuenow={effectiveMs}
        aria-valuetext={`${formatElapsed(effectiveMs)} / ${formatRemaining(
          effectiveMs,
          durationMs,
          '-'
        )}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onMouseLeave={() => {
          if (!isDragging) setHoverPosition(null);
        }}
        onKeyDown={handleKeyDown}
        className={`relative flex-1 py-2 sm:py-2.5 group flex items-center touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 rounded-full cursor-pointer ${
          disabled ? 'opacity-40 cursor-not-allowed' : isDragging ? 'cursor-grabbing' : 'cursor-pointer'
        }`}
      >
        {/* Background Track with expansion on hover/drag */}
        <div className="relative w-full h-1.5 group-hover:h-2 sm:group-hover:h-2.5 bg-slate-200/80 rounded-full overflow-hidden transition-all duration-150 shadow-inner">
          {/* Hover Ghost Highlight Bar */}
          {hoverPosition && !disabled && (
            <div
              className="absolute top-0 bottom-0 left-0 bg-orange-200/50 pointer-events-none transition-all duration-75 rounded-full"
              style={{ width: `${hoverPosition.percent}%` }}
            />
          )}

          {/* Active Filled Progress Bar */}
          <div
            className={`h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-full relative shadow-xs ${
              isDragging ? 'transition-none' : 'transition-all duration-75'
            }`}
            style={{ width: `${progressPercent}%` }}
          >
            {/* Shimmer light indicator at head */}
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/90 shadow-xs" />
          </div>
        </div>

        {/* Segment Cue Points (Dots) along track */}
        {segmentDots.length > 0 && !disabled && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 pointer-events-none">
            {segmentDots.map((dot) => (
              <div
                key={dot.id}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-all duration-150 ${
                  dot.isActive
                    ? 'w-2 h-2 bg-amber-400 ring-2 ring-orange-400 z-10 shadow-xs'
                    : 'w-1 h-1 bg-slate-400/60 group-hover:bg-amber-300/80 group-hover:scale-125 z-0'
                }`}
                style={{ left: `${dot.percent}%` }}
              />
            ))}
          </div>
        )}

        {/* Visual Slider Thumb Follower */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white border-2 border-orange-500 rounded-full shadow-md pointer-events-none transition-transform duration-100 ${
            isDragging
              ? 'scale-125 ring-3 ring-orange-200/90'
              : hoverPosition
              ? 'scale-125 ring-3 ring-orange-200/90'
              : 'group-hover:scale-110'
          }`}
          style={{ left: `${progressPercent}%` }}
        />

        {/* Floating Hover & Drag Time Preview Tooltip */}
        {showTooltip && (
          <div
            className="absolute bottom-full mb-1.5 pointer-events-none z-30 transform -translate-x-1/2 animate-fade-in"
            style={{ left: `${tooltipPixelX}px` }}
          >
            <div className="bg-slate-900/95 text-white text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md shadow-lg border border-slate-700/60 backdrop-blur-xs flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-orange-300">
                {formatElapsed(tooltipTimeMs)}
              </span>
              {nearestSegment && (
                <span className="text-[10px] text-slate-300 font-sans border-l border-slate-700 pl-1.5">
                  #{typeof nearestSegment.segmentIndex === 'number' ? nearestSegment.segmentIndex + 1 : 1}
                </span>
              )}
            </div>
            <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-0.5 border-r border-b border-slate-700/60" />
          </div>
        )}
      </div>

      {/* Optional Right: Remaining time label */}
      {showTimeLabels && (
        <span
          className="font-mono text-xs text-slate-500 font-medium tabular-nums min-w-[44px] sm:min-w-[48px] text-right select-none"
          aria-label={dict.player.dock.remainingTime || dict.lessonPlayer.remainingTimeLabel}
        >
          {formatRemaining(effectiveMs, durationMs, '-')}
        </span>
      )}
    </div>
  );
};
