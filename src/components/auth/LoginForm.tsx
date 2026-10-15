import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, LogIn, AlertCircle, HelpCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDictionary } from '../../context/DictionaryContext';

export interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onContinueAsGuest?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  onContinueAsGuest,
}) => {
  const { dict } = useDictionary();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem('eidos_remember_me') !== 'false';
    } catch {
      return true;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const validate = (): boolean => {
    const trimmedInput = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(trimmedInput);
    const isUsername = trimmedInput.length >= 2;
    if (!trimmedInput || (!isEmail && !isUsername)) {
      setFormError(dict.auth.emailInvalidError);
      return false;
    }
    if (!password || password.length < 6) {
      setFormError(dict.auth.passwordMinLengthError);
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
      try {
        localStorage.setItem('eidos_remember_me', String(rememberMe));
      } catch {
        // Ignore quota/storage errors
      }

      await login(email.trim(), password);
      onSuccess?.();
    } catch (err: any) {
      const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
      const message = err?.message || dict.auth.loginTitle;
      setFormError(`${message}${statusText}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

      {/* Email / Username Input Field */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-email"
          className="block text-xs font-semibold text-slate-700 tracking-tight"
        >
          {dict.auth.emailLabel}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            ref={emailInputRef}
            id="login-email"
            type="text"
            autoComplete="username"
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
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold text-slate-700 tracking-tight"
          >
            {dict.auth.passwordLabel}
          </label>
          <button
            type="button"
            onClick={() => setShowForgotNotice((prev) => !prev)}
            className="text-[11px] font-medium text-ocean-600 hover:text-ocean-700 hover:underline transition-colors focus:outline-none cursor-pointer"
          >
            {dict.auth.forgotPassword}
          </button>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
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

      {/* Remember Me Checkbox */}
      <div className="flex items-center justify-between pt-0.5">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="peer sr-only"
            />
            <div className="w-4 h-4 rounded-md border border-slate-300 bg-white peer-checked:bg-ocean-600 peer-checked:border-ocean-600 peer-focus-visible:ring-2 peer-focus-visible:ring-ocean-500/30 transition-all flex items-center justify-center shadow-2xs">
              {rememberMe && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </div>
          </div>
          <span className="text-xs font-medium text-slate-600">
            {dict.auth.rememberMe}
          </span>
        </label>
      </div>

      {/* Forgot Password Notice Popup */}
      {showForgotNotice && (
        <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2 animate-fade-in">
          <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="flex-1 leading-snug">{dict.auth.forgotPasswordNotice}</p>
        </div>
      )}

      {/* Submit Action Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-ocean-600 hover:bg-ocean-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-soft hover:shadow-soft-md transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>{dict.auth.loggingIn}</span>
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4 text-white" />
            <span>{dict.auth.submitLogin}</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-slate-400 font-bold">
          <span className="bg-white px-3">Eidos Life OS</span>
        </div>
      </div>

      {/* Switch to Register & Guest Mode Buttons */}
      <div className="space-y-1.5 text-center">
        {onSwitchToRegister && (
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="w-full py-2 px-3 text-xs font-medium text-slate-600 hover:text-ocean-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            {dict.auth.createAccountPrompt}
          </button>
        )}

        {onContinueAsGuest && (
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="w-full py-1.5 px-3 text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            {dict.auth.continueAsGuest}
          </button>
        )}
      </div>
    </form>
  );
};
