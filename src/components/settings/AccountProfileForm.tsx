import React, { useState, useEffect } from 'react';
import { User, Mail, Loader2, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDictionary } from '../../context/DictionaryContext';

export interface AccountProfileFormProps {
  className?: string;
}

export const AccountProfileForm: React.FC<AccountProfileFormProps> = ({
  className = '',
}) => {
  const { dict } = useDictionary();
  const { user, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
    }
    setProfileError(null);
  }, [user]);

  const isDirty = Boolean(
    user &&
      (displayName.trim() !== (user.displayName || '').trim() ||
        email.trim().toLowerCase() !== (user.email || '').toLowerCase())
  );

  const handleReset = () => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
    }
    setProfileError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;

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
    setShowSuccess(false);

    try {
      await updateProfile(displayName.trim(), email.trim().toLowerCase());
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3500);
    } catch (err: any) {
      const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
      setProfileError(`${err?.message || dict.accountSettings.title}${statusText}`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-4 bg-white p-4.5 rounded-2xl border border-sand-200/90 shadow-2xs ${className}`}
      noValidate
    >
      {profileError && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fade-in shadow-2xs"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{profileError}</div>
        </div>
      )}

      {showSuccess && (
        <div
          role="status"
          className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in shadow-2xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex-1 font-medium">{dict.accountSettings.profileUpdatedSuccess}</div>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="account-display-name"
          className="block text-xs font-semibold text-slate-700 tracking-tight"
        >
          {dict.accountSettings.displayNameLabel}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            id="account-display-name"
            type="text"
            required
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (profileError) setProfileError(null);
            }}
            placeholder={dict.accountSettings.displayNamePlaceholder}
            className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white text-slate-900 border border-sand-200 rounded-xl shadow-2xs placeholder:text-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 transition-all"
            disabled={isUpdatingProfile}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="account-email"
          className="block text-xs font-semibold text-slate-700 tracking-tight"
        >
          {dict.accountSettings.emailLabel}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            id="account-email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (profileError) setProfileError(null);
            }}
            placeholder={dict.accountSettings.emailPlaceholder}
            className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white text-slate-900 border border-sand-200 rounded-xl shadow-2xs placeholder:text-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 transition-all"
            disabled={isUpdatingProfile}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        {isDirty && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isUpdatingProfile}
            className="min-h-[42px] px-3.5 flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-sand-200/80 active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
            title={dict.buttons.reset}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{dict.buttons.reset}</span>
          </button>
        )}

        <button
          type="submit"
          disabled={!isDirty || isUpdatingProfile}
          title={!isDirty ? dict.accountSettings.noChangesToSave : undefined}
          className={`flex-1 min-h-[42px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40 ${
            !isDirty || isUpdatingProfile
              ? 'bg-slate-100 text-slate-400 border border-sand-200/80 cursor-not-allowed shadow-none'
              : 'text-white bg-ocean-600 hover:bg-ocean-700 active:scale-[0.98] shadow-soft hover:shadow-soft-md cursor-pointer'
          }`}
        >
          {isUpdatingProfile ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              <span>{dict.accountSettings.updatingProfile}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{dict.accountSettings.updateProfileButton}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
