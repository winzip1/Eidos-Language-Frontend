import React from 'react';
import { BookOpen } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  icon,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-10 text-center bg-white border border-sand-200/80 rounded-2xl shadow-soft my-6 max-w-lg mx-auto transition-all ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-sand-50 flex items-center justify-center text-slate-400 mb-4 border border-sand-200/60 shadow-2xs">
        {icon || <BookOpen className="w-7 h-7 text-ocean-600" />}
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1.5 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      
      {(actionText || secondaryActionText) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {actionText && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-4 py-2 text-xs font-semibold text-ocean-700 bg-ocean-50/90 border border-ocean-200/90 rounded-xl hover:bg-ocean-100 hover:border-ocean-300 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ocean-500/20 transition-all shadow-2xs cursor-pointer select-none"
            >
              {actionText}
            </button>
          )}
          {secondaryActionText && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-sand-50 border border-sand-200 rounded-xl hover:bg-sand-100 hover:text-slate-800 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-sand-400/20 transition-all shadow-2xs cursor-pointer select-none"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
