/**
 * Eidos Language OS - Keyboard Shortcuts Modal
 * Clean, accessible dialog explaining global player shortcuts.
 * WAI-ARIA dialog compliant with Escape listener, body scroll lock, and focus management.
 * Strictly Light Mode - Zero Hardcode - Soft Yacht-Deck Styling.
 */
import React, { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { dict } = useDictionary();

  // Close on Escape key & Lock background scroll
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-soft-lg border border-sand-200 space-y-4 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-sand-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-ocean-50 border border-ocean-200/80 flex items-center justify-center text-ocean-700 shadow-2xs">
              <Keyboard className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3
                id="shortcuts-dialog-title"
                className="text-base font-bold text-slate-800 tracking-tight"
              >
                {dict.player?.dock?.shortcutsModalTitle || dict.lessonPlayer.keyboardShortcuts}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {dict.player?.dock?.shortcutsHint || dict.player.shortcutsHint}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.buttons.close}
            className="p-1.5 hover:bg-sand-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-2.5 text-xs text-slate-600">
          {/* Play / Pause */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-sand-50/80 border border-sand-100">
            <span className="font-medium text-slate-700">
              {dict.lessonPlayer.playAction} / {dict.lessonPlayer.pauseAction}
            </span>
            <kbd className="px-2.5 py-1 bg-white border border-sand-200 rounded-lg font-mono font-bold text-slate-700 shadow-2xs">
              Space
            </kbd>
          </div>

          {/* Rewind / Forward 10s */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-sand-50/80 border border-sand-100">
            <span className="font-medium text-slate-700">
              {dict.player?.dock?.seekBackward10s || dict.lessonPlayer.rewind10s} / {dict.player?.dock?.seekForward10s || dict.lessonPlayer.forward10s}
            </span>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-white border border-sand-200 rounded-lg font-mono font-bold text-slate-700 shadow-2xs">
                ←
              </kbd>
              <kbd className="px-2 py-1 bg-white border border-sand-200 rounded-lg font-mono font-bold text-slate-700 shadow-2xs">
                →
              </kbd>
            </div>
          </div>

          {/* Loop Segment */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-sand-50/80 border border-sand-100">
            <span className="font-medium text-slate-700">
              {dict.player?.dock?.loopAB || dict.player.loopMode}
            </span>
            <kbd className="px-2.5 py-1 bg-white border border-sand-200 rounded-lg font-mono font-bold text-slate-700 shadow-2xs">
              L
            </kbd>
          </div>

          {/* Translation Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-sand-50/80 border border-sand-100">
            <span className="font-medium text-slate-700">
              {dict.player?.dock?.toggleTranslation || dict.player.translationToggle}
            </span>
            <kbd className="px-2.5 py-1 bg-white border border-sand-200 rounded-lg font-mono font-bold text-slate-700 shadow-2xs">
              T
            </kbd>
          </div>

          {/* Mute / Unmute */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-sand-50/80 border border-sand-100">
            <span className="font-medium text-slate-700">
              {dict.player?.dock?.mute || dict.player.mute} / {dict.player?.dock?.unmute || dict.player.unmute}
            </span>
            <kbd className="px-2.5 py-1 bg-white border border-sand-200 rounded-lg font-mono font-bold text-slate-700 shadow-2xs">
              M
            </kbd>
          </div>

          {/* Speed Cycle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-sand-50/80 border border-sand-100">
            <span className="font-medium text-slate-700">
              {dict.player?.dock?.speedSelect || dict.lessonPlayer.speedLabel}
            </span>
            <kbd className="px-2.5 py-1 bg-white border border-sand-200 rounded-lg font-mono font-bold text-slate-700 shadow-2xs">
              S
            </kbd>
          </div>

          {/* Close Modal */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-sand-50/80 border border-sand-100">
            <span className="font-medium text-slate-700">{dict.buttons.close}</span>
            <kbd className="px-2.5 py-1 bg-white border border-sand-200 rounded-lg font-mono font-bold text-slate-700 shadow-2xs">
              Esc
            </kbd>
          </div>
        </div>

        {/* Modal Footer Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-sand-100 hover:bg-sand-200 active:scale-98 text-slate-700 font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
          >
            {dict.buttons.close}
          </button>
        </div>
      </div>
    </div>
  );
};
