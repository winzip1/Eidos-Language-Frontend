import React from 'react';
import { Award, CheckCircle2, Clock, Play } from 'lucide-react';
import type { AppView } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';

interface UnitProgressGridProps {
  onNavigate: (view: AppView) => void;
}

export const UnitProgressGrid: React.FC<UnitProgressGridProps> = ({ onNavigate }) => {
  const { dict } = useDictionary();
  const { progress } = useAuth();
  const { loadAndPlayUnit } = usePlayer();

  const totalUnits = progress?.totalUnits || 10;

  const handleUnitClick = (unitNum: number, lastPositionMs: number) => {
    loadAndPlayUnit(unitNum, lastPositionMs, true);
    onNavigate('player');
  };

  return (
    <div className="bg-white border border-sand-200 rounded-3xl p-6 sm:p-8 shadow-soft">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-sand-100">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-ocean-600" />
          <span>{dict.progress.unitList} ({totalUnits} {dict.progress.unitUnitPrefix})</span>
        </h3>
        <span className="text-xs font-semibold text-slate-400">
          {dict.progress.overallCompletion}: %{progress?.overallCompletionRate || 0}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {Array.from({ length: totalUnits }).map((_, i) => {
          const unitNum = i + 1;
          const uProg = progress?.units[unitNum];
          const isCompleted = Boolean(uProg?.completed);
          const isInProg = Boolean(uProg && !uProg.completed && uProg.lastPositionMs > 0);
          const lastPositionMs = uProg?.lastPositionMs || 0;

          // Progress percentage
          const percent = isCompleted
            ? 100
            : isInProg
            ? Math.min(95, Math.max(10, Math.round((lastPositionMs / 1800000) * 100)))
            : 0;

          return (
            <div
              key={unitNum}
              onClick={() => handleUnitClick(unitNum, lastPositionMs)}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[110px] group select-none hover:-translate-y-0.5 active:scale-98 ${
                isCompleted
                  ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950 hover:bg-emerald-100/50 hover:border-emerald-300'
                  : isInProg
                  ? 'bg-ocean-50/40 border-ocean-200 text-ocean-950 hover:bg-ocean-100/50 hover:border-ocean-300'
                  : 'bg-sand-50/40 border-sand-200 text-slate-700 hover:bg-sand-100/70 hover:border-sand-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold tracking-tight">
                  {dict.progress.unitAxisShortPrefix}{unitNum}
                </span>

                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : isInProg ? (
                  <Clock className="w-4 h-4 text-ocean-600 animate-spin-slow" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-sand-300 group-hover:bg-ocean-400 transition-colors" />
                )}
              </div>

              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span className="truncate">
                    {isCompleted
                      ? dict.library.completedBadge
                      : isInProg
                      ? `${Math.round(lastPositionMs / 60000)} ${dict.progress.minutesFormat}`
                      : dict.library.notStartedBadge}
                  </span>
                  <Play className="w-3 h-3 text-slate-400 group-hover:text-ocean-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Progress mini bar */}
                <div className="w-full h-1.5 bg-sand-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-500'
                        : isInProg
                        ? 'bg-ocean-500'
                        : 'bg-transparent'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
