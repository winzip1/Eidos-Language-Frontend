/**
 * Eidos Language OS - Header Navigation & Back Controls
 * Modular subcomponent handling mobile drawer trigger and back button.
 * Strictly Light Mode - Zero Hardcode - Touch Ergonomic (min 40px touch target).
 */
import React from 'react';
import { ArrowLeft, Menu } from 'lucide-react';
import { useDictionary } from '../../../context/DictionaryContext';

export interface HeaderNavBackProps {
  unitNumber: number | null;
  disabled?: boolean;
  onNavigateBack: () => void;
  onToggleMobileMenu?: () => void;
}

export const HeaderNavBack: React.FC<HeaderNavBackProps> = ({
  unitNumber,
  disabled = false,
  onNavigateBack,
  onToggleMobileMenu,
}) => {
  const { dict } = useDictionary();

  const hasValidUnitNum = typeof unitNumber === 'number' && !isNaN(unitNumber) && unitNumber > 0;

  const backButtonLabel = hasValidUnitNum
    ? `${dict.lessonPlayer.dayPrefix} ${unitNumber}`
    : dict.lessonPlayer.backToDesk;

  const backButtonAria = hasValidUnitNum
    ? `${dict.lessonPlayer.backToDesk} - ${dict.lessonPlayer.dayPrefix} ${unitNumber}`
    : dict.lessonPlayer.backToDesk;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      {/* Mobile Drawer Trigger */}
      {onToggleMobileMenu && (
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 hover:text-slate-900 border border-slate-200/80 rounded-xl sm:rounded-2xl transition-all shadow-2xs shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/50"
          title={dict.sidebar?.expandSidebar || dict.lessonPlayer.optionsMenu}
          aria-label={dict.sidebar?.expandSidebar || dict.lessonPlayer.optionsMenu}
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
        className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 min-h-[36px] sm:min-h-[40px] bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 hover:text-slate-900 border border-slate-200/90 rounded-xl sm:rounded-2xl transition-all shadow-2xs group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-800 transition-colors shrink-0" />
        <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-slate-900 truncate max-w-[80px] xs:max-w-[110px] sm:max-w-none">
          {backButtonLabel}
        </span>
      </button>
    </div>
  );
};
