/**
 * Eidos Language OS - Dedicated Unit Workspace Header
 * Compact, airy yacht-deck header with back button, unit title, level badge, and metadata pills.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React from 'react';
import { ArrowLeft, Clock, Table, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useDictionary, interpolate } from '../../../context/DictionaryContext';

export interface UnitStudyHeaderProps {
  unitNumber: number;
  title: string;
  focus?: string;
  levelCode?: string;
  levelTitle?: string;
  estimatedDurationMinutes?: number;
  totalTablesCount?: number;
  hasAudio?: boolean;
  onBack: () => void;
  className?: string;
}

export const UnitStudyHeader: React.FC<UnitStudyHeaderProps> = ({
  unitNumber,
  title,
  focus,
  levelCode = 'A1',
  levelTitle,
  estimatedDurationMinutes,
  totalTablesCount,
  hasAudio = true,
  onBack,
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  const unitLabelText = interpolate(dh.unitLabel, { unit: unitNumber });
  const durationText = estimatedDurationMinutes
    ? interpolate(dh.lessonDuration, { duration: estimatedDurationMinutes })
    : null;
  const tablesText = totalTablesCount !== undefined
    ? interpolate(dh.tablesCount, { count: totalTablesCount })
    : null;

  return (
    <header
      data-testid="unit-study-header"
      className={`sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-3 sm:px-5 py-2.5 sm:py-3 transition-all ${className}`}
    >
      <div className="flex flex-col gap-2">
        {/* Top Row: Back Button, Badges & Metadata */}
        <div className="flex items-center justify-between gap-2">
          {/* Back Button (Min 44x44px touch target) */}
          <button
            type="button"
            onClick={onBack}
            data-testid="unit-workspace-back-button"
            className="group inline-flex items-center gap-1.5 min-h-[44px] min-w-[44px] px-2.5 py-1.5 -ml-1 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 active:scale-98"
            aria-label={dh.backToUnits}
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-800 transition-transform group-hover:-translate-x-0.5" />
            <span className="truncate max-w-[140px] sm:max-w-none">{dh.backToUnits}</span>
          </button>

          {/* Right Badges: Level, Audio & Table Count */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* Level Badge */}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70"
              title={levelTitle || levelCode}
            >
              {levelCode}
            </span>

            {/* Audio Indicator */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                hasAudio
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                  : 'bg-amber-50 text-amber-700 border-amber-200/70'
              }`}
              title={hasAudio ? dh.hasAudioBadge : dh.audioNotFound}
            >
              {hasAudio ? (
                <>
                  <Volume2 className="w-3 h-3 text-emerald-600" />
                  <span className="hidden xs:inline">{dh.hasAudioBadge}</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3 h-3 text-amber-600" />
                  <span className="hidden xs:inline">{dh.audioNotFound}</span>
                </>
              )}
            </span>

            {/* Duration Pill */}
            {durationText && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{durationText}</span>
              </span>
            )}

            {/* Tables Count Pill */}
            {tablesText && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200/70">
                <Table className="w-3 h-3 text-sky-500" />
                <span>{tablesText}</span>
              </span>
            )}
          </div>
        </div>

        {/* Bottom Row: Unit Number, Title & Focus Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 shrink-0">
              {unitLabelText}
            </span>
            <span className="text-slate-300 font-light select-none">|</span>
            <h1
              className="text-sm sm:text-base md:text-lg font-bold text-slate-900 truncate"
              title={title}
            >
              {title}
            </h1>
          </div>

          {/* Focus or Theme Note */}
          {focus && (
            <p
              className="text-[11px] sm:text-xs text-slate-500 font-medium truncate max-w-full sm:max-w-md flex items-center gap-1"
              title={focus}
            >
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0 inline" />
              <span className="truncate">{focus}</span>
            </p>
          )}
        </div>
      </div>
    </header>
  );
};
