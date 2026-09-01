import React from 'react';
import {
  LayoutDashboard,
  Globe,
  Headphones,
  Bookmark,
  MessageSquareText,
  BarChart3,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import type { AppView } from '../../types';

interface NavigationBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  currentView,
  onNavigate,
}) => {
  const { dict } = useDictionary();

  const navItems: Array<{ id: AppView; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'studyDesk', label: dict.navigation.studyDesk, icon: LayoutDashboard },
    { id: 'languageHub', label: dict.navigation.languageHub, icon: Globe },
    { id: 'dialogues', label: dict.navigation.dialogues, icon: MessageSquareText },
    { id: 'player', label: dict.navigation.player, icon: Headphones },
    { id: 'vocabulary', label: dict.navigation.vocabulary, icon: Bookmark },
    { id: 'progress', label: dict.navigation.progress, icon: BarChart3 },
  ];

  return (
    <nav
      aria-label={dict.sidebar.navHeading}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-sand-200 px-1 py-1.5 grid grid-cols-6 items-center shadow-soft-lg pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id || (item.id === 'studyDesk' && currentView === 'library');
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-xl transition-all cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500 ${
              isActive
                ? 'text-ocean-600 font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'text-ocean-600 stroke-[2.2] scale-110' : 'text-slate-400'}`} />
              {isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-ocean-600" />
              )}
            </div>
            <span className="text-[9px] tracking-tight truncate max-w-full text-center leading-tight font-medium">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
