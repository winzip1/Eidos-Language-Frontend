import React from 'react';
import { Flame, Clock, Award, CheckCircle2 } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';

export const ProgressStatCards: React.FC = () => {
  const { dict } = useDictionary();
  const { progress } = useAuth();

  const completedUnits = progress?.completedUnitsCount || 0;
  const totalUnits = progress?.totalUnits || 10;
  const totalMinutes = progress?.totalListenedMinutes || 0;
  const masteredVocab = progress?.vocabulary.mastered || 0;
  const learningVocab = progress?.vocabulary.learning || 0;
  const overallCompletionRate = progress?.overallCompletionRate || 0;

  const streakDays = progress?.streakDays !== undefined ? progress.streakDays : (completedUnits > 0 || totalMinutes > 0 ? 1 : 0);

  const stats = [
    {
      id: 'completion',
      label: dict.progress.overallCompletion,
      value: `%${overallCompletionRate}`,
      sub: `${completedUnits} / ${totalUnits} ${dict.progress.unitUnitPrefix}`,
      icon: Award,
      color: 'ocean',
      bg: 'bg-ocean-50',
      border: 'border-ocean-200',
      text: 'text-ocean-700',
      barColor: 'bg-ocean-500',
      progressPercent: overallCompletionRate,
    },
    {
      id: 'time',
      label: dict.progress.timeListened,
      value: `${totalMinutes} ${dict.progress.minutesFormat}`,
      sub: `${(totalMinutes / 60).toFixed(1)} ${dict.progress.hoursFormat}`,
      icon: Clock,
      color: 'amber',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      barColor: 'bg-amber-500',
      progressPercent: Math.min(100, Math.round((totalMinutes / 300) * 100)),
    },
    {
      id: 'mastered',
      label: dict.vocabulary.masteredCountLabel,
      value: `${masteredVocab}`,
      sub: `${learningVocab} ${dict.vocabulary.learningCountLabel}`,
      icon: CheckCircle2,
      color: 'emerald',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      barColor: 'bg-emerald-500',
      progressPercent: (masteredVocab + learningVocab) > 0 ? Math.round((masteredVocab / (masteredVocab + learningVocab)) * 100) : 0,
    },
    {
      id: 'streak',
      label: dict.progress.currentStreak,
      value: `${streakDays} ${dict.progress.streakDays}`,
      sub: dict.progress.streakDescription,
      icon: Flame,
      color: 'rose',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      barColor: 'bg-rose-500',
      progressPercent: streakDays > 0 ? Math.min(100, streakDays * 20) : 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            className="bg-white border border-sand-200 rounded-3xl p-5 shadow-soft hover:shadow-hover hover:border-sand-300 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500">{stat.label}</span>
              <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.border} border flex items-center justify-center ${stat.text}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {stat.value}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                {stat.sub}
              </div>

              {/* Mini visual indicator bar */}
              <div className="w-full h-1.5 bg-sand-100 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full ${stat.barColor} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.max(0, Math.min(100, stat.progressPercent))}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
