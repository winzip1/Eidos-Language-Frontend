import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string;
  closeButtonLabel?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidthClass = 'max-w-lg',
  closeButtonLabel,
}) => {
  const { dict } = useDictionary();
  const contentRef = useRef<HTMLDivElement>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  const resolvedCloseLabel = closeButtonLabel || dict?.buttons?.close || 'Kapat';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Accidental backdrop click shield:
  // Dismisses ONLY if both mousedown AND mouseup occurred on the backdrop itself (prevents closing on text drag)
  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseDownTargetRef.current = e.target;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && mouseDownTargetRef.current === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/35 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={contentRef}
        className={`bg-white w-full ${maxWidthClass} max-h-[92vh] sm:max-h-[86vh] flex flex-col rounded-3xl border border-sand-200 shadow-soft-lg overflow-hidden animate-slide-up`}
      >
        {/* Sticky Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-sand-100 bg-sand-50/60">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            {icon && (
              <div className="w-8 h-8 rounded-xl bg-ocean-50 text-ocean-600 flex items-center justify-center border border-ocean-200/60 shadow-2xs shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 id="modal-title" className="text-base font-bold text-slate-800 tracking-tight truncate">
                {title}
              </h3>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={resolvedCloseLabel}
            title={resolvedCloseLabel}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-sand-200/60 active:scale-95 transition-all cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
