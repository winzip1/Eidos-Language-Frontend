import React, { useState, useEffect } from 'react';
import { LogOut, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDictionary } from '../../context/DictionaryContext';

export interface AccountLogoutSectionProps {
  className?: string;
  onLogoutSuccess?: () => void;
}

export const AccountLogoutSection: React.FC<AccountLogoutSectionProps> = ({
  className = '',
  onLogoutSuccess,
}) => {
  const { dict } = useDictionary();
  const { logout } = useAuth();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Close confirmation if user hits Escape key
  useEffect(() => {
    if (!showLogoutConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLogoutConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogoutConfirm]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      if (onLogoutSuccess) {
        onLogoutSuccess();
      }
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <div className={`pt-2 ${className}`}>
      {!showLogoutConfirm ? (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-sand-200/90 shadow-2xs">
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
            className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 active:scale-95 transition-all shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{dict.accountSettings.logoutButton}</span>
          </button>
        </div>
      ) : (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
          aria-describedby="logout-confirm-desc"
          className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-900 space-y-3 animate-fade-in shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 id="logout-confirm-title" className="text-xs font-bold">
                {dict.auth.logoutConfirmTitle}
              </h4>
              <p id="logout-confirm-desc" className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                {dict.auth.logoutConfirmMessage}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              disabled={isLoggingOut}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 bg-white border border-sand-200 hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
            >
              {dict.auth.logoutCancelButton}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="min-h-[38px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all cursor-pointer shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
            >
              {isLoggingOut && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{dict.auth.logoutConfirmButton}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
