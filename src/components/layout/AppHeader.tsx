import React, { useRef, useEffect } from 'react';
import {
  Menu,
  Volume2,
  Settings,
  Search,
  X,
  Sparkles,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { useCourse } from '../../context/CourseContext';
import type { AppView } from '../../types';

interface AppHeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenSettings: () => void;
  onToggleMobileMenu?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
  onToggleMobileMenu,
  searchQuery = '',
  onSearchChange,
}) => {
  const { dict, locale, setLocale, availableLocales, isLoading } = useDictionary();
  const { currentUnit, isPlaying, togglePlay } = usePlayer();
  const { activeCourse } = useCourse();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd+K / Ctrl+K focuses the search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentViewLabel =
    (currentView === 'library' || currentView === 'studyDesk')
      ? dict.navigation.studyDesk
      : dict.navigation[currentView] || dict.sidebar.brandTitle;

  return (
    <header role="banner" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Section: Mobile Menu & Current View Title */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile Menu Button */}
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-colors cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500"
              title={dict.sidebar.expandSidebar}
              aria-label={dict.sidebar.expandSidebar}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Current View Indicator / Title */}
          <div className="hidden sm:block">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {currentViewLabel}
            </h1>
          </div>
        </div>

        {/* Center Section: Search Bar & Active Lesson Playing Pill */}
        <div className="flex-1 max-w-xl flex items-center gap-3">
          {/* Global / Contextual Search Bar */}
          {onSearchChange && (
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && searchQuery) {
                    e.preventDefault();
                    onSearchChange('');
                  }
                }}
                aria-label={dict.studyDesk.searchPlaceholder || dict.library.searchPlaceholder}
                placeholder={dict.studyDesk.searchPlaceholder || dict.library.searchPlaceholder}
                className="w-full pl-9 pr-14 py-1.5 text-xs bg-slate-50/80 hover:bg-slate-100/60 focus:bg-white border border-slate-200/80 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-ocean-300 focus:ring-2 focus:ring-ocean-100 transition-all font-medium"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSearchChange('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer touch-manipulation"
                    title={dict.buttons.clear}
                    aria-label={dict.buttons.clear}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200 select-none">
                    ⌘K
                  </kbd>
                )}
              </div>
            </div>
          )}

          {/* Active Playing Lesson Pill */}
          {currentUnit && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => onNavigate('player')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate('player');
                }
              }}
              title={`${dict.studyDesk.unitCardPrefix || 'Ünite'} ${currentUnit.unitNumber} - ${currentUnit.title}`}
              aria-label={`${dict.studyDesk.unitCardPrefix || 'Ünite'} ${currentUnit.unitNumber} - ${currentUnit.title}`}
              className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-ocean-200/80 bg-ocean-50/70 hover:bg-ocean-100/80 text-ocean-900 cursor-pointer transition-all shrink-0 select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500 touch-manipulation"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white transition-transform active:scale-95 shadow-2xs touch-manipulation ${
                  isPlaying ? 'bg-ocean-600 animate-pulse' : 'bg-slate-400 hover:bg-slate-600'
                }`}
                title={isPlaying ? dict.buttons.pause : dict.buttons.play}
                aria-label={isPlaying ? dict.buttons.pause : dict.buttons.play}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-ocean-900">
                {dict.studyDesk.unitCardPrefix || dict.library.unitCardPrefix} {currentUnit.unitNumber}
              </span>
              <span className="text-[11px] text-slate-500 max-w-[120px] truncate font-medium">
                {currentUnit.title}
              </span>
            </div>
          )}
        </div>

        {/* Right Section: Active Course Pill, Language Switcher & Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Course Quick Pill */}
          <button
            type="button"
            onClick={() => onNavigate('languageHub')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-ocean-300 hover:bg-ocean-50/40 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer active:scale-95 touch-manipulation"
            title={`${activeCourse.courseTitle} • ${activeCourse.levelTitle}`}
            aria-label={`${activeCourse.courseTitle} • ${activeCourse.levelTitle}`}
          >
            <span className="text-sm">{activeCourse.flag}</span>
            <span className="font-bold text-slate-800 text-[11px]">{activeCourse.courseTitle}</span>
            <span className="text-[10px] text-ocean-700 bg-ocean-50 border border-ocean-200/80 px-1 py-0.2 rounded font-semibold">
              {activeCourse.levelTitle}
            </span>
            <Sparkles className="w-3 h-3 text-ocean-500 ml-0.5" />
          </button>

          {/* Language Switcher */}
          <div
            role="group"
            aria-label={dict.settings?.languageLabel || 'Language Switcher'}
            className="flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/80"
          >
            {availableLocales.map((item) => {
              const isSelected = locale === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isLoading}
                  aria-pressed={isSelected}
                  aria-busy={isLoading}
                  onClick={() => {
                    if (item.id !== locale && !isLoading) {
                      setLocale(item.id);
                    }
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg uppercase transition-all select-none touch-manipulation ${
                    isLoading ? 'opacity-60 cursor-wait' : 'cursor-pointer active:scale-95'
                  } ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title={item.nativeLabel}
                  aria-label={item.nativeLabel}
                >
                  {item.code}
                </button>
              );
            })}
          </div>

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200/80 transition-colors cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500 touch-manipulation"
            title={dict.navigation.settings}
            aria-label={dict.navigation.settings}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

