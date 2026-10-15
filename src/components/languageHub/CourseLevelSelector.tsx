/**
 * Eidos Language OS - Course Level Selector Component
 * Modular segmented level selector supporting CEFR tracks, unit count, and availability states.
 * ZERO HARDCODE & STRICTLY LIGHT MODE.
 */
import React from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';
import type { CourseLevelMeta } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';

interface CourseLevelSelectorProps {
  levels: CourseLevelMeta[];
  selectedLevelId: string;
  onSelectLevel: (levelId: string) => void;
  isCourseActive: boolean;
  activeLevelId?: string;
}

export const CourseLevelSelector: React.FC<CourseLevelSelectorProps> = ({
  levels,
  selectedLevelId,
  onSelectLevel,
  isCourseActive,
  activeLevelId,
}) => {
  const { dict } = useDictionary();

  if (!levels || levels.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {dict.languageHub.availableLevels}
        </span>
        <span className="text-[10px] font-medium text-slate-400">
          {levels.length} {dict.languageHub.levelCountBadge}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {levels.map((level) => {
          const isCurrentlyRunning = isCourseActive && activeLevelId === level.id;
          const isSelected = selectedLevelId === level.id;

          return (
            <button
              key={level.id}
              type="button"
              disabled={!level.isAvailable}
              onClick={() => {
                if (level.isAvailable) {
                  onSelectLevel(level.id);
                }
              }}
              title={
                level.isAvailable
                  ? `${level.name} • ${level.cefrLevel}`
                  : `${level.name} (${dict.languageHub.comingSoonBadge})`
              }
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500 ${
                isCurrentlyRunning
                  ? 'bg-ocean-50/90 border-ocean-300 ring-2 ring-ocean-100/80 shadow-2xs cursor-pointer'
                  : isSelected
                  ? 'bg-white border-ocean-400 ring-2 ring-ocean-100 shadow-2xs cursor-pointer'
                  : level.isAvailable
                  ? 'bg-sand-50/70 hover:bg-white border-sand-200 hover:border-sand-300 hover:shadow-2xs text-slate-700 cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-50/80 border-slate-200 text-slate-400 opacity-70 cursor-not-allowed'
              }`}
            >
              {/* Header: Title and Status Badge */}
              <div className="flex items-center justify-between gap-2 w-full">
                <span
                  className={`text-xs font-bold truncate ${
                    isCurrentlyRunning
                      ? 'text-ocean-950'
                      : isSelected
                      ? 'text-slate-900'
                      : level.isAvailable
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {level.name}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isCurrentlyRunning && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {dict.languageHub.levelSelected}
                    </span>
                  )}
                  {!level.isAvailable && (
                    <Lock className="w-3 h-3 text-slate-400" />
                  )}
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${
                      isCurrentlyRunning
                        ? 'bg-white text-ocean-700 border-ocean-200'
                        : isSelected
                        ? 'bg-ocean-50 text-ocean-800 border-ocean-200'
                        : 'bg-white text-slate-600 border-sand-200'
                    }`}
                  >
                    {level.cefrLevel}
                  </span>
                </div>
              </div>

              {/* Footer: Units & Duration Meta */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                {level.totalUnits > 0 ? (
                  <span>
                    {level.totalUnits} {dict.languageHub.unitsSuffix}
                  </span>
                ) : (
                  <span>{dict.languageHub.comingSoonBadge}</span>
                )}
                {level.totalAudioDurationMs > 0 && (
                  <span>
                    ~{Math.round(level.totalAudioDurationMs / 3600000)} {dict.languageHub.hoursShort}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
