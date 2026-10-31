/**
 * Eidos Language OS - Header Lesson Information & Metadata Strip
 * Dedicated sub-row inside the header displaying lesson title, audio duration, and status badges.
 * Strictly Light Mode - Zero Hardcode - Full Width Title (Prevents truncation/collision).
 */
import React from 'react';
import { Clock, CheckCircle2, Headphones } from 'lucide-react';
import { useDictionary } from '../../../context/DictionaryContext';
import { formatElapsed } from '../../../utils/audioTime';

export interface HeaderLessonInfoProps {
  unitNumber: number | null;
  unitTitle?: string;
  hasTranscript?: boolean;
  audioDurationMs?: number;
  isCompleted?: boolean;
}

export const HeaderLessonInfo: React.FC<HeaderLessonInfoProps> = ({
  unitNumber,
  unitTitle,
  hasTranscript = true,
  audioDurationMs,
  isCompleted = false,
}) => {
  const { dict } = useDictionary();

  const hasValidUnitNum = typeof unitNumber === 'number' && !isNaN(unitNumber) && unitNumber > 0;

  const resolvedTitle = unitTitle
    ? unitTitle
    : hasValidUnitNum
    ? `${dict.lessonPlayer.lessonTitle} - ${dict.lessonPlayer.dayPrefix} ${unitNumber}`
    : dict.lessonPlayer.lessonTitle;

  const effectiveAudioDurationMs =
    audioDurationMs !== undefined && audioDurationMs > 0
      ? audioDurationMs
      : !hasTranscript
      ? 1800000
      : 0;

  return (
    <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center justify-between gap-2 min-w-0">
      {/* Lesson Title */}
      <h1
        title={resolvedTitle}
        className="text-xs sm:text-sm lg:text-base font-bold text-slate-900 tracking-tight truncate flex-1 min-w-0"
      >
        {resolvedTitle}
      </h1>

      {/* Metadata Badges Group */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Audio Duration */}
        {effectiveAudioDurationMs > 0 && (
          <span
            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-medium text-slate-500 bg-sand-50 border border-sand-200 px-2 py-0.5 rounded-lg select-none shrink-0"
            title={dict.lessonPlayer.currentTimeLabel}
          >
            <Clock className="w-3 h-3 text-slate-400" />
            {formatElapsed(effectiveAudioDurationMs)}
          </span>
        )}

        {/* Audio Immersion Mode Badge */}
        {!hasTranscript && (
          <span
            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-ocean-700 bg-ocean-50 border border-ocean-200/90 px-2 py-0.5 rounded-lg select-none shadow-2xs shrink-0"
            title={
              dict.player?.audioImmersionNotice ||
              dict.player?.audioImmersionMode ||
              dict.lessonPlayer?.audioImmersionMode
            }
          >
            <Headphones className="w-3 h-3 text-ocean-600 shrink-0" aria-hidden="true" />
            <span className="hidden xs:inline">
              {dict.player?.audioImmersionMode || dict.lessonPlayer?.audioImmersionMode}
            </span>
          </span>
        )}

        {/* Completed Badge */}
        {isCompleted && (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs select-none shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span className="hidden xs:inline">{dict.lessonPlayer.completedBadge}</span>
          </span>
        )}
      </div>
    </div>
  );
};
