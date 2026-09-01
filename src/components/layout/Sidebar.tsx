import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Globe,
  Headphones,
  Bookmark,
  MessageSquareText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  X,
  Activity,
  Sparkles,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { useCourse } from '../../context/CourseContext';
import { UserProfileCard } from './UserProfileCard';
import type { AppView } from '../../types';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  onOpenSettings,
}) => {
  const { dict } = useDictionary();
  const { activeCourse } = useCourse();

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && onCloseMobile) {
          onCloseMobile();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isMobileOpen, onCloseMobile]);

  const mainNavItems: Array<{
    id: AppView;
    label: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'studyDesk', label: dict.navigation.studyDesk, icon: LayoutDashboard },
    { id: 'languageHub', label: dict.navigation.languageHub, icon: Globe },
    { id: 'dialogues', label: dict.navigation.dialogues, icon: MessageSquareText },
    { id: 'player', label: dict.navigation.player, icon: Headphones },
    { id: 'vocabulary', label: dict.navigation.vocabulary, icon: Bookmark },
  ];

  const analyticsNavItems: Array<{
    id: AppView;
    label: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'progress', label: dict.navigation.progress, icon: BarChart3 },
  ];

  const handleItemClick = (view: AppView) => {
    onNavigate(view);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavList = (
    items: Array<{ id: AppView; label: string; icon: React.FC<{ className?: string }> }>,
    sectionTitle?: string
  ) => (
    <div className="space-y-1">
      {!collapsed && sectionTitle && (
        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
          {sectionTitle}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id || (item.id === 'studyDesk' && currentView === 'library');
        return (
          <div key={item.id} className="relative group">
            <button
              type="button"
              onClick={() => handleItemClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 transition-all rounded-xl text-left cursor-pointer active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-1 ${
                collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-ocean-50/90 text-ocean-700 font-semibold shadow-2xs border border-ocean-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
              }`}
            >
              <div
                className={`flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? 'text-ocean-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {!collapsed && (
                <span className="text-xs tracking-tight flex-1 truncate font-medium">
                  {item.label}
                </span>
              )}

              {!collapsed && isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-ocean-600 shrink-0" />
              )}
            </button>

            {/* Hover Tooltip for Collapsed Sidebar */}
            {collapsed && (
              <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-soft-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                {item.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sand-100/80 border-r border-sand-200/90 backdrop-blur-md">
      {/* Top Brand Header */}
      <div className="p-4 border-b border-sand-200 flex items-center justify-between shrink-0">
        <div
          onClick={() => handleItemClick('studyDesk')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleItemClick('studyDesk');
            }
          }}
          aria-label={dict.sidebar.brandTitle}
          className="flex items-center gap-3 cursor-pointer group min-w-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-50 to-ocean-100 border border-ocean-200 flex items-center justify-center text-ocean-600 shadow-soft group-hover:scale-105 transition-transform shrink-0">
            <LayoutDashboard className="w-5 h-5" />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm tracking-tight truncate">
                  {dict.sidebar.brandTitle}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-semibold text-ocean-700 bg-ocean-50 border border-ocean-200 px-1.5 py-0.2 rounded-md tracking-wider">
                  {dict.sidebar.labTag}
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate">
                  {dict.sidebar.brandSubtitle}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        {isMobileOpen && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-sand-200/70 rounded-lg transition-colors lg:hidden cursor-pointer"
            title={dict.buttons.close}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Active Selected Course Indicator Badge */}
      {!collapsed ? (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-white border border-sand-200 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-base select-none">{activeCourse.flag}</span>
              <span className="text-xs font-bold text-slate-800 truncate">
                {activeCourse.courseTitle}
              </span>
            </div>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-ocean-50 text-ocean-700 border border-ocean-200 shrink-0">
              {activeCourse.levelTitle}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleItemClick('languageHub')}
            className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] font-medium text-slate-500 hover:text-ocean-600 hover:bg-ocean-50/60 rounded-lg transition-colors cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500"
          >
            <Sparkles className="w-3 h-3 text-ocean-500" />
            <span>{dict.studyDesk.switchCourseAction}</span>
          </button>
        </div>
      ) : (
        <div className="my-2 flex justify-center relative group">
          <button
            type="button"
            onClick={() => handleItemClick('languageHub')}
            className="p-2 rounded-xl bg-white border border-sand-200 shadow-2xs hover:border-ocean-300 transition-all cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500"
            aria-label={`${activeCourse.courseTitle} • ${activeCourse.levelTitle}`}
          >
            <span className="text-base select-none">{activeCourse.flag}</span>
          </button>
          {/* Hover Tooltip for Collapsed Mode */}
          <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-soft-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            {activeCourse.courseTitle} • {activeCourse.levelTitle}
          </div>
        </div>
      )}

      {/* System Status Banner (Expanded Only) */}
      {!collapsed && (
        <div className="mx-3 mt-2 px-3 py-1.5 rounded-xl bg-white/80 border border-sand-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium text-slate-600">
              {dict.sidebar.systemStatus}
            </span>
          </div>
          <Activity className="w-3.5 h-3.5 text-slate-400" />
        </div>
      )}

      {/* Navigation Groups (Scrollable) */}
      <nav
        aria-label={dict.sidebar.navHeading}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-4"
      >
        {renderNavList(mainNavItems, dict.sidebar.navHeading)}
        {renderNavList(analyticsNavItems, dict.sidebar.analyticsHeading)}
      </nav>

      {/* Bottom Actions & User Profile */}
      <div className="p-3 border-t border-sand-200 space-y-2 shrink-0 bg-sand-50/50">
        {/* Collapse / Expand Toggle Button (Desktop Only) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`w-full hidden lg:flex items-center gap-2 p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-sand-200/60 border border-transparent transition-all cursor-pointer active:scale-[0.98] ${
            collapsed ? 'justify-center' : 'justify-between px-3'
          }`}
          title={collapsed ? dict.sidebar.expandSidebar : dict.sidebar.collapseSidebar}
          aria-label={collapsed ? dict.sidebar.expandSidebar : dict.sidebar.collapseSidebar}
        >
          {!collapsed ? (
            <>
              <span className="text-xs font-medium text-slate-600">
                {dict.sidebar.collapseSidebar}
              </span>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </>
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* User Profile Card */}
        <UserProfileCard
          collapsed={collapsed}
          onOpenSettings={onOpenSettings}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-over) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-soft-lg animate-slide-up z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
