/**
 * Eidos Language OS - Drive Breadcrumbs Navigation
 * Hierarchical path navigation trail for Google Drive folder taxonomy.
 * 360dp mobile-responsive with horizontal smooth scroll and touch targets.
 * STRICTLY LIGHT THEME & ZERO HARDCODE.
 */
import React, { useRef, useEffect } from 'react';
import { ChevronRight, ArrowUpLeft, HardDrive, Folder } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import type { DriveCrumb } from '../../types/drive';

export interface DriveBreadcrumbsProps {
  trail: DriveCrumb[];
  onNavigateToCrumb: (index: number) => void;
  onNavigateUp: () => void;
  isLoading?: boolean;
  className?: string;
}

export const DriveBreadcrumbs: React.FC<DriveBreadcrumbsProps> = ({
  trail,
  onNavigateToCrumb,
  onNavigateUp,
  isLoading = false,
  className = '',
}) => {
  const { dict } = useDictionary();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the end of the trail when new crumb added
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth',
      });
    }
  }, [trail.length]);

  const canNavigateUp = trail.length > 1;

  return (
    <nav
      aria-label={dict.googleDrive.explorerTitle}
      className={`flex items-center gap-1.5 p-1.5 sm:p-2 bg-sand-50/70 border border-sand-200/80 rounded-2xl shadow-2xs select-none ${className}`}
    >
      {/* Up/Back Navigation Button */}
      <button
        type="button"
        onClick={onNavigateUp}
        disabled={!canNavigateUp || isLoading}
        aria-label={dict.googleDrive.navigateUp}
        title={dict.googleDrive.navigateUp}
        className={`shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all border ${
          canNavigateUp && !isLoading
            ? 'bg-white hover:bg-ocean-50 text-ocean-700 border-sand-200 hover:border-ocean-300 shadow-2xs cursor-pointer active:scale-95'
            : 'bg-sand-100/50 text-slate-300 border-transparent cursor-not-allowed'
        }`}
      >
        <ArrowUpLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
      </button>

      {/* Breadcrumb Trail Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-1 min-w-0"
      >
        {trail.map((crumb, idx) => {
          const isLast = idx === trail.length - 1;
          const isRoot = idx === 0;

          return (
            <React.Fragment key={`${crumb.id}-${idx}`}>
              {idx > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 select-none" />
              )}
              <button
                type="button"
                onClick={() => onNavigateToCrumb(idx)}
                disabled={isLast || isLoading}
                aria-current={isLast ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 max-w-[160px] sm:max-w-[220px] ${
                  isLast
                    ? 'bg-white text-ocean-700 font-semibold border border-sand-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-transparent hover:border-sand-200 cursor-pointer active:scale-95'
                }`}
              >
                {isRoot ? (
                  <HardDrive className={`w-3.5 h-3.5 shrink-0 ${isLast ? 'text-ocean-600' : 'text-slate-400'}`} />
                ) : (
                  <Folder className={`w-3.5 h-3.5 shrink-0 ${isLast ? 'text-ocean-500 fill-ocean-100' : 'text-amber-500/80'}`} />
                )}
                <span className="truncate">{crumb.name}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
