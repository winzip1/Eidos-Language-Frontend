/**
 * Eidos Language OS - Header Options Dropdown Menu
 * Accessible popup menu housing secondary actions (audio download, shortcuts, level selector, settings).
 * Strictly Light Mode - Zero Hardcode - Full Keyboard & ARIA Support.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  RotateCcw,
  CheckCircle2,
  Download,
  Keyboard,
  Sparkles,
  Settings,
  ArrowLeft,
  Layers,
  Loader2,
} from 'lucide-react';
import { useDictionary } from '../../../context/DictionaryContext';

export interface HeaderOptionsMenuProps {
  disabled?: boolean;
  unitNumber: number | null;
  isCompleted?: boolean;
  isCompleting?: boolean;
  audioUrl?: string;
  onToggleComplete?: () => void;
  onOpenLevelSelector?: () => void;
  onDownloadAudio?: () => void;
  onOpenShortcuts?: () => void;
  onOpenOptions?: () => void;
  onOpenSettings?: () => void;
  onNavigateBack: () => void;
}

export const HeaderOptionsMenu: React.FC<HeaderOptionsMenuProps> = ({
  disabled = false,
  unitNumber,
  isCompleted = false,
  isCompleting = false,
  audioUrl,
  onToggleComplete,
  onOpenLevelSelector,
  onDownloadAudio,
  onOpenShortcuts,
  onOpenOptions,
  onOpenSettings,
  onNavigateBack,
}) => {
  const { dict } = useDictionary();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close menu on click outside or Escape key, with focus restoration
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

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
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

  const handleDownload = () => {
    if (onDownloadAudio) {
      handleMenuAction(onDownloadAudio);
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
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={menuButtonRef}
        type="button"
        onClick={handleToggleMenu}
        disabled={disabled}
        aria-label={dict.lessonPlayer.optionsMenu}
        title={dict.lessonPlayer.optionsMenu}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        className="p-2 sm:p-2.5 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center bg-sand-50 hover:bg-sand-100 active:scale-95 text-slate-600 hover:text-slate-900 border border-sand-200/90 rounded-xl sm:rounded-2xl transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <MoreVertical className="w-4 h-4 text-slate-600" />
      </button>

      {/* Dropdown Options Popup */}
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
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-sand-50 rounded-xl transition-colors text-left disabled:opacity-50 cursor-pointer"
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
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-sand-50 rounded-xl transition-colors text-left cursor-pointer"
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
              onClick={handleDownload}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-sand-50 rounded-xl transition-colors text-left cursor-pointer"
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
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-sand-50 rounded-xl transition-colors text-left cursor-pointer"
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
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
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
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
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
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-sand-50 rounded-xl transition-colors text-left cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>{dict.lessonPlayer.backToDesk}</span>
          </button>
        </div>
      )}
    </div>
  );
};
