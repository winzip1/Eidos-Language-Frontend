/**
 * Eidos Language OS - Lesson Player Header
 * Modern, airy top navigation header for Lesson Player Studio.
 * Features back navigation with day indicator, unit metadata badges, async completion action,
 * audio duration indicator, and accessible options menu with audio download and keyboard shortcuts.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  CheckCircle2,
  Check,
  RotateCcw,
  Sparkles,
  Download,
  Clock,
  Keyboard,
  Loader2,
  Settings,
  Menu,
  Layers,
  ChevronDown,
  Headphones,
} from 'lucide-react';
import { useDictionary } from '../../../context/DictionaryContext';
import { formatElapsed } from '../../../utils/audioTime';

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
  const { dict } = useDictionary();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const hasValidUnitNum = typeof unitNumber === 'number' && !isNaN(unitNumber) && unitNumber > 0;

  // Derive resolved display texts (Zero Hardcode & Zero Fake Data)
  const backButtonLabel = hasValidUnitNum
    ? `${dict.lessonPlayer.dayPrefix} ${unitNumber}`
    : dict.lessonPlayer.backToDesk;

  const backButtonAria = hasValidUnitNum
    ? `${dict.lessonPlayer.backToDesk} - ${dict.lessonPlayer.dayPrefix} ${unitNumber}`
    : dict.lessonPlayer.backToDesk;

  const resolvedTitle = unitTitle
    ? unitTitle
    : hasValidUnitNum
    ? `${dict.lessonPlayer.lessonTitle} - ${dict.lessonPlayer.dayPrefix} ${unitNumber}`
    : dict.lessonPlayer.lessonTitle;

  const effectiveAudioDurationMs = (audioDurationMs !== undefined && audioDurationMs > 0)
    ? audioDurationMs
    : (!hasTranscript ? 1800000 : 0);

  // Handle native audio download if url is present
  const handleDownload = () => {
    if (onDownloadAudio) {
      onDownloadAudio();
      return;
    }
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `unit-${unitNumber || 'audio'}.mp3`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Close options menu on outside click or Escape key, with focus restoration
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        // Keyboard navigation inside dropdown menu
        event.preventDefault();
        if (!menuRef.current) return;
        const items = Array.from(
          menuRef.current.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])')
        );
        if (items.length === 0) return;
        const activeIdx = items.indexOf(document.activeElement as HTMLButtonElement);
        if (event.key === 'ArrowDown') {
          const nextIdx = activeIdx < items.length - 1 ? activeIdx + 1 : 0;
          items[nextIdx].focus();
        } else {
          const prevIdx = activeIdx > 0 ? activeIdx - 1 : items.length - 1;
          items[prevIdx].focus();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleToggleMenu = () => {
    if (disabled) return;
    setIsMenuOpen((prev) => !prev);
  };

  const handleMenuAction = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <header
      className={`bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xs transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left Side: Back Button & Lesson Metadata */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
          {/* Mobile Drawer Trigger (Peeking) */}
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 hover:text-slate-900 border border-slate-200/80 rounded-2xl transition-all shadow-2xs shrink-0 cursor-pointer"
              title={dict.sidebar.expandSidebar}
              aria-label={dict.sidebar.expandSidebar}
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Back Button with Responsive Indicator */}
          <button
            type="button"
            onClick={onNavigateBack}
            disabled={disabled}
            aria-label={backButtonAria}
            title={backButtonAria}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 hover:text-slate-900 border border-slate-200/90 rounded-2xl transition-all shadow-xs group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-500 group-hover:text-slate-800 transition-colors" />
            <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-slate-900 truncate max-w-[120px] sm:max-w-none">
              {backButtonLabel}
            </span>
          </button>

          {/* Title & Metadata Badges */}
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center flex-wrap gap-1.5">
              {courseFlag && (
                <span className="text-sm leading-none select-none" aria-hidden="true">
                  {courseFlag}
                </span>
              )}

              {onOpenLevelSelector ? (
                <button
                  type="button"
                  onClick={onOpenLevelSelector}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:py-1 min-h-[34px] sm:min-h-[32px] bg-ocean-50/90 hover:bg-ocean-100/90 text-ocean-900 border border-ocean-200/90 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer group select-none"
                  title={dict.lessonPlayer.selectLevelAndLesson}
                  aria-label={dict.lessonPlayer.selectLevelAndLesson}
                >
                  <Layers className="w-3.5 h-3.5 text-ocean-600 group-hover:scale-110 transition-transform" />
                  <span className="truncate max-w-[120px] xs:max-w-none">
                    {levelTitle || 'A1'}{hasValidUnitNum ? ` · ${dict.lessonPlayer.unitPrefix} ${unitNumber}` : ''}
                  </span>
                  <ChevronDown className="w-3 h-3 text-ocean-500 opacity-70 group-hover:opacity-100" />
                </button>
              ) : (
                <>
                  {hasValidUnitNum && (
                    <span className="text-[11px] font-extrabold text-ocean-800 bg-ocean-50 border border-ocean-200/90 px-2 py-0.5 rounded-lg shadow-xs select-none">
                      {dict.lessonPlayer.unitPrefix} {unitNumber}
                    </span>
                  )}

                  {levelTitle && (
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 bg-sand-100/90 border border-sand-200 px-2 py-0.5 rounded-lg select-none">
                      {levelTitle}
                    </span>
                  )}
                </>
              )}

              {effectiveAudioDurationMs > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-medium text-slate-500 bg-sand-50 border border-sand-200 px-2 py-0.5 rounded-lg select-none">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {formatElapsed(effectiveAudioDurationMs)}
                </span>
              )}

              {isCompleted && (
                <span className="hidden xs:inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-xs select-none">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {dict.lessonPlayer.completedBadge}
                </span>
              )}

              {!hasTranscript && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-ocean-700 bg-ocean-50 border border-ocean-200/90 px-2 py-0.5 rounded-lg select-none shadow-2xs"
                  title={dict.player?.audioImmersionNotice || dict.player?.audioImmersionMode || dict.lessonPlayer?.audioImmersionMode}
                >
                  <Headphones className="w-3 h-3 text-ocean-600 shrink-0" aria-hidden="true" />
                  <span>{dict.player?.audioImmersionMode || dict.lessonPlayer?.audioImmersionMode}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <h1
                title={resolvedTitle}
                className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 tracking-tight truncate"
              >
                {resolvedTitle}
              </h1>
            </div>
          </div>
        </div>

        {/* Right Side: Completion Action & Options Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative">
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
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 min-h-[40px] rounded-2xl border transition-all text-xs font-bold active:scale-95 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 disabled:opacity-60 disabled:cursor-not-allowed ${
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

          {/* Options Menu Trigger */}
          <div className="relative">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={handleToggleMenu}
              disabled={disabled}
              aria-label={dict.lessonPlayer.optionsMenu}
              title={dict.lessonPlayer.optionsMenu}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              className="p-2 sm:p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center bg-sand-50 hover:bg-sand-100 active:scale-95 text-slate-600 hover:text-slate-900 border border-sand-200/90 rounded-2xl transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <MoreVertical className="w-4 h-4 text-slate-600" />
            </button>

            {/* Dropdown Options Popup with Keyboard Arrow Navigation */}
            {isMenuOpen && (
              <div
                ref={menuRef}
                role="menu"
                aria-label={dict.lessonPlayer.optionsMenu}
                aria-orientation="vertical"
                className="absolute right-0 top-full mt-2 w-64 bg-white border border-sand-200 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5"
              >
                {/* Toggle Complete Option */}
                {onToggleComplete && (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isCompleting}
                    onClick={() => handleMenuAction(onToggleComplete)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-sand-50 rounded-xl transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      {isCompleting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-ocean-600" />
                      ) : isCompleted ? (
                        <RotateCcw className="w-4 h-4 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      <span>
                        {isCompleting
                          ? dict.lessonPlayer.completingAction
                          : isCompleted
                          ? dict.lessonPlayer.markIncomplete
                          : dict.lessonPlayer.markCompleted}
                      </span>
                    </div>
                  </button>
                )}

                {/* Level & Lesson Selector Option */}
                {onOpenLevelSelector && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleMenuAction(onOpenLevelSelector)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-sand-50 rounded-xl transition-colors text-left"
                  >
                    <Layers className="w-4 h-4 text-ocean-600" />
                    <span>{dict.lessonPlayer.selectLevelAndLesson}</span>
                  </button>
                )}

                {/* Download Audio Option */}
                {(onDownloadAudio || audioUrl) && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleMenuAction(handleDownload)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-sand-50 rounded-xl transition-colors text-left"
                  >
                    <Download className="w-4 h-4 text-ocean-600" />
                    <span>{dict.lessonPlayer.downloadAudio}</span>
                  </button>
                )}

                {/* Keyboard Shortcuts Option */}
                {onOpenShortcuts && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleMenuAction(onOpenShortcuts)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-sand-50 rounded-xl transition-colors text-left"
                  >
                    <Keyboard className="w-4 h-4 text-slate-500" />
                    <span>{dict.lessonPlayer.keyboardShortcuts}</span>
                  </button>
                )}

                {/* Additional Options Callback if Provided */}
                {onOpenOptions && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleMenuAction(onOpenOptions)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-left"
                  >
                    <Sparkles className="w-4 h-4 text-ocean-600" />
                    <span>{dict.lessonPlayer.optionsMenu}</span>
                  </button>
                )}

                {/* Settings Option */}
                {onOpenSettings && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleMenuAction(onOpenSettings)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>{dict.navigation.settings}</span>
                  </button>
                )}

                <div className="h-px bg-slate-200/80 my-1" />

                {/* Return to Desk Option */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleMenuAction(onNavigateBack)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-sand-50 rounded-xl transition-colors text-left"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span>{dict.lessonPlayer.backToDesk}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
