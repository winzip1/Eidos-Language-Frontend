/**
 * Eidos Language OS - Lesson Player Header
 * Modern, airy top navigation header for Lesson Player Studio.
 * Ultra-responsive two-tier toolbar architecture preventing button collisions on 360dp mobile screens.
 * Orchestrates modular subcomponents: HeaderNavBack, HeaderLevelBadge, HeaderActions, HeaderLessonInfo.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React from 'react';
import {
  HeaderNavBack,
  HeaderLevelBadge,
  HeaderActions,
  HeaderLessonInfo,
} from '../header';

export interface LessonPlayerHeaderProps {
  unitNumber: number | null;
  unitTitle?: string;
  courseFlag?: string;
  levelTitle?: string;
  isCompleted?: boolean;
  isCompleting?: boolean;
  disabled?: boolean;
  hasTranscript?: boolean;
  audioDurationMs?: number;
  audioUrl?: string;
  onNavigateBack: () => void;
  onToggleComplete?: () => void;
  onDownloadAudio?: () => void;
  onOpenOptions?: () => void;
  onOpenShortcuts?: () => void;
  onOpenSettings?: () => void;
  onToggleMobileMenu?: () => void;
  onOpenLevelSelector?: () => void;
  className?: string;
}

export const LessonPlayerHeader: React.FC<LessonPlayerHeaderProps> = ({
  unitNumber,
  unitTitle,
  courseFlag,
  levelTitle,
  isCompleted = false,
  isCompleting = false,
  disabled = false,
  hasTranscript = true,
  audioDurationMs,
  audioUrl,
  onNavigateBack,
  onToggleComplete,
  onDownloadAudio,
  onOpenOptions,
  onOpenShortcuts,
  onOpenSettings,
  onToggleMobileMenu,
  onOpenLevelSelector,
  className = '',
}) => {
  return (
    <header
      className={`relative z-30 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl sm:rounded-3xl p-2 sm:p-4 shadow-xs transition-all duration-200 ${className}`}
    >
      {/* Tier 1: Primary Toolbar (Navigation, Level Selector & Action Buttons) */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-4 min-w-0">
        {/* Left Side: Back Navigation & Level Selection */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          <HeaderNavBack
            unitNumber={unitNumber}
            disabled={disabled}
            onNavigateBack={onNavigateBack}
            onToggleMobileMenu={onToggleMobileMenu}
          />

          <HeaderLevelBadge
            unitNumber={unitNumber}
            levelTitle={levelTitle}
            courseFlag={courseFlag}
            onOpenLevelSelector={onOpenLevelSelector}
          />
        </div>

        {/* Right Side: Offline Download, Complete Toggle & Options Menu */}
        <HeaderActions
          unitNumber={unitNumber}
          isCompleted={isCompleted}
          isCompleting={isCompleting}
          disabled={disabled}
          audioUrl={audioUrl}
          onToggleComplete={onToggleComplete}
          onDownloadAudio={onDownloadAudio}
          onOpenOptions={onOpenOptions}
          onOpenShortcuts={onOpenShortcuts}
          onOpenSettings={onOpenSettings}
          onOpenLevelSelector={onOpenLevelSelector}
          onNavigateBack={onNavigateBack}
        />
      </div>

      {/* Tier 2: Dedicated Lesson Title & Metadata Strip (Never crushed or overlapped) */}
      <HeaderLessonInfo
        unitNumber={unitNumber}
        unitTitle={unitTitle}
        hasTranscript={hasTranscript}
        audioDurationMs={audioDurationMs}
        isCompleted={isCompleted}
      />
    </header>
  );
};
