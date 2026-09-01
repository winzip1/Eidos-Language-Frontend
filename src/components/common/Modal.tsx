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

  const resolvedCloseLabel = closeButtonLabel || dict?.buttons?.close || 'Close';

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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={contentRef}
        className={`bg-white w-full ${maxWidthClass} rounded-2xl border border-sand-200 shadow-soft-lg overflow-hidden animate-slide-up`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand-100 bg-sand-50/50">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-8 h-8 rounded-xl bg-ocean-50 text-ocean-600 flex items-center justify-center border border-ocean-200/60 shadow-2xs">
                {icon}
              </div>
            )}
            <div>
              <h3 id="modal-title" className="text-base font-semibold text-slate-800 tracking-tight">
                {title}
              </h3>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={resolvedCloseLabel}
            title={resolvedCloseLabel}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-sand-100 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
