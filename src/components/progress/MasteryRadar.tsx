import React, { useState } from 'react';
import {
  Radar,
  CheckCircle2,
  Clock,
  Circle,
  Play,
  Info,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { AppView } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';

interface MasteryRadarProps {
  onNavigate?: (view: AppView) => void;
}

type RadarViewMode = 'units' | 'cefr';

export const MasteryRadar: React.FC<MasteryRadarProps> = ({ onNavigate }) => {
  const { dict } = useDictionary();
  const { progress } = useAuth();
  const { loadAndPlayUnit } = usePlayer();

  const [radarMode, setRadarMode] = useState<RadarViewMode>('units');
  const [selectedUnit, setSelectedUnit] = useState<number>(1);

  const totalUnits = progress?.totalUnits || 10;
  const completedUnits = progress?.completedUnitsCount || 0;
  const totalMinutes = progress?.totalListenedMinutes || 0;
  const masteredVocab = progress?.vocabulary.mastered || 0;
  const overallCompletion = progress?.overallCompletionRate || 0;

  // Center and Radius for SVG canvas
  const cx = 160;
  const cy = 160;
  const radius = 100;
  const levels = [0.25, 0.5, 0.75, 1.0];

  // Helper for Polar to Cartesian Coordinates for N vertices
  const getCoordinates = (index: number, totalPoints: number, scale: number) => {
    // 0 is top vertex, angles go clockwise
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / totalPoints;
    const x = cx + radius * scale * Math.cos(angle);
    const y = cy + radius * scale * Math.sin(angle);
    return { x, y, angle };
  };

  // Generate grid polygon paths for concentric levels
  const getGridPolygonPoints = (totalPoints: number, levelScale: number) => {
    return Array.from({ length: totalPoints })
      .map((_, i) => {
        const { x, y } = getCoordinates(i, totalPoints, levelScale);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // 1. Compute 10-Unit metrics (Completion & Listening ratios)
  const unitStats = Array.from({ length: totalUnits }).map((_, i) => {
    const unitNum = i + 1;
    const uProg = progress?.units[unitNum];

    const isCompleted = Boolean(uProg?.completed);
    const lastPosMs = uProg?.lastPositionMs || 0;
    const listenedMs = uProg?.totalListenedMs || 0;

    // Approximate unit duration ~30 minutes (1,800,000 ms)
    const completionRatio = isCompleted
      ? 1.0
      : lastPosMs > 0
      ? Math.min(0.95, Math.max(0.15, lastPosMs / 1800000))
      : 0.05;

    const listeningRatio = listenedMs > 0
      ? Math.min(1.0, Math.max(0.15, listenedMs / 1800000))
      : 0.05;

    return {
      unitNum,
      isCompleted,
      isInProgress: !isCompleted && lastPosMs > 0,
      isNotStarted: !isCompleted && lastPosMs === 0,
      completionRatio,
      listeningRatio,
      lastPositionMs: lastPosMs,
      totalListenedMs: listenedMs,
      totalMinutes: Math.round(listenedMs / 60000),
    };
  });

  const completionPolygonPoints = unitStats
    .map((stat, i) => {
      const { x, y } = getCoordinates(i, totalUnits, stat.completionRatio);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const listeningPolygonPoints = unitStats
    .map((stat, i) => {
      const { x, y } = getCoordinates(i, totalUnits, stat.listeningRatio);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const activeStat = unitStats[selectedUnit - 1] || unitStats[0];

  // 2. Compute 5-Axis CEFR Competency metrics
  // All calculated strictly from raw state f(state)
  const cefrAxes = [
    {
      id: 'listening',
      name: dict.progress.cefrListening,
      ratio: Math.min(1.0, Math.max(0.08, totalMinutes / 150)),
      displayVal: `${totalMinutes} ${dict.progress.minutesFormat}`,
      icon: Clock,
    },
    {
      id: 'vocabulary',
      name: dict.progress.cefrVocabulary,
      ratio: Math.min(1.0, Math.max(0.08, masteredVocab / 50)),
      displayVal: `${masteredVocab} / 50`,
      icon: Layers,
    },
    {
      id: 'pronunciation',
      name: dict.progress.cefrPronunciation,
      ratio: Math.min(1.0, Math.max(0.08, (completedUnits / totalUnits) * 0.85 + (totalMinutes / 200) * 0.15)),
      displayVal: `%${Math.round(Math.min(100, (completedUnits / totalUnits) * 85 + (totalMinutes / 200) * 15))}`,
      icon: Sparkles,
    },
    {
      id: 'dialogue',
      name: dict.progress.cefrDialogue,
      ratio: Math.min(1.0, Math.max(0.08, completedUnits / totalUnits)),
      displayVal: `${completedUnits} / ${totalUnits}`,
      icon: Award,
    },
    {
      id: 'completion',
      name: dict.progress.cefrCompletion,
      ratio: Math.min(1.0, Math.max(0.08, overallCompletion / 100)),
      displayVal: `%${overallCompletion}`,
      icon: CheckCircle2,
    },
  ];

  const cefrPolygonPoints = cefrAxes
    .map((axis, i) => {
      const { x, y } = getCoordinates(i, cefrAxes.length, axis.ratio);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const handleJumpToUnit = () => {
    loadAndPlayUnit(activeStat.unitNum, activeStat.lastPositionMs, true);
    if (onNavigate) {
      onNavigate('player');
    }
  };

  return (
    <div className="bg-white border border-sand-200 rounded-3xl p-6 sm:p-8 shadow-soft space-y-6">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-sand-100">
        <div>
          <div className="flex items-center gap-2 text-ocean-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Radar className="w-4 h-4" />
            <span>{radarMode === 'units' ? dict.progress.radarTitle : dict.progress.cefrRadarTitle}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {radarMode === 'units'
              ? `${dict.progress.tenUnitsTotal} ${dict.progress.radarSubtitle}`
              : dict.progress.cefrRadarSubtitle}
          </h2>
        </div>

        {/* Top Controls: Mode Switcher & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Mode Switcher */}
          <div className="flex items-center bg-sand-100 p-1 rounded-2xl border border-sand-200 select-none">
            <button
              type="button"
              onClick={() => setRadarMode('units')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                radarMode === 'units'
                  ? 'bg-white text-ocean-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {dict.progress.radarTabUnits}
            </button>
            <button
              type="button"
              onClick={() => setRadarMode('cefr')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                radarMode === 'cefr'
                  ? 'bg-white text-ocean-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {dict.progress.radarTabCefr}
            </button>
          </div>

          {/* Legend pills */}
          {radarMode === 'units' ? (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-ocean-50 border border-ocean-200 rounded-full text-[11px] font-bold text-ocean-800 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-ocean-500" />
                <span>{dict.progress.radarLegendCompletion}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200 rounded-full text-[11px] font-bold text-teal-800 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span>{dict.progress.radarLegendListening}</span>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-ocean-50 border border-ocean-200 rounded-full text-[11px] font-bold text-ocean-800 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-ocean-600" />
              <span>{dict.progress.cefrRadarTitle}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Radar Chart + Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
        {/* Left: SVG Radar Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          <div className="w-full max-w-[340px] sm:max-w-[380px] aspect-square relative">
            <svg
              viewBox="0 0 320 320"
              className="w-full h-full overflow-visible select-none drop-shadow-xs"
            >
              <defs>
                <radialGradient id="radarBgGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F0F9FF" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
                </radialGradient>

                <linearGradient id="completionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.15" />
                </linearGradient>

                <linearGradient id="listeningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.1" />
                </linearGradient>

                <linearGradient id="cefrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.15" />
                </linearGradient>
              </defs>

              {/* Background circular glow */}
              <circle cx={cx} cy={cy} r={radius} fill="url(#radarBgGradient)" />

              {/* Concentric grid polygons */}
              {levels.map((lvl, index) => {
                const totalPoints = radarMode === 'units' ? totalUnits : cefrAxes.length;
                return (
                  <polygon
                    key={index}
                    points={getGridPolygonPoints(totalPoints, lvl)}
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="1"
                    strokeDasharray={lvl === 1.0 ? 'none' : '3 3'}
                  />
                );
              })}

              {/* Level % Labels along top axis */}
              <text x={cx + 4} y={cy - radius * 0.5 + 3} className="text-[9px] fill-slate-300 font-mono font-bold">50%</text>
              <text x={cx + 4} y={cy - radius + 3} className="text-[9px] fill-slate-400 font-mono font-bold">100%</text>

              {/* Axis rays radiating from center */}
              {radarMode === 'units'
                ? Array.from({ length: totalUnits }).map((_, i) => {
                    const { x, y } = getCoordinates(i, totalUnits, 1.0);
                    return (
                      <line
                        key={i}
                        x1={cx}
                        y1={cy}
                        x2={x}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeWidth="1"
                      />
                    );
                  })
                : cefrAxes.map((_, i) => {
                    const { x, y } = getCoordinates(i, cefrAxes.length, 1.0);
                    return (
                      <line
                        key={i}
                        x1={cx}
                        y1={cy}
                        x2={x}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeWidth="1"
                      />
                    );
                  })}

              {/* Data Polygons: 10-Unit Mode */}
              {radarMode === 'units' && (
                <>
                  {/* 1. Listening Ratio Polygon Layer */}
                  <polygon
                    points={listeningPolygonPoints}
                    fill="url(#listeningGrad)"
                    stroke="#0d9488"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    className="transition-all duration-500"
                  />

                  {/* 2. Completion Ratio Polygon Layer */}
                  <polygon
                    points={completionPolygonPoints}
                    fill="url(#completionGrad)"
                    stroke="#0284c7"
                    strokeWidth="2.5"
                    className="transition-all duration-500"
                  />

                  {/* Axis Label Buttons and Interactive Points */}
                  {unitStats.map((stat, i) => {
                    const labelCoord = getCoordinates(i, totalUnits, 1.22);
                    const pointCoord = getCoordinates(i, totalUnits, stat.completionRatio);
                    const isSelected = selectedUnit === stat.unitNum;

                    return (
                      <g
                        key={stat.unitNum}
                        className="cursor-pointer focus:outline-hidden"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedUnit(stat.unitNum)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedUnit(stat.unitNum);
                          }
                        }}
                      >
                        {/* Outer Axis Node Label */}
                        <circle
                          cx={labelCoord.x}
                          cy={labelCoord.y}
                          r="13"
                          className={`transition-all duration-200 ${
                            isSelected
                              ? 'fill-ocean-600 stroke-ocean-200 stroke-2'
                              : 'fill-sand-50 stroke-sand-300 hover:fill-sand-100'
                          }`}
                        />
                        <text
                          x={labelCoord.x}
                          y={labelCoord.y + 3.5}
                          textAnchor="middle"
                          className={`text-[10px] font-extrabold select-none ${
                            isSelected ? 'fill-white' : 'fill-slate-700'
                          }`}
                        >
                          {dict.progress.unitAxisShortPrefix}{stat.unitNum}
                        </text>

                        {/* Data Vertex Point */}
                        <circle
                          cx={pointCoord.x}
                          cy={pointCoord.y}
                          r={isSelected ? '5.5' : '3.5'}
                          className={`transition-all duration-300 ${
                            isSelected
                              ? 'fill-ocean-600 stroke-white stroke-2 shadow-soft animate-pulse'
                              : stat.isCompleted
                              ? 'fill-emerald-500 stroke-white stroke-1.5'
                              : stat.isInProgress
                              ? 'fill-ocean-500 stroke-white stroke-1.5'
                              : 'fill-slate-400 stroke-white stroke-1'
                          }`}
                        />
                      </g>
                    );
                  })}
                </>
              )}

              {/* Data Polygons: CEFR Mode */}
              {radarMode === 'cefr' && (
                <>
                  <polygon
                    points={cefrPolygonPoints}
                    fill="url(#cefrGrad)"
                    stroke="#0284c7"
                    strokeWidth="2.5"
                    className="transition-all duration-500"
                  />

                  {cefrAxes.map((axis, i) => {
                    const labelCoord = getCoordinates(i, cefrAxes.length, 1.25);
                    const pointCoord = getCoordinates(i, cefrAxes.length, axis.ratio);

                    return (
                      <g key={axis.id}>
                        {/* Axis label */}
                        <text
                          x={labelCoord.x}
                          y={labelCoord.y + (labelCoord.y > cy ? 8 : -4)}
                          textAnchor="middle"
                          className="text-[10px] font-extrabold fill-slate-700 select-none"
                        >
                          {axis.name}
                        </text>

                        {/* Data Point */}
                        <circle
                          cx={pointCoord.x}
                          cy={pointCoord.y}
                          r="4.5"
                          className="fill-ocean-600 stroke-white stroke-2 shadow-soft animate-pulse"
                        />
                      </g>
                    );
                  })}
                </>
              )}
            </svg>
          </div>

          <p className="text-[11px] text-slate-400 font-medium mt-2 flex items-center gap-1.5 select-none">
            <Info className="w-3.5 h-3.5 text-ocean-500" />
            <span>{dict.progress.radarHoverHint}</span>
          </p>
        </div>

        {/* Right: Selected Inspector / CEFR Competency Card */}
        <div className="lg:col-span-5 bg-sand-50/80 border border-sand-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
          {radarMode === 'units' ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {dict.progress.radarSelectedUnit}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {dict.progress.unitUnitPrefix} {activeStat.unitNum}
                  </h3>
                </div>

                {/* Status badge */}
                {activeStat.isCompleted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{dict.library.completedBadge}</span>
                  </span>
                ) : activeStat.isInProgress ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-xs font-bold border border-ocean-200 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-ocean-600" />
                    <span>{dict.library.inProgressBadge}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-200/80 text-slate-600 rounded-full text-xs font-bold border border-sand-300">
                    <Circle className="w-3 h-3 text-slate-400" />
                    <span>{dict.library.notStartedBadge}</span>
                  </span>
                )}
              </div>

              {/* Metrics breakdown bars */}
              <div className="space-y-3.5 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>{dict.progress.radarCompletionAxis}</span>
                    <strong className="text-slate-900 font-bold">
                      %{Math.round(activeStat.completionRatio * 100)}
                    </strong>
                  </div>
                  <div className="w-full h-2 bg-sand-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ocean-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(activeStat.completionRatio * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>{dict.progress.radarListeningAxis}</span>
                    <strong className="text-slate-900 font-bold">
                      {activeStat.totalMinutes} {dict.progress.minutesFormat}
                    </strong>
                  </div>
                  <div className="w-full h-2 bg-sand-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(activeStat.listeningRatio * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Mastery Evaluation Notice */}
              <div className="bg-white border border-sand-200 rounded-xl p-3.5 flex items-start gap-3 text-xs shadow-2xs">
                <TrendingUp className="w-4 h-4 text-ocean-600 shrink-0 mt-0.5" />
                <p className="text-slate-600 leading-relaxed font-medium">
                  {activeStat.isCompleted
                    ? `${dict.progress.masteryHigh}: ${dict.progress.masteryCompletedDesc}`
                    : activeStat.isInProgress
                    ? `${dict.progress.masteryMedium}: ${dict.progress.masteryInProgressPrefix} ${Math.round(activeStat.lastPositionMs / 60000)} ${dict.progress.minutesFormat} ${dict.progress.masteryInProgressSuffix}`
                    : `${dict.progress.masteryLow}: ${dict.progress.masteryNotStartedDesc}`}
                </p>
              </div>

              {/* Action button */}
              <button
                type="button"
                onClick={handleJumpToUnit}
                className="w-full py-2.5 px-4 bg-ocean-600 hover:bg-ocean-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-soft hover:shadow-hover flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {activeStat.isInProgress
                    ? dict.progress.resumeButton
                    : dict.progress.startListening}
                </span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ocean-700">
                    {dict.progress.levelA1Heading}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {dict.progress.cefrRadarTitle}
                  </h3>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-xs font-bold border border-ocean-200 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-ocean-600" />
                  <span>A1 CEFR</span>
                </span>
              </div>

              {/* 5 CEFR Axes Breakdown */}
              <div className="space-y-3 pt-2">
                {cefrAxes.map((axis) => {
                  const Icon = axis.icon;
                  const percent = Math.round(axis.ratio * 100);
                  return (
                    <div key={axis.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-ocean-600" />
                          <span>{axis.name}</span>
                        </span>
                        <span className="text-slate-900 font-mono">{axis.displayVal}</span>
                      </div>
                      <div className="w-full h-1.5 bg-sand-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-ocean-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CEFR Level Status Notice */}
              <div className="bg-white border border-sand-200 rounded-xl p-3.5 flex items-start gap-3 text-xs shadow-2xs">
                <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-slate-600 leading-relaxed font-medium">
                  {overallCompletion >= 100
                    ? dict.progress.badgeGraduateDesc
                    : overallCompletion >= 50
                    ? dict.progress.badgeHalfwayHeroDesc
                    : dict.progress.badgeFirstStepDesc}
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('studyDesk')}
                className="w-full py-2.5 px-4 bg-ocean-600 hover:bg-ocean-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-soft hover:shadow-hover flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{dict.studyDesk.startLesson}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
