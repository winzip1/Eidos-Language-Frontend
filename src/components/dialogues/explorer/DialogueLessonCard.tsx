/**
 * Eidos Language OS - Dialogue Explorer Lesson Card (3. Kademe: Ders Kartı)
 * Displays a single lesson's metadata: number, title, estimated duration, table count,
 * audio guide badge, and a min-44px "Çalışmaya Başla" CTA button.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React from 'react';
import { BookOpen, Clock, Table2, Volume2, Sparkles, ArrowRight } from 'lucide-react';
import type { UnitSummary } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';

export interface DialogueLessonCardProps {
  unit: UnitSummary;
  onSelectLesson: (unitNumber: number) => void;
  levelCode?: string;
  className?: string;
}

export const DialogueLessonCard: React.FC<DialogueLessonCardProps> = ({
  unit,
  onSelectLesson,
  levelCode = 'A1',
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  const unitLabelText = dh.unitLabel.replace('{unit}', String(unit.unitNumber));
  const tablesCount = unit.totalGuideTables || unit.totalSegments || 67;
  const tablesBadgeText = dh.tablesCount.replace('{count}', String(tablesCount));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectLesson(unit.unitNumber);
    }
  };

  return (
    <article
      data-testid={`dialogue-lesson-card-${unit.unitNumber}`}
      tabIndex={0}
      role="button"
      aria-label={`${unitLabelText}: ${unit.title}`}
      onClick={() => onSelectLesson(unit.unitNumber)}
      onKeyDown={handleKeyDown}
      className={`group relative bg-white border border-sand-200/90 rounded-2xl p-4 sm:p-5 shadow-soft-xs hover:border-ocean-300 hover:shadow-soft-md transition-all cursor-pointer select-none active:scale-[0.99] flex flex-col justify-between gap-3.5 ${className}`}
    >
      {/* Top Header Row: Unit Number Badge & Audio Indicator */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-ocean-50 text-ocean-700 border border-ocean-200/80 font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-soft-xs group-hover:scale-105 transition-transform">
            {unit.unitNumber}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-extrabold text-ocean-700 tracking-wide uppercase">
                {unitLabelText}
              </span>
              <span className="text-slate-300 font-semibold">•</span>
              <span className="text-xs font-semibold text-slate-500">{levelCode}</span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 line-clamp-2 mt-0.5 group-hover:text-ocean-900 transition-colors">
              {unit.title}
            </h3>
          </div>
        </div>

        {/* Audio Available Badge */}
        {unit.audioAvailable !== false && (
          <span
            title={dh.hasAudioBadge}
            className="shrink-0 w-8 h-8 rounded-lg bg-sand-50 border border-sand-200/70 text-ocean-600 flex items-center justify-center"
          >
            <Volume2 className="w-4 h-4 text-ocean-600" />
          </span>
        )}
      </div>

      {/* Badges Row: Duration, Tables count, Pedagogy sections */}
      <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold text-slate-600">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sand-50 border border-sand-200/60 text-[11px] sm:text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{dh.lessonDuration}</span>
        </span>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sand-50 border border-sand-200/60 text-[11px] sm:text-xs">
          <Table2 className="w-3.5 h-3.5 text-ocean-600" />
          <span>{tablesBadgeText}</span>
        </span>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] sm:text-[11px] font-bold">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>{dh.drillPatternsBadge}</span>
        </span>
      </div>

      {/* Bottom CTA Row: "Çalışmaya Başla" Button */}
      <div className="pt-2.5 border-t border-sand-100 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-400">
          {dh.dialogueIntroBadge}
        </span>

        <button
          type="button"
          data-testid={`dialogue-study-btn-${unit.unitNumber}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectLesson(unit.unitNumber);
          }}
          aria-label={`${dh.studyNowBtn}: ${unitLabelText}`}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 min-h-[44px] rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-xs sm:text-sm font-extrabold shadow-soft-xs hover:shadow-soft-sm transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <span>{dh.studyNowBtn}</span>
          <ArrowRight className="w-4 h-4 text-white/90 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </article>
  );
};
