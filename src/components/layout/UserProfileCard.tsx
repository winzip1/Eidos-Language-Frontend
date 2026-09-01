import React from 'react';
import { Settings } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';

interface UserProfileCardProps {
  collapsed?: boolean;
  onOpenSettings?: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  collapsed = false,
  onOpenSettings,
}) => {
  const { dict } = useDictionary();

  const getInitials = (name: string): string => {
    if (!name) return 'ÖD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const userInitials = getInitials(dict.sidebar.userProfileTitle);

  if (collapsed) {
    return (
      <div
        className="flex items-center justify-center p-2 rounded-xl bg-white border border-sand-200/80 shadow-2xs hover:border-ocean-300 hover:shadow-soft transition-all cursor-pointer group"
        onClick={onOpenSettings}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenSettings?.();
          }
        }}
        title={`${dict.sidebar.userProfileTitle} • ${dict.sidebar.userProfileRole}`}
        aria-label={`${dict.sidebar.userProfileTitle} • ${dict.sidebar.userProfileRole}`}
      >
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-700 flex items-center justify-center text-white font-semibold text-xs shadow-xs group-hover:scale-105 transition-transform">
            <span>{userInitials}</span>
          </div>
          {/* Online green indicator dot */}
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5" title={dict.badges.online}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-2xl bg-white border border-sand-200/90 shadow-soft hover:border-ocean-300 transition-all flex items-center justify-between gap-3 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-700 flex items-center justify-center text-white font-semibold text-xs shadow-xs group-hover:scale-105 transition-transform">
            <span>{userInitials}</span>
          </div>
          {/* Online green pulse indicator */}
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5" title={dict.badges.online}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-slate-900 truncate">
              {dict.sidebar.userProfileTitle}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {dict.badges.online}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium truncate">
            {dict.sidebar.userProfileRole}
          </p>
        </div>
      </div>

      {onOpenSettings && (
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 text-slate-400 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg border border-transparent hover:border-ocean-200 transition-colors shrink-0 cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500"
          title={dict.navigation.settings}
          aria-label={dict.navigation.settings}
        >
          <Settings className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
