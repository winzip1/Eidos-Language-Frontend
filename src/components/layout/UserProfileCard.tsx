import React from 'react';
import { Settings, LogIn, UserCircle } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';

interface UserProfileCardProps {
  collapsed?: boolean;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  collapsed = false,
  onOpenSettings,
  onOpenProfile,
}) => {
  const { dict } = useDictionary();
  const { user, isAuthenticated, isAdmin, openAuthModal } = useAuth();

  const getInitials = (name: string): string => {
    const clean = (name || '').trim();
    if (!clean) {
      return dict.meta.locale.toUpperCase();
    }
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const displayName = isAuthenticated && user
    ? user.displayName
    : dict.auth.guestModeTitle;

  const roleBadgeText = isAuthenticated && user
    ? (isAdmin ? dict.userManagement.roleAdminBadge : dict.userManagement.roleUserBadge)
    : dict.auth.guestModeTitle;

  const userInitials = getInitials(displayName);

  // Collapsed Sidebar View
  if (collapsed) {
    if (!isAuthenticated) {
      return (
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="w-full flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-ocean-300 hover:shadow-soft transition-all cursor-pointer group touch-manipulation active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
          title={`${dict.auth.loginTitle} • ${dict.auth.guestModeTitle}`}
          aria-label={`${dict.auth.loginTitle} • ${dict.auth.guestModeTitle}`}
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-semibold text-xs shadow-xs group-hover:scale-105 transition-transform">
              <LogIn className="w-4 h-4 text-white" />
            </div>
            {/* Subtle guest indicator dot */}
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5" title={dict.badges.unseen}>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-400 ring-2 ring-white" />
            </span>
          </div>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => {
          if (onOpenProfile) {
            onOpenProfile();
          } else if (onOpenSettings) {
            onOpenSettings();
          }
        }}
        className="w-full flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-ocean-300 hover:shadow-soft transition-all cursor-pointer group touch-manipulation active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
        title={`${displayName} • ${roleBadgeText}`}
        aria-label={`${displayName} • ${roleBadgeText}`}
      >
        <div className="relative">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-semibold text-xs shadow-xs group-hover:scale-105 transition-transform ${
              isAdmin
                ? 'bg-gradient-to-br from-indigo-600 to-violet-700'
                : 'bg-gradient-to-br from-ocean-500 to-ocean-700'
            }`}
          >
            <span>{userInitials}</span>
          </div>
          {/* Online green indicator dot */}
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5" title={dict.badges.online}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white" />
          </span>
        </div>
      </button>
    );
  }

  // Expanded Sidebar View
  return (
    <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-ocean-300 transition-all flex items-center justify-between gap-3 group">
      <div
        className={`flex items-center gap-3 min-w-0 ${
          isAuthenticated && onOpenProfile ? 'cursor-pointer select-none' : ''
        }`}
        onClick={() => {
          if (isAuthenticated && onOpenProfile) {
            onOpenProfile();
          } else if (!isAuthenticated) {
            openAuthModal('login');
          }
        }}
        role={isAuthenticated && onOpenProfile ? 'button' : undefined}
        tabIndex={isAuthenticated && onOpenProfile ? 0 : undefined}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && isAuthenticated && onOpenProfile) {
            e.preventDefault();
            onOpenProfile();
          }
        }}
        title={isAuthenticated ? `${displayName} • ${dict.accountSettings.title}` : dict.auth.guestModeDesc}
      >
        <div className="relative shrink-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-xs shadow-xs transition-transform group-hover:scale-105 ${
              !isAuthenticated
                ? 'bg-gradient-to-br from-slate-400 to-slate-600'
                : isAdmin
                ? 'bg-gradient-to-br from-indigo-600 to-violet-700'
                : 'bg-gradient-to-br from-ocean-500 to-ocean-700'
            }`}
          >
            {!isAuthenticated ? (
              <UserCircle className="w-5 h-5 text-white/90" />
            ) : (
              <span>{userInitials}</span>
            )}
          </div>

          {isAuthenticated ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5" title={dict.badges.online}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white" />
            </span>
          ) : (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5" title={dict.badges.unseen}>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-400 ring-2 ring-white" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-slate-900 truncate" title={displayName}>
              {displayName}
            </span>
            {isAuthenticated ? (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${
                  isAdmin
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-ocean-50 text-ocean-700 border-ocean-200'
                }`}
              >
                {roleBadgeText}
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                {dict.badges.learning}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-medium truncate" title={roleBadgeText}>
            {isAuthenticated
              ? (isAdmin ? dict.userManagement.roleAdminBadge : dict.userManagement.roleUserBadge)
              : dict.auth.guestModeDesc}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!isAuthenticated && (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-ocean-700 bg-ocean-50 hover:bg-ocean-100 hover:text-ocean-800 rounded-lg border border-ocean-200/80 transition-all cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 touch-manipulation"
            title={dict.buttons.login}
            aria-label={dict.buttons.login}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{dict.buttons.login}</span>
          </button>
        )}

        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 text-slate-400 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg border border-transparent hover:border-ocean-200 transition-colors shrink-0 cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 touch-manipulation"
            title={dict.navigation.settings}
            aria-label={dict.navigation.settings}
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
