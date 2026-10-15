import React from 'react';
import {
  Award,
  Sparkles,
  Play,
  CheckCircle2,
  Lock,
  Headphones,
  Zap,
  Bookmark,
  Flame,
  GraduationCap,
  Trophy,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';

interface BadgeDefinition {
  id: string;
  titleKey: string;
  descKey: string;
  icon: React.FC<{ className?: string }>;
  color: 'ocean' | 'amber' | 'emerald' | 'purple' | 'rose';
  isUnlocked: boolean;
  currentValue: number;
  targetValue: number;
  unitLabel: string;
}

export const AchievementBadgeGrid: React.FC = () => {
  const { dict } = useDictionary();
  const { progress } = useAuth();

  const totalUnits = progress?.totalUnits || 10;
  const completedUnits = progress?.completedUnitsCount || 0;
  const totalMinutes = progress?.totalListenedMinutes || 0;
  const masteredVocab = progress?.vocabulary.mastered || 0;
  const totalPracticedVocab = (progress?.vocabulary.mastered || 0) + (progress?.vocabulary.learning || 0);
  const streakDays = progress?.streakDays || (completedUnits > 0 || totalMinutes > 0 ? 1 : 0);

  // Check if any unit has started
  let hasStartedAnyUnit = totalMinutes > 0 || completedUnits > 0;
  if (!hasStartedAnyUnit && progress?.units) {
    for (let i = 1; i <= totalUnits; i++) {
      if (progress.units[i] && (progress.units[i].lastPositionMs > 0 || progress.units[i].completed)) {
        hasStartedAnyUnit = true;
        break;
      }
    }
  }

  const badges: BadgeDefinition[] = [
    {
      id: 'first_step',
      titleKey: dict.progress.badgeFirstStepTitle,
      descKey: dict.progress.badgeFirstStepDesc,
      icon: Play,
      color: 'ocean',
      isUnlocked: hasStartedAnyUnit,
      currentValue: hasStartedAnyUnit ? 1 : 0,
      targetValue: 1,
      unitLabel: dict.progress.unitUnitPrefix,
    },
    {
      id: 'first_milestone',
      titleKey: dict.progress.badgeFirstMilestoneTitle,
      descKey: dict.progress.badgeFirstMilestoneDesc,
      icon: CheckCircle2,
      color: 'emerald',
      isUnlocked: completedUnits >= 1,
      currentValue: Math.min(1, completedUnits),
      targetValue: 1,
      unitLabel: dict.progress.unitUnitPrefix,
    },
    {
      id: 'audio_explorer',
      titleKey: dict.progress.badgeAudioExplorerTitle,
      descKey: dict.progress.badgeAudioExplorerDesc,
      icon: Headphones,
      color: 'ocean',
      isUnlocked: totalMinutes >= 30,
      currentValue: Math.min(30, totalMinutes),
      targetValue: 30,
      unitLabel: dict.progress.minutesFormat,
    },
    {
      id: 'audio_master',
      titleKey: dict.progress.badgeAudioMasterTitle,
      descKey: dict.progress.badgeAudioMasterDesc,
      icon: Zap,
      color: 'amber',
      isUnlocked: totalMinutes >= 100,
      currentValue: Math.min(100, totalMinutes),
      targetValue: 100,
      unitLabel: dict.progress.minutesFormat,
    },
    {
      id: 'vocab_hunter',
      titleKey: dict.progress.badgeVocabHunterTitle,
      descKey: dict.progress.badgeVocabHunterDesc,
      icon: Bookmark,
      color: 'purple',
      isUnlocked: totalPracticedVocab >= 10,
      currentValue: Math.min(10, totalPracticedVocab),
      targetValue: 10,
      unitLabel: dict.vocabulary.statsSummaryTitle,
    },
    {
      id: 'vocab_master',
      titleKey: dict.progress.badgeVocabMasterTitle,
      descKey: dict.progress.badgeVocabMasterDesc,
      icon: Trophy,
      color: 'emerald',
      isUnlocked: masteredVocab >= 50,
      currentValue: Math.min(50, masteredVocab),
      targetValue: 50,
      unitLabel: dict.vocabulary.statsSummaryTitle,
    },
    {
      id: 'streak_champion',
      titleKey: dict.progress.badgeStreakChampionTitle,
      descKey: dict.progress.badgeStreakChampionDesc,
      icon: Flame,
      color: 'rose',
      isUnlocked: streakDays >= 3,
      currentValue: Math.min(3, streakDays),
      targetValue: 3,
      unitLabel: dict.progress.streakDays,
    },
    {
      id: 'course_graduate',
      titleKey: dict.progress.badgeGraduateTitle,
      descKey: dict.progress.badgeGraduateDesc,
      icon: GraduationCap,
      color: 'amber',
      isUnlocked: completedUnits >= totalUnits,
      currentValue: Math.min(totalUnits, completedUnits),
      targetValue: totalUnits,
      unitLabel: dict.progress.unitUnitPrefix,
    },
  ];

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  const colorStyles = {
    ocean: {
      bg: 'bg-ocean-50',
      border: 'border-ocean-200',
      text: 'text-ocean-700',
      fillBg: 'bg-ocean-500',
      ring: 'ring-ocean-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      fillBg: 'bg-emerald-500',
      ring: 'ring-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      fillBg: 'bg-amber-500',
      ring: 'ring-amber-100',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      fillBg: 'bg-purple-500',
      ring: 'ring-purple-100',
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      fillBg: 'bg-rose-500',
      ring: 'ring-rose-100',
    },
  };

  return (
    <div className="bg-white border border-sand-200 rounded-3xl p-6 sm:p-8 shadow-soft space-y-6">
      {/* Header with Title and Unlocked Ratio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-100">
        <div>
          <div className="flex items-center gap-2 text-ocean-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>{dict.progress.achievementsTitle}</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {dict.progress.achievementsSubtitle}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sand-100 border border-sand-200 rounded-2xl text-xs font-bold text-slate-800 self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>
            {unlockedCount} / {badges.length} {dict.progress.badgeUnlocked}
          </span>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {badges.map((badge) => {
          const Icon = badge.icon;
          const style = colorStyles[badge.color];
          const progressPercent = Math.min(100, Math.round((badge.currentValue / badge.targetValue) * 100));

          return (
            <div
              key={badge.id}
              className={`p-4.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                badge.isUnlocked
                  ? 'bg-white border-sand-200 shadow-2xs hover:border-sand-300 hover:shadow-soft'
                  : 'bg-sand-50/60 border-sand-200/80 opacity-75'
              }`}
            >
              {/* Top Row: Icon + Status Pill */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-transform ${
                    badge.isUnlocked
                      ? `${style.bg} ${style.border} ${style.text} shadow-2xs`
                      : 'bg-sand-200/60 border-sand-300 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {badge.isUnlocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{dict.progress.badgeUnlocked}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sand-200/80 text-slate-500 border border-sand-300">
                    <Lock className="w-3 h-3" />
                    <span>{dict.progress.badgeLocked}</span>
                  </span>
                )}
              </div>

              {/* Middle: Title & Description */}
              <div className="space-y-1">
                <h4
                  className={`text-sm font-extrabold tracking-tight ${
                    badge.isUnlocked ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  {badge.titleKey}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  {badge.descKey}
                </p>
              </div>

              {/* Bottom: Progress Bar & Milestone Ratio */}
              <div className="pt-3 mt-3 border-t border-sand-100/80">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>
                    {badge.currentValue} / {badge.targetValue}
                  </span>
                  <span>%{progressPercent}</span>
                </div>

                <div className="w-full h-1.5 bg-sand-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      badge.isUnlocked ? style.fillBg : 'bg-slate-300'
                    }`}
                    style={{ width: `${progressPercent}%` }}
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
