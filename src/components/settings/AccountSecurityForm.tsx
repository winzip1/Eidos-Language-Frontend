import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDictionary } from '../../context/DictionaryContext';

export interface AccountSecurityFormProps {
  className?: string;
}

export const AccountSecurityForm: React.FC<AccountSecurityFormProps> = ({
  className = '',
}) => {
  const { dict } = useDictionary();
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError(dict.accountSettings.errorCurrentPasswordIncorrect);
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError(dict.accountSettings.errorPasswordLength);
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError(dict.accountSettings.errorSamePassword);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(dict.accountSettings.errorPasswordMismatch);
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    setShowSuccess(false);

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3500);
    } catch (err: any) {
      const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
      setPasswordError(`${err?.message || dict.accountSettings.changePasswordTitle}${statusText}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const isMatching = confirmNewPassword.length > 0 && confirmNewPassword === newPassword && newPassword.length >= 6;
  const isMismatch = confirmNewPassword.length > 0 && confirmNewPassword !== newPassword;
  const isTooShort = newPassword.length > 0 && newPassword.length < 6;

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-3.5 bg-white p-4.5 rounded-2xl border border-sand-200/90 shadow-2xs ${className}`}
      noValidate
    >
      {passwordError && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fade-in shadow-2xs"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{passwordError}</div>
        </div>
      )}

      {showSuccess && (
        <div
          role="status"
          className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in shadow-2xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex-1 font-medium">{dict.accountSettings.passwordChangedSuccess}</div>
        </div>
      )}

      {/* Current Password Field */}
      <div className="space-y-1">
        <label
          htmlFor="account-current-password"
          className="block text-xs font-semibold text-slate-700 tracking-tight"
        >
          {dict.accountSettings.currentPasswordLabel}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <KeyRound className="w-4 h-4" />
          </div>
          <input
            id="account-current-password"
            type={showCurrentPassword ? 'text' : 'password'}
            required
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            placeholder={dict.accountSettings.currentPasswordPlaceholder}
            className="w-full pl-9 pr-10 py-2.5 text-xs bg-white text-slate-900 border border-sand-200 rounded-xl shadow-2xs placeholder:text-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 transition-all"
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

      {/* New Password Field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="account-new-password"
            className="block text-xs font-semibold text-slate-700 tracking-tight"
          >
            {dict.accountSettings.newPasswordLabel}
          </label>
          {isTooShort && (
            <span className="text-[11px] text-amber-600 font-medium animate-fade-in">
              {dict.accountSettings.passwordRequirementsHint}
            </span>
          )}
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="account-new-password"
            type={showNewPassword ? 'text' : 'password'}
            required
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            placeholder={dict.accountSettings.newPasswordPlaceholder}
            className="w-full pl-9 pr-10 py-2.5 text-xs bg-white text-slate-900 border border-sand-200 rounded-xl shadow-2xs placeholder:text-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 transition-all"
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

      {/* Confirm New Password Field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="account-confirm-new-password"
            className="block text-xs font-semibold text-slate-700 tracking-tight"
          >
            {dict.accountSettings.confirmNewPasswordLabel}
          </label>
          {isMatching && (
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 animate-fade-in">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>{dict.accountSettings.passwordMatchSuccess}</span>
            </span>
          )}
          {isMismatch && (
            <span className="text-[11px] text-rose-500 font-medium animate-fade-in">
              {dict.accountSettings.errorPasswordMismatch}
            </span>
          )}
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="account-confirm-new-password"
            type={showConfirmNewPassword ? 'text' : 'password'}
            required
            value={confirmNewPassword}
            onChange={(e) => {
              setConfirmNewPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            placeholder={dict.accountSettings.confirmNewPasswordPlaceholder}
            className="w-full pl-9 pr-10 py-2.5 text-xs bg-white text-slate-900 border border-sand-200 rounded-xl shadow-2xs placeholder:text-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 transition-all"
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
        disabled={isChangingPassword || !currentPassword || !newPassword || newPassword.length < 6 || newPassword !== confirmNewPassword}
        className="w-full min-h-[42px] flex items-center justify-center gap-2 py-2.5 px-4 mt-2 rounded-xl text-xs font-semibold text-white bg-ocean-600 hover:bg-ocean-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-soft-md transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
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
  );
};
