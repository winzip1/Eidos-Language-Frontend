/**
 * Eidos Language OS - Drill Fragment Badge Component
 * High-craftsmanship, minimalist yacht-deck style badge for syllable & back-chaining drill fragments.
 * Strictly Light Mode - Zero Hardcode - Full ARIA Accessibility.
 */
import React from 'react';
import type { FragmentRole } from '../../../types';
import { getFragmentRoleLabel } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';

export interface DrillFragmentBadgeProps {
  targetPhrase?: string;
  fragmentRole?: FragmentRole;
  size?: 'sm' | 'md';
  showRole?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export const DrillFragmentBadge: React.FC<DrillFragmentBadgeProps> = ({
  targetPhrase,
  fragmentRole,
  size = 'sm',
  showRole = true,
  onClick,
  className = '',
}) => {
  const { dict } = useDictionary();

  const roleLabel = fragmentRole ? getFragmentRoleLabel(fragmentRole, dict.player) : null;
  const drillLabel = dict.lessonPlayer.drillFragmentLabel;

  const sizeClasses =
    size === 'md'
      ? 'px-2.5 py-1 text-xs gap-1.5'
      : 'px-2 py-0.5 text-[11px] gap-1';

  const interactiveClasses = onClick
    ? 'cursor-pointer hover:bg-indigo-100/90 hover:border-indigo-300 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40'
    : '';

  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e as unknown as React.MouseEvent);
              }
            }
          : undefined
      }
      className={`inline-flex items-center font-semibold rounded-lg border transition-all select-none shadow-2xs bg-indigo-50/90 text-indigo-700 border-indigo-200/80 ${sizeClasses} ${interactiveClasses} ${className}`}
      title={
        targetPhrase
          ? dict.lessonPlayer.partOfTargetPhrase.replace('{target}', targetPhrase)
          : drillLabel
      }
    >
      <span className="text-[12px] leading-none shrink-0" aria-hidden="true">
        🧩
      </span>
      <span className="font-bold tracking-tight">{drillLabel}</span>
      {targetPhrase && (
        <span className="font-semibold text-indigo-900 ml-0.5 tracking-tight truncate max-w-[140px] sm:max-w-[200px]">
          · «{targetPhrase}»
        </span>
      )}
      {showRole && roleLabel && (
        <span className="font-medium text-indigo-700/80 text-[10px] hidden xs:inline ml-0.5 px-1.5 py-0.5 bg-white/80 rounded border border-indigo-100/90">
          ({roleLabel})
        </span>
      )}
    </span>
  );
};
