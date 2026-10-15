import React, { useState, createContext, useContext, useMemo, useRef, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { NavigationBar } from './NavigationBar';
import { GlobalAudioPlayerBar } from '../player/globalPlayer';
import { useDictionary } from '../../context/DictionaryContext';
import type { AppView } from '../../types';

export interface ShellContextValue {
  isMobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  openSettings: () => void;
  openProfile?: () => void;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const ShellContext = createContext<ShellContextValue | null>(null);

export const useShell = (): ShellContextValue | null => useContext(ShellContext);

interface ShellProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenSettings: () => void;
  onOpenProfile?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
  onOpenProfile,
  searchQuery,
  onSearchChange,
  children,
}) => {
  const { dict } = useDictionary();
  const mainRef = useRef<HTMLElement>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('eidos_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('eidos_sidebar_collapsed', String(next));
      } catch {
        // Ignore storage quotas
      }
      return next;
    });
  };

  const isPlayerView = currentView === 'player';

  // Automatically reset main scroll position when switching views for seamless UX
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView]);

  const shellContextValue: ShellContextValue = useMemo(() => ({
    isMobileSidebarOpen,
    openMobileSidebar: () => setIsMobileSidebarOpen(true),
    closeMobileSidebar: () => setIsMobileSidebarOpen(false),
    isSidebarCollapsed,
    toggleSidebarCollapse: handleToggleSidebarCollapse,
    openSettings: onOpenSettings,
    openProfile: onOpenProfile,
    currentView,
    onNavigate,
  }), [isMobileSidebarOpen, isSidebarCollapsed, onOpenSettings, onOpenProfile, currentView, onNavigate]);

  return (
    <ShellContext.Provider value={shellContextValue}>
      <div className="h-screen h-[100dvh] flex bg-sand-100/60 text-slate-800 antialiased selection:bg-ocean-100 selection:text-ocean-900 overflow-hidden">
        {/* Skip to Main Content Link for Keyboard Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-ocean-600 focus:text-white focus:text-xs focus:font-bold focus:rounded-xl focus:shadow-md focus:outline-hidden"
        >
          {dict.navigation.studyDesk}
        </a>

        {/* Column 1: Sol Kenar Çubuğu (Sidebar) */}
        <Sidebar
          currentView={currentView}
          onNavigate={onNavigate}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenSettings={onOpenSettings}
          onOpenProfile={onOpenProfile}
        />

        {/* Main Full-Canvas Layout Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Smart Header Delegation: On player view, header authority is delegated exclusively to LessonPlayerHeader to prevent dual header stack */}
          {!isPlayerView && (
            <AppHeader
              currentView={currentView}
              onNavigate={onNavigate}
              onOpenSettings={onOpenSettings}
              onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
            />
          )}

          {/* Dynamic Full-Canvas Main Area */}
          <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden">
            <main
              ref={mainRef}
              id="main-content"
              tabIndex={-1}
              className={`flex-1 w-full mx-auto focus:outline-hidden ${
                isPlayerView
                  ? 'h-full flex flex-col overflow-hidden p-0'
                  : 'overflow-y-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 pb-20 sm:pb-24'
              }`}
            >
              {children}
            </main>
          </div>

          {/* Persistent Bottom Audio Player Bar: GlobalAudioPlayerBar on non-player views (prevents dual player on player screen) */}
          {!isPlayerView && (
            <div className="shrink-0 z-30">
              <GlobalAudioPlayerBar
                currentView={currentView}
                onNavigate={onNavigate}
              />
            </div>
          )}

          {/* Mobile Bottom Navigation Bar (z-40 to stay accessible above docked controls) */}
          <NavigationBar
            currentView={currentView}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </ShellContext.Provider>
  );
};


