import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Loader2, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDictionary } from '../../context/DictionaryContext';

export interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const { dict } = useDictionary();
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const isPasswordLongEnough = password.length >= 6;
  const isPasswordsMatching = confirmPassword.length > 0 && password === confirmPassword;

  const validate = (): boolean => {
    if (!displayName.trim()) {
      setFormError(dict.auth.nameRequiredError);
      return false;
    }
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setFormError(dict.auth.emailInvalidError);
      return false;
    }
    if (!password || password.length < 6) {
      setFormError(dict.auth.passwordMinLengthError);
      return false;
    }
    if (password !== confirmPassword) {
      setFormError(dict.auth.passwordMismatchError);
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setFormError(null);

    try {
      await register(email.trim().toLowerCase(), password, displayName.trim());
      onSuccess?.();
    } catch (err: any) {
      const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
      const message = err?.message || dict.auth.registerTitle;
      setFormError(`${message}${statusText}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
      {/* Fail-Loud Error Alert Banner */}
      {formError && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fade-in shadow-2xs"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{formError}</div>
        </div>
      )}

      {/* Full Name Input Field */}
      <div className="space-y-1">
        <label
          htmlFor="register-name"
          className="block text-xs font-semibold text-slate-700 tracking-tight"
        >
          {dict.auth.displayNameLabel}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            ref={nameInputRef}
            id="register-name"
            type="text"
            autoComplete="name"
            required
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder={dict.auth.displayNamePlaceholder}
            className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl shadow-2xs placeholder:text-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 transition-all"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Email Input Field */}
      <div className="space-y-1">
        <label
          htmlFor="register-email"
          className="block text-xs font-semibold text-slate-700 tracking-tight"
        >
          {dict.auth.emailLabel}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder={dict.auth.emailPlaceholder}
            className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl shadow-2xs placeholder:text-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 transition-all"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Password Input Field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="register-password"
            className="block text-xs font-semibold text-slate-700 tracking-tight"
          >
            {dict.auth.passwordLabel}
          </label>
          {isPasswordLongEnough && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
              <CheckCircle2 className="w-3 h-3" />
              <span>&ge; 6</span>
            </span>
          )}
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder={dict.auth.passwordPlaceholder}
            className="w-full pl-9 pr-10 py-2.5 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl shadow-2xs placeholder:text-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 transition-all"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            aria-label={showPassword ? dict.auth.hidePassword : dict.auth.showPassword}
            title={showPassword ? dict.auth.hidePassword : dict.auth.showPassword}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Confirm Password Input Field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="register-confirm-password"
            className="block text-xs font-semibold text-slate-700 tracking-tight"
          >
            {dict.auth.confirmPasswordLabel}
          </label>
          {isPasswordsMatching && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
              <CheckCircle2 className="w-3 h-3" />
            </span>
          )}
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="register-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder={dict.auth.confirmPasswordPlaceholder}
            className="w-full pl-9 pr-10 py-2.5 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl shadow-2xs placeholder:text-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 transition-all"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            aria-label={showConfirmPassword ? dict.auth.hidePassword : dict.auth.showPassword}
            title={showConfirmPassword ? dict.auth.hidePassword : dict.auth.showPassword}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Submit Action Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mt-2 rounded-xl text-xs font-semibold text-white bg-ocean-600 hover:bg-ocean-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-soft hover:shadow-soft-md transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>{dict.auth.registering}</span>
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 text-white" />
            <span>{dict.auth.submitRegister}</span>
          </>
        )}
      </button>

      {/* Switch to Login Link */}
      {onSwitchToLogin && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full py-2 px-3 text-xs font-medium text-slate-600 hover:text-ocean-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            {dict.auth.alreadyHaveAccountPrompt}
          </button>
        </div>
      )}
    </form>
  );
};
