/**
 * Eidos Language OS - Docked Speed Selector
 * Compact, upward-opening playback speed menu driven dynamically by remoteConfig.
 * Strictly Light Mode - Zero Hardcode - Premium Minimalist Design & WAI-ARIA Compliant.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Gauge, Check } from 'lucide-react';
import { useDictionary } from '../../../context/DictionaryContext';

export interface DockedSpeedSelectorProps {
  speed: number;
  onSetSpeed: (speed: number) => void;
  disabled?: boolean;
  className?: string;
}

export const DockedSpeedSelector: React.FC<DockedSpeedSelectorProps> = ({
  speed,
  onSetSpeed,
  disabled = false,
  className = '',
}) => {
  const { dict, remoteConfig } = useDictionary();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const availableSpeeds = remoteConfig.playbackSpeeds || [0.75, 1.0, 1.25, 1.5, 2.0];

  // Close popup on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Keyboard navigation within the open speed menu
  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = availableSpeeds.indexOf(speed);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % availableSpeeds.length;
        onSetSpeed(availableSpeeds[nextIndex]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + availableSpeeds.length) % availableSpeeds.length;
        onSetSpeed(availableSpeeds[prevIndex]);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    },
    [availableSpeeds, speed, onSetSpeed]
  );

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button: Min 44px touch target */}
      <button
        ref={triggerRef}
        id="docked-speed-button"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="docked-speed-listbox"
        aria-label={dict.player.dock.speedAriaLabel || dict.lessonPlayer.speedSelectAriaLabel}
        title={dict.player.dock.speedSelect || dict.lessonPlayer.playbackSpeedTitle}
        className={`min-h-[44px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
          isOpen
            ? 'bg-amber-50 border-amber-200 text-amber-800 font-bold'
            : 'bg-sand-50/90 border-sand-200 text-slate-700 hover:bg-sand-100 hover:text-slate-900'
        }`}
      >
        <Gauge className="w-3.5 h-3.5 text-amber-600" />
        <span className="hidden sm:inline text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {dict.lessonPlayer.speedLabel}
        </span>
        <span className="font-mono font-bold">{speed}x</span>
      </button>

      {/* Upward Opening Popover Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          id="docked-speed-listbox"
          role="listbox"
          aria-labelledby="docked-speed-button"
          onKeyDown={handleMenuKeyDown}
          tabIndex={-1}
          className="absolute bottom-full mb-2.5 left-0 z-50 bg-white border border-sand-200 rounded-2xl p-1.5 shadow-soft-lg min-w-[130px] animate-slide-up focus:outline-hidden"
        >
          {/* Header */}
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-sand-100 mb-1 select-none">
            {dict.player.dock.speedSelect || dict.lessonPlayer.playbackSpeedTitle}
          </div>

          {/* Speed Options List */}
          <div className="flex flex-col gap-0.5">
            {availableSpeeds.map((rate) => {
              const isSelected = speed === rate;
              return (
                <button
                  key={rate}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSetSpeed(rate);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`px-2.5 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-orange-50 text-orange-800 font-bold'
                      : 'text-slate-600 hover:bg-sand-50 hover:text-slate-900'
                  }`}
                >
                  <span className="font-mono">{rate}x</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-orange-600 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
