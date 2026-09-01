import React, { useMemo } from 'react';
import { History, Play, Pause, CheckCircle2, Clock, ArrowRight, Sparkles, Headphones, Loader2 } from 'lucide-react';
import type { UnitSummary, AppView } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';
import { Badge } from '../common/Badge';

interface RecentActivityListProps {
  units: UnitSummary[];
  onSelectUnit: (unitNumber: number, positionMs?: number) => void;
  onNavigate?: (view: AppView) => void;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  units,
  onSelectUnit,
  onNavigate,
}) => {
  const { dict } = useDictionary();
  const { progress } = useAuth();
  const {
    unitNumber: activePlayingUnitNumber,
    isPlaying,
    isLoadingUnit,
    togglePlay,
  } = usePlayer();

  // Extract and sort recent activity based on user progress
  const recentUnits = useMemo(() => {
    if (!progress?.units) return [];

    const activeList = Object.values(progress.units).filter(
      (u) => u.completed || u.lastPositionMs > 0 || u.totalListenedMs > 0
    );

    // Sort by updatedAt descending or by unitNumber if timestamps equal
    activeList.sort((a, b) => {
      if (a.updatedAt && b.updatedAt) {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return b.unitNumber - a.unitNumber;
    });

    // Take top 4 recent units
    return activeList.slice(0, 4);
  }, [progress]);

  if (recentUnits.length === 0) {
    return (
      <div className="bg-white border border-sand-200 rounded-3xl p-6 sm:p-7 shadow-2xs mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-ocean-50 border border-ocean-200/60 flex items-center justify-center text-ocean-600 mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          {dict.studyDesk.noRecentActivity}
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
          {dict.studyDesk.noRecentActivityDesc}
        </p>
        <button
          onClick={() => onSelectUnit(1, 0)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl text-xs font-bold shadow-soft transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-ocean-300"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{dict.studyDesk.startUnitOne}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-sand-200 rounded-3xl p-5 sm:p-6 shadow-2xs mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-sand-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-sand-100 flex items-center justify-center text-slate-600">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              {dict.studyDesk.recentActivityTitle}
            </h2>
            <p className="text-[11px] text-slate-400">
              {dict.studyDesk.recentActivitySubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-ocean-700 bg-ocean-50 border border-ocean-200/70 px-2 py-0.5 rounded-lg">
            {recentUnits.length} {dict.studyDesk.filterCountLabel}
          </span>
          {onNavigate && (
            <button
              onClick={() => onNavigate('progress')}
              className="text-[11px] font-bold text-ocean-600 hover:text-ocean-800 hover:underline cursor-pointer hidden sm:inline-block"
            >
              {dict.studyDesk.viewAllAnalytics} →
            </button>
          )}
        </div>
      </div>

      {/* Grid of recent items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {recentUnits.map((item) => {
          const meta = units.find((u) => u.unitNumber === item.unitNumber);
          const isCurrentlyPlaying = activePlayingUnitNumber === item.unitNumber;
          const isCardLoading = isCurrentlyPlaying && isLoadingUnit;
          const isCompleted = item.completed;
          const durationMinutes = meta ? Math.max(1, Math.round(meta.audioDurationMs / 60000)) : 30;

          // Position formatted
          const posSeconds = Math.floor((item.lastPositionMs || 0) / 1000);
          const posMin = Math.floor(posSeconds / 60);
          const posSec = posSeconds % 60;
          const formattedPos = `${String(posMin).padStart(2, '0')}:${String(posSec).padStart(2, '0')}`;

          const handleCardClick = () => {
            if (isCurrentlyPlaying) {
              togglePlay();
              return;
            }
            onSelectUnit(item.unitNumber, item.lastPositionMs || 0);
          };

          return (
            <div
              key={item.unitNumber}
              tabIndex={0}
              role="button"
              aria-label={`${dict.studyDesk.unitCardPrefix} ${item.unitNumber}: ${meta?.title || ''}`}
              onClick={handleCardClick}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick()}
              className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-ocean-300 ${
                isCurrentlyPlaying
                  ? 'bg-ocean-50/60 border-ocean-400 ring-2 ring-ocean-200/70 shadow-glow-ocean'
                  : 'bg-sand-50/50 hover:bg-white border-sand-200 hover:border-ocean-300 hover:shadow-soft'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className="text-xs font-bold text-ocean-700 bg-white border border-sand-200/80 px-2 py-0.5 rounded-md shadow-2xs">
                    {dict.studyDesk.unitCardPrefix} {item.unitNumber}
                  </span>

                  {isCompleted ? (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="w-3 h-3" />
                      {dict.studyDesk.completedBadge}
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      <Clock className="w-3 h-3" />
                      {dict.studyDesk.inProgressBadge}
                    </Badge>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-800 group-hover:text-ocean-700 transition-colors line-clamp-1 mb-1">
                  {meta?.title || `${dict.studyDesk.unitCardPrefix} ${item.unitNumber}`}
                </h4>

                <p className="text-[11px] text-slate-400 mb-2">
                  {isCompleted ? (
                    <span className="text-emerald-600 font-medium">✓ {dict.studyDesk.completedBadge}</span>
                  ) : item.lastPositionMs > 0 ? (
                    <span>
                      {dict.studyDesk.lastPositionLabel}: <strong className="text-slate-600">{formattedPos}</strong>
                    </span>
                  ) : (
                    <span>~{durationMinutes} {dict.progress.minutesFormat}</span>
                  )}
                </p>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-sand-200/60 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 group-hover:text-ocean-700 text-[11px] flex items-center gap-1">
                  <span>
                    {isCurrentlyPlaying && isPlaying
                      ? dict.studyDesk.pauseLessonAction
                      : isCurrentlyPlaying && !isPlaying
                      ? dict.studyDesk.listenResumeAction
                      : dict.studyDesk.jumpToUnit}
                  </span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>

                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    isCurrentlyPlaying
                      ? 'bg-ocean-600 text-white shadow-2xs'
                      : 'bg-sand-200/70 text-slate-700 group-hover:bg-ocean-600 group-hover:text-white'
                  }`}
                >
                  {isCardLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : isCurrentlyPlaying && isPlaying ? (
                    <Pause className="w-3 h-3 fill-current ml-0.5" />
                  ) : (
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
