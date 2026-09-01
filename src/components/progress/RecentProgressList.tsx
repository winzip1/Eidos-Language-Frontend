import React from 'react';
import { Clock, Play, CheckCircle2, Circle, History, BookOpen } from 'lucide-react';
import type { AppView } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';

interface RecentProgressListProps {
  onNavigate: (view: AppView) => void;
}

export const RecentProgressList: React.FC<RecentProgressListProps> = ({ onNavigate }) => {
  const { dict } = useDictionary();
  const { progress } = useAuth();
  const { loadAndPlayUnit } = usePlayer();

  const totalUnits = progress?.totalUnits || 10;

  // Extract units that have activity (listened or completed)
  const activeUnits = Object.entries(progress?.units || {})
    .map(([numStr, uProg]) => {
      const unitNum = Number(numStr);
      return {
        unitNumber: unitNum,
        completed: Boolean(uProg.completed),
        lastPositionMs: uProg.lastPositionMs || 0,
        totalListenedMs: uProg.totalListenedMs || 0,
        updatedAt: uProg.updatedAt || uProg.completedAt,
      };
    })
    .filter((u) => u.lastPositionMs > 0 || u.completed || u.totalListenedMs > 0)
    .sort((a, b) => {
      if (a.updatedAt && b.updatedAt) {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return b.unitNumber - a.unitNumber;
    });

  const handleResume = (unitNum: number, lastPositionMs: number) => {
    loadAndPlayUnit(unitNum, lastPositionMs, true);
    onNavigate('player');
  };

  return (
    <div className="bg-white border border-sand-200 rounded-3xl p-6 sm:p-8 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-100">
        <div>
          <div className="flex items-center gap-2 text-ocean-700 font-bold text-xs uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>{dict.progress.recentActivityTitle}</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {dict.progress.recentActivitySubtitle}
          </p>
        </div>

        <span className="text-xs font-semibold text-slate-400">
          {activeUnits.length} / {totalUnits} {dict.progress.unitUnitPrefix}
        </span>
      </div>

      {/* List or Empty State */}
      {activeUnits.length === 0 ? (
        <div className="p-8 text-center bg-sand-50/70 border border-sand-200 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-sand-200 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
            <BookOpen className="w-6 h-6 text-ocean-600" />
          </div>
          <h4 className="text-sm font-extrabold text-slate-800">
            {dict.progress.noRecentActivity}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {dict.progress.noRecentActivityDesc}
          </p>
          <button
            type="button"
            onClick={() => handleResume(1, 0)}
            className="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-soft inline-flex items-center gap-2 transition-all cursor-pointer select-none"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{dict.progress.startListening}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {activeUnits.slice(0, 6).map((item) => {
            const minutes = Math.round(item.lastPositionMs / 60000);
            const seconds = Math.floor((item.lastPositionMs % 60000) / 1000);
            const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

            return (
              <div
                key={item.unitNumber}
                className="p-4 bg-sand-50/60 border border-sand-200 hover:border-sand-300 hover:bg-white rounded-2xl transition-all flex items-center justify-between gap-4 shadow-2xs group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-sand-200 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-ocean-300 transition-colors">
                    <span className="text-xs font-black text-slate-800">
                      {dict.progress.unitAxisShortPrefix}{item.unitNumber}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-slate-900 truncate">
                        {dict.progress.unitUnitPrefix} {item.unitNumber}
                      </h4>
                      {item.completed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{dict.library.completedBadge}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-ocean-50 text-ocean-700 border border-ocean-200">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{timeFormatted}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                      {dict.progress.lastListenedTime}: {Math.round(item.totalListenedMs / 60000)} {dict.progress.minutesFormat}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleResume(item.unitNumber, item.lastPositionMs)}
                  className="px-3 py-1.5 bg-white hover:bg-ocean-600 text-slate-700 hover:text-white border border-sand-200 hover:border-ocean-600 font-bold text-xs rounded-xl shadow-2xs hover:shadow-soft flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{item.completed ? dict.progress.jumpToLesson : dict.progress.resumeButton}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
