import React from 'react';
import { Mic, Radio } from 'lucide-react';
import { useDictionary } from '../../../context/DictionaryContext';
import type { Segment } from '../../../types';

interface GlobalPlayerTranscriptTickerProps {
  activeSegment: Segment | null;
  unitNumber: number | null;
  unitTitle?: string;
  isPlaying: boolean;
  showTranslation?: boolean;
  onClick?: () => void;
}

export const GlobalPlayerTranscriptTicker: React.FC<GlobalPlayerTranscriptTickerProps> = ({
  activeSegment,
  unitNumber,
  unitTitle,
  isPlaying,
  showTranslation = true,
  onClick,
}) => {
  const { dict } = useDictionary();

  const getSpeakerLabel = (): string => {
    if (!activeSegment) return '';
    const speakerKey = activeSegment.speaker;
    if (speakerKey && dict.speakers[speakerKey]) {
      return dict.speakers[speakerKey];
    }
    return activeSegment.speakerDisplayName || dict.speakers.UNKNOWN;
  };

  const getTranslationText = (): string => {
    if (!activeSegment) return '';
    if (dict.meta.locale === 'tr' && activeSegment.turkishText) {
      return activeSegment.turkishText;
    }
    if (activeSegment.englishText) {
      return activeSegment.englishText;
    }
    return activeSegment.turkishText || '';
  };

  const translation = getTranslationText();

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2.5 min-w-0 max-w-full cursor-pointer group py-1 select-none"
      title={activeSegment ? `${getSpeakerLabel()}: ${activeSegment.rawText}` : undefined}
    >
      {/* Live Audio Indicator Pill */}
      <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sand-100/90 border border-sand-200/80 group-hover:bg-ocean-50 group-hover:border-ocean-200 transition-colors">
        {isPlaying ? (
          <div className="flex items-center gap-0.5 h-3.5">
            <span className="w-0.5 h-3 bg-ocean-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-0.5 h-2 bg-ocean-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-0.5 h-3.5 bg-ocean-600 rounded-full animate-bounce" />
          </div>
        ) : (
          <Radio className="w-3.5 h-3.5 text-slate-400 group-hover:text-ocean-600" />
        )}
        <span className="text-[10px] font-bold text-ocean-700 tracking-tight hidden sm:inline">
          {dict.globalPlayer.liveBadge}
        </span>
      </div>

      {/* Speaker and Live Sentence Ticker */}
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        {activeSegment ? (
          <div className="flex flex-col min-w-0">
            {/* Top row: Speaker tag + original sentence */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-sand-100/80 px-1.5 py-0.2 rounded border border-sand-200/60 group-hover:text-ocean-700 group-hover:border-ocean-200 transition-colors">
                {getSpeakerLabel()}
              </span>
              <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-ocean-900 transition-colors">
                {activeSegment.rawText}
              </span>
            </div>

            {/* Translation preview line (if enabled) */}
            {showTranslation && translation && (
              <span className="text-[11px] text-slate-500 truncate italic mt-0.5">
                {translation}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
            <Mic className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium">
              {unitNumber
                ? `${dict.globalPlayer.unitBadge} ${String(unitNumber).padStart(2, '0')} ${
                    unitTitle ? `• ${unitTitle}` : ''
                  }`
                : dict.globalPlayer.selectUnitToPlay}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
