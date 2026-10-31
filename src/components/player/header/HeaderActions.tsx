/**
 * Eidos Language OS - Header Actions Group
 * Modular subcomponent grouping offline audio caching, lesson completion, and options dropdown.
 * Strictly Light Mode - Zero Hardcode - Ultra-Responsive (360dp optimized).
 */
import React from 'react';
import { CheckCircle2, Check, Loader2 } from 'lucide-react';
import { useDictionary } from '../../../context/DictionaryContext';
import { OfflineDownloadIndicator } from '../OfflineDownloadIndicator';
import { HeaderOptionsMenu } from './HeaderOptionsMenu';

export interface HeaderActionsProps {
  unitNumber: number | null;
  isCompleted?: boolean;
  isCompleting?: boolean;
  disabled?: boolean;
  audioUrl?: string;
  onToggleComplete?: () => void;
  onDownloadAudio?: () => void;
  onOpenOptions?: () => void;
  onOpenShortcuts?: () => void;
  onOpenSettings?: () => void;
  onOpenLevelSelector?: () => void;
  onNavigateBack: () => void;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({
  unitNumber,
  isCompleted = false,
  isCompleting = false,
  disabled = false,
  audioUrl,
  onToggleComplete,
  onDownloadAudio,
  onOpenOptions,
  onOpenShortcuts,
  onOpenSettings,
  onOpenLevelSelector,
  onNavigateBack,
}) => {
  const { dict } = useDictionary();

  return (
    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
      {/* Offline Audio Cache & Download Indicator (Compact on 360dp mobile) */}
      <OfflineDownloadIndicator compact={true} />

      {/* Direct Complete Toggle Button with Async Loading Protection */}
      {onToggleComplete && (
        <button
          type="button"
          onClick={onToggleComplete}
          disabled={disabled || isCompleting}
          aria-busy={isCompleting}
          aria-label={
            isCompleting
              ? dict.lessonPlayer.completingAction
              : isCompleted
              ? dict.lessonPlayer.markIncomplete
              : dict.lessonPlayer.markCompleted
          }
          title={
            isCompleting
              ? dict.lessonPlayer.completingAction
              : isCompleted
              ? dict.lessonPlayer.markIncomplete
              : dict.lessonPlayer.markCompleted
          }
          className={`inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl sm:rounded-2xl border transition-all text-xs font-bold active:scale-95 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
            isCompleted
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-white hover:bg-sand-50 text-slate-600 hover:text-slate-800 border-sand-200'
          }`}
        >
          {isCompleting ? (
            <Loader2 className="w-4 h-4 animate-spin text-ocean-600" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <Check className="w-4 h-4 text-slate-400" />
          )}
          <span className="hidden md:inline">
            {isCompleting
              ? dict.lessonPlayer.completingAction
              : isCompleted
              ? dict.lessonPlayer.completedBadge
              : dict.lessonPlayer.markCompleted}
          </span>
        </button>
      )}

      {/* Options Dropdown Menu */}
      <HeaderOptionsMenu
        disabled={disabled}
        unitNumber={unitNumber}
        isCompleted={isCompleted}
        isCompleting={isCompleting}
        audioUrl={audioUrl}
        onToggleComplete={onToggleComplete}
        onOpenLevelSelector={onOpenLevelSelector}
        onDownloadAudio={onDownloadAudio}
        onOpenShortcuts={onOpenShortcuts}
        onOpenOptions={onOpenOptions}
        onOpenSettings={onOpenSettings}
        onNavigateBack={onNavigateBack}
      />
    </div>
  );
};
