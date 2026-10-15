/**
 * Eidos Language OS - Docked Volume Control
 * Compact, upward-opening volume slider popover with instant mute toggle.
 * Strictly Light Mode - Zero Hardcode - Premium Minimalist & WAI-ARIA Compliant.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';
import { useDictionary } from '../../../context/DictionaryContext';

export interface DockedVolumeControlProps {
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  disabled?: boolean;
  className?: string;
}

export const DockedVolumeControl: React.FC<DockedVolumeControlProps> = ({
  volume,
  isMuted,
  onSetVolume,
  onToggleMute,
  disabled = false,
  className = '',
}) => {
  const { dict } = useDictionary();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const effectiveVolume = isMuted ? 0 : volume;
  const volumePercent = Math.round(effectiveVolume * 100);

  // Close popover on outside click or Escape key
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

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      onSetVolume(val);
      if (isMuted && val > 0) {
        onToggleMute();
      }
    },
    [isMuted, onSetVolume, onToggleMute]
  );

  const VolumeIcon = isMuted || effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button: Min 44px touch target */}
      <button
        ref={triggerRef}
        id="docked-volume-button"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="docked-volume-popover"
        aria-label={dict.player.dock.volumeAriaLabel || dict.player.volume}
        title={isMuted ? dict.player.dock.unmute : `${dict.player.dock.volume}: ${volumePercent}%`}
        className={`min-w-[44px] min-h-[44px] p-2.5 rounded-xl border flex items-center justify-center transition-all active:scale-95 shadow-2xs focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
          isMuted
            ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
            : isOpen
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-sand-50/90 border-sand-200 text-slate-700 hover:bg-sand-100 hover:text-slate-900'
        }`}
      >
        <VolumeIcon className={`w-4 h-4 ${isMuted ? 'text-rose-600' : 'text-slate-700'}`} />
      </button>

      {/* Upward Opening Volume Popover */}
      {isOpen && (
        <div
          id="docked-volume-popover"
          role="dialog"
          aria-labelledby="docked-volume-button"
          className="absolute bottom-full mb-2.5 right-0 z-50 bg-white border border-sand-200 rounded-2xl p-3 shadow-soft-lg w-48 animate-slide-up focus:outline-hidden"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between border-b border-sand-100 pb-2 mb-2.5 select-none">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              {dict.player.dock.volume}
            </span>
            <span className="font-mono text-xs font-bold text-slate-700">
              {volumePercent}%
            </span>
          </div>

          {/* Volume Slider Control */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={isMuted ? dict.player.dock.unmute : dict.player.dock.mute}
                className="p-1.5 rounded-lg hover:bg-sand-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <VolumeIcon className="w-3.5 h-3.5" />
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={effectiveVolume}
                onChange={handleSliderChange}
                aria-label={dict.player.dock.volumeAriaLabel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={volumePercent}
                className="w-full h-1.5 bg-sand-200 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-400"
              />
            </div>

            {/* Quick Mute / Unmute Toggle Button */}
            <button
              type="button"
              onClick={onToggleMute}
              className={`w-full py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  : 'bg-sand-100 text-slate-700 hover:bg-sand-200/80'
              }`}
            >
              {isMuted ? dict.player.dock.unmute : dict.player.dock.mute}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
