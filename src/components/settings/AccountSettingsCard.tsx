import React, { useState } from 'react';
import {
  User,
  Shield,
  Calendar,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDictionary } from '../../context/DictionaryContext';
import { formatRelativeTime } from '../../utils/formatters';
import { AccountGuestBanner } from './AccountGuestBanner';
import { AccountProfileForm } from './AccountProfileForm';
import { AccountSecurityForm } from './AccountSecurityForm';
import { AccountLogoutSection } from './AccountLogoutSection';

export interface AccountSettingsCardProps {
  className?: string;
  onLogoutSuccess?: () => void;
}

export const AccountSettingsCard: React.FC<AccountSettingsCardProps> = ({
  className = '',
  onLogoutSuccess,
}) => {
  const { dict } = useDictionary();
  const { user, isAdmin } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security'>('profile');
  const [copiedId, setCopiedId] = useState(false);

  // If in Guest Mode (No authenticated session)
  if (!user) {
    return <AccountGuestBanner className={className} />;
  }

  const effectiveName = user.displayName || dict.sidebar.userProfileTitle;
  const getInitials = (name: string, email: string): string => {
    const clean = (name || '').trim();
    if (clean) {
      const parts = clean.split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return clean.slice(0, 2).toUpperCase();
    }
    const emailPrefix = (email || '').split('@')[0] || '';
    if (emailPrefix.length >= 2) {
      return emailPrefix.slice(0, 2).toUpperCase();
    }
    return 'ED';
  };
  const userInitials = getInitials(effectiveName, user.email);

  const handleCopyId = async () => {
    if (!user.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Non-fatal if clipboard API is blocked in sandbox
    }
  };

  return (
    <div className={`space-y-4 pt-1 animate-fade-in ${className}`}>
      {/* User Header Snapshot Card */}
      <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-ocean-50/40 border border-sand-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ocean-500 to-ocean-700 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 select-none">
            <span>{userInitials}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 truncate">
                {effectiveName}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isAdmin
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-ocean-50 text-ocean-700 border-ocean-200'
                }`}
              >
                {isAdmin ? dict.userManagement.roleAdminBadge : dict.userManagement.roleUserBadge}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-500 truncate">
                {user.email}
              </p>
              <button
                type="button"
                onClick={handleCopyId}
                title={copiedId ? dict.accountSettings.userIdCopied : dict.accountSettings.copyUserId}
                className="p-1 rounded-md text-slate-400 hover:text-ocean-600 hover:bg-ocean-50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ocean-500"
                aria-label={dict.accountSettings.copyUserId}
              >
                {copiedId ? (
                  <Check className="w-3 h-3 text-emerald-600 animate-fade-in" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1 text-[11px] text-slate-400 shrink-0">
          {user.createdAt && (
            <div
              className="flex items-center gap-1 cursor-default"
              title={`${dict.accountSettings.memberSinceLabel}: ${new Date(user.createdAt).toLocaleString()}`}
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatRelativeTime(user.createdAt)}</span>
            </div>
          )}
          {user.lastLoginAt && (
            <div
              className="flex items-center gap-1 cursor-default"
              title={`${dict.accountSettings.lastLoginLabel}: ${new Date(user.lastLoginAt).toLocaleString()}`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatRelativeTime(user.lastLoginAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigation Switcher */}
      <div
        role="tablist"
        aria-label={dict.accountSettings.title}
        className="p-1 bg-sand-100/90 rounded-2xl flex border border-sand-200 shadow-inner select-none"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'profile'}
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 min-h-[38px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40 ${
            activeSubTab === 'profile'
              ? 'bg-white text-slate-900 shadow-2xs border border-sand-200 font-bold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>{dict.accountSettings.tabProfile}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'security'}
          onClick={() => setActiveSubTab('security')}
          className={`flex-1 min-h-[38px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40 ${
            activeSubTab === 'security'
              ? 'bg-white text-slate-900 shadow-2xs border border-sand-200 font-bold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{dict.accountSettings.tabSecurity}</span>
        </button>
      </div>

      {/* Sub-Tab Panels */}
      <div key={activeSubTab} className="animate-fade-in">
        {activeSubTab === 'profile' && <AccountProfileForm />}
        {activeSubTab === 'security' && <AccountSecurityForm />}
      </div>

      {/* Logout Action Section */}
      <AccountLogoutSection onLogoutSuccess={onLogoutSuccess} />
    </div>
  );
};
