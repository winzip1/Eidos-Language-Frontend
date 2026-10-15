/**
 * Eidos Language OS - Lesson Segmented Control
 * Modern, airy two-tab segmented switcher ("🎧 Dinleme" / "📖 Okuma").
 * Features smooth sliding pill indicator, responsive touch targets, count badges,
 * disabled tab support, and full ARIA keyboard accessibility.
 * Strictly Light Mode - Zero Hardcode.
 */
import React, { useRef } from 'react';
import { useDictionary } from '../../../context/DictionaryContext';

export type LessonTabMode = 'listening' | 'reading';

export interface LessonSegmentedControlProps {
  activeTab: LessonTabMode;
  onChangeTab: (tab: LessonTabMode) => void;
  disabled?: boolean;
  disabledTabs?: LessonTabMode[];
  readingCount?: number;
  hasTranscript?: boolean;
  className?: string;
}

export const LessonSegmentedControl: React.FC<LessonSegmentedControlProps> = ({
  activeTab,
  onChangeTab,
  disabled = false,
  disabledTabs = [],
  readingCount,
  hasTranscript = true,
  className = '',
}) => {
  const { dict } = useDictionary();
  const listeningTabRef = useRef<HTMLButtonElement>(null);
  const readingTabRef = useRef<HTMLButtonElement>(null);

  const isListeningDisabled = disabled || disabledTabs.includes('listening');
  const isReadingDisabled = disabled || disabledTabs.includes('reading');

  const handleSelectTab = (tab: LessonTabMode) => {
    if (disabled || disabledTabs.includes(tab)) return;
    if (tab !== activeTab) {
      onChangeTab(tab);
    }
  };

  // WAI-ARIA Keyboard Navigation for tablist: ArrowLeft, ArrowRight, Home, End
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentTab: LessonTabMode) => {
    if (disabled) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const targetTab: LessonTabMode = currentTab === 'listening' ? 'reading' : 'listening';
      const isTargetDisabled = targetTab === 'listening' ? isListeningDisabled : isReadingDisabled;

      if (!isTargetDisabled) {
        handleSelectTab(targetTab);
        if (targetTab === 'listening') {
          listeningTabRef.current?.focus();
        } else {
          readingTabRef.current?.focus();
        }
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (!isListeningDisabled) {
        handleSelectTab('listening');
        listeningTabRef.current?.focus();
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      if (!isReadingDisabled) {
        handleSelectTab('reading');
        readingTabRef.current?.focus();
      }
    }
  };

  const listeningLabel = dict.player?.tabs?.listeningTab || dict.lessonPlayer.listeningTab;
  const readingLabel = dict.player?.tabs?.readingTab || dict.lessonPlayer.readingTab;

  return (
    <div
      role="tablist"
      aria-label={dict.player?.tabs?.readingTitle || dict.lessonPlayer.lessonTitle}
      aria-orientation="horizontal"
      aria-disabled={disabled ? 'true' : undefined}
      className={`relative flex items-center bg-sand-100/90 p-1 rounded-2xl border border-sand-200/80 shadow-xs select-none min-h-[44px] ${
        disabled ? 'opacity-70 pointer-events-none' : ''
      } ${className}`}
    >
      {/* Sliding Active Pill Indicator */}
      <div
        aria-hidden="true"
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-white border border-sand-200/70 shadow-sm transition-transform duration-250 ease-out pointer-events-none ${
          disabled ? 'opacity-50' : ''
        } ${
          activeTab === 'listening'
            ? 'left-1 translate-x-0'
            : 'left-1 translate-x-full'
        }`}
      />

      {/* Listening Tab ("🎧 Dinleme") */}
      <button
        ref={listeningTabRef}
        type="button"
        role="tab"
        id="lesson-tab-listening"
        aria-controls="lesson-panel-listening"
        aria-selected={activeTab === 'listening'}
        aria-disabled={isListeningDisabled ? 'true' : undefined}
        tabIndex={activeTab === 'listening' && !isListeningDisabled ? 0 : -1}
        disabled={isListeningDisabled}
        onClick={() => handleSelectTab('listening')}
        onKeyDown={(e) => handleKeyDown(e, 'listening')}
        className={`relative z-10 flex-1 min-h-[38px] py-2 sm:py-2.5 px-3 text-center text-xs sm:text-sm font-semibold rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 cursor-pointer ${
          isListeningDisabled
            ? 'opacity-40 cursor-not-allowed'
            : activeTab === 'listening'
            ? 'text-slate-900 font-bold'
            : 'text-slate-500 hover:text-slate-800 font-medium'
        }`}
      >
        <span className="truncate">{listeningLabel}</span>
      </button>

      {/* Reading Tab ("📖 Okuma") */}
      <button
        ref={readingTabRef}
        type="button"
        role="tab"
        id="lesson-tab-reading"
        aria-controls="lesson-panel-reading"
        aria-selected={activeTab === 'reading'}
        aria-disabled={isReadingDisabled ? 'true' : undefined}
        tabIndex={activeTab === 'reading' && !isReadingDisabled ? 0 : -1}
        disabled={isReadingDisabled}
        onClick={() => handleSelectTab('reading')}
        onKeyDown={(e) => handleKeyDown(e, 'reading')}
        className={`relative z-10 flex-1 min-h-[38px] py-2 sm:py-2.5 px-3 inline-flex items-center justify-center gap-1.5 text-center text-xs sm:text-sm font-semibold rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 cursor-pointer ${
          isReadingDisabled
            ? 'opacity-40 cursor-not-allowed'
            : activeTab === 'reading'
            ? 'text-slate-900 font-bold'
            : 'text-slate-500 hover:text-slate-800 font-medium'
        }`}
      >
        <span className="truncate">{readingLabel}</span>
        {!hasTranscript ? (
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold leading-none tracking-tight transition-colors ${
              activeTab === 'reading'
                ? 'bg-amber-100 text-amber-900 border border-amber-200/80'
                : 'bg-sand-200/80 text-slate-500'
            }`}
            title={dict.player?.audioOnlyFocusTitle || dict.studyDesk?.transcriptPendingBadge || 'Transkript Hazırlanıyor'}
          >
            ⏳
          </span>
        ) : typeof readingCount === 'number' && readingCount > 0 ? (
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold leading-none tracking-tight transition-colors ${
              activeTab === 'reading'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-sand-200/80 text-slate-600'
            }`}
          >
            {readingCount}
          </span>
        ) : null}
      </button>
    </div>
  );
};
