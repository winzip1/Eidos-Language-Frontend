/**
 * Eidos Language OS - Dedicated Unit Workspace Loading Skeleton
 * Calm, light-mode pulsing skeleton matching Header, Audio Bar, Tabs, and Content Card.
 * Strictly Light Mode - Zero Fake Data - Linear / Stripe Simplicity.
 */
import React from 'react';

export const UnitStudySkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      data-testid="unit-study-skeleton"
      className={`animate-pulse space-y-4 max-w-5xl mx-auto ${className}`}
      aria-busy="true"
      aria-label="Yükleniyor..."
    >
      {/* 1. Header Skeleton */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="w-28 h-9 bg-slate-200 rounded-lg" />
          <div className="flex items-center gap-2">
            <div className="w-12 h-6 bg-slate-200 rounded-md" />
            <div className="w-16 h-6 bg-slate-200 rounded-md" />
            <div className="w-20 h-6 bg-slate-200 rounded-md" />
          </div>
        </div>
        <div className="space-y-1.5 pt-1">
          <div className="w-48 h-6 bg-slate-200 rounded-md" />
          <div className="w-72 h-4 bg-slate-100 rounded-md" />
        </div>
      </div>

      {/* 2. Audio Bar Skeleton */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="w-24 h-4 bg-slate-200 rounded-full" />
          <div className="w-28 h-7 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-slate-200 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="w-full h-2 bg-slate-200 rounded-lg" />
            <div className="flex justify-between">
              <div className="w-10 h-3 bg-slate-100 rounded" />
              <div className="w-10 h-3 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section Tabs Skeleton */}
      <div className="flex items-center gap-2 overflow-hidden py-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-32 h-11 bg-slate-200 rounded-xl shrink-0" />
        ))}
      </div>

      {/* 4. Content Area Skeleton */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="w-44 h-5 bg-slate-200 rounded-md" />
        <div className="w-full h-4 bg-slate-100 rounded-md" />
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between">
                <div className="w-24 h-4 bg-slate-200 rounded" />
                <div className="w-16 h-4 bg-slate-200 rounded" />
              </div>
              <div className="w-3/4 h-5 bg-slate-200 rounded" />
              <div className="w-1/2 h-4 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
