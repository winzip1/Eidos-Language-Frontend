/**
 * Eidos Language OS - Transcript Stream
 * Scrollable full-canvas karaoke transcript stream with intelligent auto-scroll and segment orchestration.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Scroll, Play } from 'lucide-react';
import type { Segment } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { TranscriptSegmentCard } from './TranscriptSegmentCard';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

interface TranscriptStreamProps {
  segments: Segment[];
  isLoading: boolean;
  activeSegmentId: string | null;
  loopSegmentId: string | null;
  showTranslation: boolean;
  autoScroll: boolean;
  currentMs: number;
  unitNumber?: number | null;
  onSeek: (startMs: number) => void;
  onToggleLoop: (segmentId: string) => void;
  onOpenDrill: (segment: Segment) => void;
  onOpenInspector: (segment: Segment) => void;
  onClearFilters: () => void;
}

export const TranscriptStream: React.FC<TranscriptStreamProps> = ({
  segments,
  isLoading,
  activeSegmentId,
  loopSegmentId,
  showTranslation,
  autoScroll,
  currentMs,
  unitNumber,
  onSeek,
  onToggleLoop,
  onOpenDrill,
  onOpenInspector,
  onClearFilters,
}) => {
  const { dict } = useDictionary();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserInteracting, setIsUserInteracting] = useState<boolean>(false);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Resume auto-scroll manually
  const handleResumeAutoScroll = useCallback(() => {
    setIsUserInteracting(false);
    if (activeSegmentId) {
      const el = document.getElementById(`seg-${activeSegmentId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeSegmentId]);

  // Handle user manual scroll
  const handleUserScroll = useCallback(() => {
    if (!autoScroll) return;

    setIsUserInteracting(true);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    // Automatically resume auto-scroll after 6 seconds of inactivity
    userScrollTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 6000);
  }, [autoScroll]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll effect to smoothly center the currently playing active segment
  useEffect(() => {
    if (autoScroll && activeSegmentId && !isUserInteracting) {
      const el = document.getElementById(`seg-${activeSegmentId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeSegmentId, autoScroll, isUserInteracting]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onWheel={handleUserScroll}
        onTouchMove={handleUserScroll}
        className="bg-sand-50/50 border border-sand-200/90 rounded-3xl p-4 sm:p-6 min-h-[460px] max-h-[62vh] overflow-y-auto space-y-3.5 shadow-inner scroll-smooth"
      >
        {isLoading ? (
          <LoadingSkeleton count={6} heightClass="h-28" />
        ) : segments.length === 0 ? (
          <EmptyState
            title={dict.emptyStates.noTranscriptAvailable}
            description={dict.player.noMatchingSegments}
            actionText={dict.player.clearSearch}
            onAction={onClearFilters}
          />
        ) : (
          segments.map((segment) => (
            <TranscriptSegmentCard
              key={segment.id}
              segment={segment}
              isActive={activeSegmentId === segment.id}
              isLooped={loopSegmentId === segment.id}
              showTranslation={showTranslation}
              currentMs={currentMs}
              unitNumber={unitNumber}
              onSeek={onSeek}
              onToggleLoop={onToggleLoop}
              onOpenDrill={onOpenDrill}
              onOpenInspector={onOpenInspector}
            />
          ))
        )}
      </div>

      {/* Floating Auto-Scroll Paused Indicator */}
      {autoScroll && isUserInteracting && activeSegmentId && (
        <div className="absolute bottom-4 right-6 z-20 animate-fade-in">
          <button
            onClick={handleResumeAutoScroll}
            aria-label={dict.player.resumeAutoScroll}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/95 backdrop-blur-md border border-ocean-200 text-ocean-800 text-xs font-bold rounded-2xl shadow-soft-lg hover:bg-ocean-50 active:scale-95 transition-all"
          >
            <Scroll className="w-3.5 h-3.5 text-ocean-600 animate-pulse" />
            <span>{dict.player.resumeAutoScroll}</span>
          </button>
        </div>
      )}
    </div>
  );
};
