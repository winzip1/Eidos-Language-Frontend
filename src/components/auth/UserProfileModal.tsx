import React, { useState, useEffect } from 'react';
import {
  UserCircle,
  Shield,
  KeyRound,
  LogOut,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  LogIn,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useDictionary } from '../../context/DictionaryContext';
import { formatRelativeTime } from '../../utils/formatters';

export interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { dict } = useDictionary();
  const { user, isAdmin, updateProfile, changePassword, logout, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Logout Confirmation State
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Hydrate fields when user opens modal or user data changes
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
    }
    setProfileError(null);
    setPasswordError(null);
    setShowLogoutConfirm(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  }, [user, isOpen]);

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

  const handleTabSwitch = (tab: 'profile' | 'security') => {
    setActiveTab(tab);
    setProfileError(null);
    setPasswordError(null);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setProfileError(dict.auth.nameRequiredError);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setProfileError(dict.auth.emailInvalidError);
      return;
    }

    setIsUpdatingProfile(true);
    setProfileError(null);

    try {
      await updateProfile(displayName.trim(), email.trim().toLowerCase());
    } catch (err: any) {
      const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
      setProfileError(`${err?.message || dict.accountSettings.title}${statusText}`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError(dict.accountSettings.errorCurrentPasswordIncorrect);
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError(dict.accountSettings.errorPasswordLength);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(dict.accountSettings.errorPasswordMismatch);
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
      setPasswordError(`${err?.message || dict.accountSettings.changePasswordTitle}${statusText}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onClose();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  // If in Guest Mode (No authenticated session)
  if (!user) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={dict.auth.guestModeTitle}
        subtitle={dict.auth.guestModeDesc}
        icon={<UserCircle className="w-5 h-5 text-slate-500" />}
        maxWidthClass="max-w-md"
        closeButtonLabel={dict.buttons.close}
      >
        <div className="space-y-4 py-2 text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 shadow-2xs">
            <UserCircle className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 px-2">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              {dict.auth.guestModeTitle}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {dict.auth.guestBannerPrompt}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                openAuthModal('login');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-ocean-600 hover:bg-ocean-700 active:scale-[0.99] shadow-soft hover:shadow-soft-md transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
            >
              <LogIn className="w-4 h-4 text-white" />
              <span>{dict.auth.guestBannerLoginAction}</span>
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  const effectiveName = user.displayName || dict.sidebar.userProfileTitle;
  const userInitials = getInitials(effectiveName);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dict.accountSettings.title}
      subtitle={dict.accountSettings.subtitle}
      icon={<UserCircle className="w-5 h-5 text-ocean-600" />}
      maxWidthClass="max-w-lg"
      closeButtonLabel={dict.buttons.close}
    >
      <div className="space-y-5">
        {/* User Snapshot Header Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-ocean-50/40 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ocean-500 to-ocean-700 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
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
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end gap-1 text-[11px] text-slate-400 shrink-0">
            {user.createdAt && (
              <div className="flex items-center gap-1" title={dict.accountSettings.memberSinceLabel}>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatRelativeTime(user.createdAt)}</span>
              </div>
            )}
            {user.lastLoginAt && (
              <div className="flex items-center gap-1" title={dict.accountSettings.lastLoginLabel}>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatRelativeTime(user.lastLoginAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="p-1 bg-slate-100/90 rounded-2xl flex border border-slate-200/60 shadow-inner">
          <button
            type="button"
            onClick={() => handleTabSwitch('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/70 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{dict.accountSettings.tabProfile}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('security')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/70 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{dict.accountSettings.tabSecurity}</span>
          </button>
        </div>

        {/* Tab 1: Profile Information */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4" noValidate>
            {profileError && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fade-in shadow-2xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{profileError}</div>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="profile-display-name"
                className="block text-xs font-semibold text-slate-700 tracking-tight"
              >
                {dict.accountSettings.displayNameLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="profile-display-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (profileError) setProfileError(null);
                  }}
                  placeholder={dict.accountSettings.displayNamePlaceholder}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl shadow-2xs placeholder:text-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 transition-all"
                  disabled={isUpdatingProfile}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="profile-email"
                className="block text-xs font-semibold text-slate-700 tracking-tight"
              >
                {dict.accountSettings.emailLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="profile-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (profileError) setProfileError(null);
                  }}
                  placeholder={dict.accountSettings.emailPlaceholder}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl shadow-2xs placeholder:text-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 transition-all"
                  disabled={isUpdatingProfile}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-ocean-600 hover:bg-ocean-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-soft hover:shadow-soft-md transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{dict.accountSettings.updatingProfile}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{dict.accountSettings.updateProfileButton}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Security & Password Change */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-3.5" noValidate>
            {passwordError && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fade-in shadow-2xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{passwordError}</div>
              </div>
            )}

            <div className="space-y-1">
              <label
                htmlFor="security-current-password"
                className="block text-xs font-semibold text-slate-700 tracking-tight"
              >
                {dict.accountSettings.currentPasswordLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="security-current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder={dict.accountSettings.currentPasswordPlaceholder}
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl shadow-2xs placeholder:text-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 transition-all"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  aria-label={showCurrentPassword ? dict.auth.hidePassword : dict.auth.showPassword}
                  title={showCurrentPassword ? dict.auth.hidePassword : dict.auth.showPassword}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="security-new-password"
                className="block text-xs font-semibold text-slate-700 tracking-tight"
              >
                {dict.accountSettings.newPasswordLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="security-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder={dict.accountSettings.newPasswordPlaceholder}
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl shadow-2xs placeholder:text-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 transition-all"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  aria-label={showNewPassword ? dict.auth.hidePassword : dict.auth.showPassword}
                  title={showNewPassword ? dict.auth.hidePassword : dict.auth.showPassword}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="security-confirm-new-password"
                className="block text-xs font-semibold text-slate-700 tracking-tight"
              >
                {dict.accountSettings.confirmNewPasswordLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="security-confirm-new-password"
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder={dict.accountSettings.confirmNewPasswordPlaceholder}
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl shadow-2xs placeholder:text-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 transition-all"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  aria-label={showConfirmNewPassword ? dict.auth.hidePassword : dict.auth.showPassword}
                  title={showConfirmNewPassword ? dict.auth.hidePassword : dict.auth.showPassword}
                >
                  {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mt-2 rounded-xl text-xs font-semibold text-white bg-ocean-600 hover:bg-ocean-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-soft hover:shadow-soft-md transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{dict.accountSettings.changingPassword}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{dict.accountSettings.changePasswordButton}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Danger Zone: Logout Section */}
        <div className="pt-4 border-t border-slate-200/80">
          {!showLogoutConfirm ? (
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-800">
                  {dict.accountSettings.logoutSectionTitle}
                </span>
                <span className="block text-[11px] text-slate-400 truncate mt-0.5">
                  {dict.accountSettings.logoutSectionDesc}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 transition-colors shrink-0 cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{dict.accountSettings.logoutButton}</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-900 space-y-3 animate-fade-in shadow-2xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">{dict.auth.logoutConfirmTitle}</h4>
                  <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                    {dict.auth.logoutConfirmMessage}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={isLoggingOut}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {dict.auth.logoutCancelButton}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                >
                  {isLoggingOut && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{dict.auth.logoutConfirmButton}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
