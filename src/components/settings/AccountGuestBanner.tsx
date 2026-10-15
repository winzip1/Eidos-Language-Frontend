import React from 'react';
import { UserCircle, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDictionary } from '../../context/DictionaryContext';

export interface AccountGuestBannerProps {
  className?: string;
}

export const AccountGuestBanner: React.FC<AccountGuestBannerProps> = ({
  className = '',
}) => {
  const { dict } = useDictionary();
  const { openAuthModal } = useAuth();

  return (
    <div className={`space-y-4 pt-1 animate-fade-in ${className}`}>
      <div className="bg-gradient-to-b from-white via-sand-50/50 to-sand-100/40 p-6 sm:p-7 rounded-2xl border border-sand-200/90 text-center space-y-4 shadow-2xs">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-sand-200 shadow-2xs flex items-center justify-center text-ocean-600 transition-transform duration-200 hover:scale-105">
          <UserCircle className="w-9 h-9 text-ocean-500/80" />
        </div>

        <div className="space-y-1.5 max-w-sm mx-auto">
          <h4 className="text-sm font-bold text-slate-800 tracking-tight">
            {dict.auth.guestModeTitle}
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            {dict.auth.guestBannerPrompt}
          </p>
        </div>

        <div className="pt-2 max-w-xs mx-auto flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="w-full sm:flex-1 min-h-[42px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-ocean-600 hover:bg-ocean-700 active:scale-[0.98] shadow-soft hover:shadow-soft-md transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
          >
            <LogIn className="w-4 h-4 text-white" />
            <span>{dict.auth.guestBannerLoginAction}</span>
          </button>

          <button
            type="button"
            onClick={() => openAuthModal('register')}
            className="w-full sm:flex-1 min-h-[42px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 border border-sand-200 shadow-2xs active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            <span>{dict.accountSettings.guestRegisterAction}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
