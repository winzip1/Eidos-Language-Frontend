import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { NavigationBar } from './NavigationBar';
import { GlobalAudioPlayerBar } from '../player/GlobalAudioPlayerBar';
import type { AppView } from '../../types';

interface ShellProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenSettings: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
  searchQuery,
  onSearchChange,
  children,
}) => {
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

  return (
    <div className="min-h-screen flex bg-sand-100/60 text-slate-800 antialiased selection:bg-ocean-100 selection:text-ocean-900">
      {/* Column 1: Sol Kenar Çubuğu (Sidebar) */}
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenSettings={onOpenSettings}
      />

      {/* Main Full-Canvas Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <AppHeader
          currentView={currentView}
          onNavigate={onNavigate}
          onOpenSettings={onOpenSettings}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        {/* Dynamic Full-Canvas Main Area */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32 sm:pb-28">
            {children}
          </main>
        </div>

        {/* Persistent Bottom Docked Audio Player Bar */}
        <div className="sticky bottom-0 z-30 mb-[56px] lg:mb-0">
          <GlobalAudioPlayerBar
            currentView={currentView}
            onNavigate={onNavigate}
          />
        </div>

        {/* Mobile Bottom Quick Navigation Bar (< lg screens) */}
        <NavigationBar
          currentView={currentView}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
};
