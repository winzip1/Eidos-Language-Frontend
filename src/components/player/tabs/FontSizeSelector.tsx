/**
 * Eidos Language OS - Reading Font Size Selector
 * Elegant, softly shadowed dropdown menu for choosing dynamic reading font sizes.
 * Persists user choice in localStorage ('eidos_player_font_size') and synchronizes across tabs.
 * Strictly Light Mode - Zero Hardcode - Full Keyboard & ARIA Accessibility (WAI-ARIA compliant).
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Type, ChevronDown, Check } from 'lucide-react';
import { useDictionary } from '../../../context/DictionaryContext';

export type ReadingFontSize = 'small' | 'normal' | 'large';

export const FONT_SIZE_STORAGE_KEY = 'eidos_player_font_size';

export function getStoredFontSize(): ReadingFontSize {
  try {
    const stored = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (stored === 'small' || stored === 'normal' || stored === 'large') {
      return stored;
    }
  } catch {
    // Fail-safe fallback if storage is restricted
  }
  return 'normal';
}

export function setStoredFontSize(size: ReadingFontSize): void {
  try {
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, size);
  } catch {
    // Fail-safe fallback if storage is restricted
  }
}

export interface FontSizeSelectorProps {
  fontSize: ReadingFontSize;
  onChangeFontSize: (size: ReadingFontSize) => void;
  className?: string;
  disabled?: boolean;
}

interface FontSizeOption {
  key: ReadingFontSize;
  labelKey: 'fontSizeSmall' | 'fontSizeNormal' | 'fontSizeLarge';
  previewClass: string;
}

const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { key: 'small', labelKey: 'fontSizeSmall', previewClass: 'text-xs' },
  { key: 'normal', labelKey: 'fontSizeNormal', previewClass: 'text-sm' },
  { key: 'large', labelKey: 'fontSizeLarge', previewClass: 'text-base' },
];

export const FontSizeSelector: React.FC<FontSizeSelectorProps> = ({
  fontSize,
  onChangeFontSize,
  className = '',
  disabled = false,
}) => {
  const { dict } = useDictionary();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Synchronize across browser tabs/windows via storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === FONT_SIZE_STORAGE_KEY && e.newValue) {
        if (e.newValue === 'small' || e.newValue === 'normal' || e.newValue === 'large') {
          onChangeFontSize(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [onChangeFontSize]);

  // Close dropdown on outside click or touch
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  // Focus active item when menu opens
  useEffect(() => {
    if (isOpen) {
      const activeIdx = FONT_SIZE_OPTIONS.findIndex((opt) => opt.key === fontSize);
      const targetBtn = optionRefs.current[activeIdx !== -1 ? activeIdx : 1];
      targetBtn?.focus();
    }
  }, [isOpen, fontSize]);

  // Roving keyboard navigation inside dropdown menu (ArrowDown, ArrowUp, Home, End, Escape, Tab)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (e.key === 'Tab') {
        // Close menu on tab away
        setIsOpen(false);
        return;
      }

      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      if (e.key === 'Home') {
        e.preventDefault();
        onChangeFontSize(FONT_SIZE_OPTIONS[0].key);
        optionRefs.current[0]?.focus();
        return;
      }

      if (e.key === 'End') {
        e.preventDefault();
        const lastIdx = FONT_SIZE_OPTIONS.length - 1;
        onChangeFontSize(FONT_SIZE_OPTIONS[lastIdx].key);
        optionRefs.current[lastIdx]?.focus();
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = FONT_SIZE_OPTIONS.findIndex((opt) => opt.key === fontSize);
        const nextIndex =
          e.key === 'ArrowDown'
            ? (currentIndex + 1) % FONT_SIZE_OPTIONS.length
            : (currentIndex - 1 + FONT_SIZE_OPTIONS.length) % FONT_SIZE_OPTIONS.length;
        onChangeFontSize(FONT_SIZE_OPTIONS[nextIndex].key);
        optionRefs.current[nextIndex]?.focus();
      }
    },
    [disabled, fontSize, isOpen, onChangeFontSize]
  );

  const handleSelect = (size: ReadingFontSize) => {
    onChangeFontSize(size);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const getOptionLabel = (labelKey: 'fontSizeSmall' | 'fontSizeNormal' | 'fontSizeLarge') => {
    return dict.player?.tabs?.[labelKey] || dict.lessonPlayer[labelKey];
  };

  const currentOption = FONT_SIZE_OPTIONS.find((opt) => opt.key === fontSize) || FONT_SIZE_OPTIONS[1];
  const currentLabel = getOptionLabel(currentOption.labelKey);
  const fontSizeMainLabel = dict.player?.tabs?.fontSizeLabel || dict.lessonPlayer.fontSizeLabel;

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${dict.lessonPlayer.fontSizeSelectAriaLabel}: ${currentLabel}`}
        title={`${fontSizeMainLabel} (${currentLabel})`}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-xl transition-all select-none border shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40 active:scale-95 cursor-pointer ${
          isOpen
            ? 'bg-ocean-50/90 text-ocean-900 border-ocean-300 ring-2 ring-ocean-500/20'
            : 'bg-white text-slate-700 border-sand-200/90 hover:bg-sand-50/80 hover:border-sand-300 hover:text-slate-900'
        } disabled:opacity-40 disabled:pointer-events-none`}
      >
        <Type className="w-3.5 h-3.5 text-ocean-600 shrink-0" aria-hidden="true" />
        <span className="font-medium text-[11px] sm:text-xs text-slate-700 truncate max-w-[80px] sm:max-w-none">
          {currentLabel}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-ocean-600' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label={fontSizeMainLabel}
          className="absolute right-0 top-full mt-1.5 z-30 min-w-[155px] sm:min-w-[170px] bg-white rounded-2xl border border-sand-200/90 shadow-soft-lg p-1.5 animate-slide-up focus:outline-none"
        >
          {/* Menu Title Header */}
          <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {fontSizeMainLabel}
          </div>

          <div className="space-y-0.5 mt-0.5">
            {FONT_SIZE_OPTIONS.map((opt, idx) => {
              const isSelected = opt.key === fontSize;
              const label = getOptionLabel(opt.labelKey);

              return (
                <button
                  key={opt.key}
                  ref={(el) => {
                    optionRefs.current[idx] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.key)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2.5 min-h-[40px] rounded-xl text-xs transition-all cursor-pointer select-none text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 ${
                    isSelected
                      ? 'bg-amber-50 font-bold text-amber-900 shadow-2xs ring-1 ring-amber-300/50'
                      : 'text-slate-700 font-medium hover:bg-sand-50 hover:text-slate-900 focus:bg-sand-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center font-bold font-serif shrink-0 border ${
                        isSelected
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-sand-100/70 text-slate-500 border-sand-200/80'
                      } ${opt.previewClass}`}
                    >
                      A
                    </span>
                    <span className="truncate">{label}</span>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
