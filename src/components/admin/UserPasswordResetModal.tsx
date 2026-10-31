import React, { useState, useEffect } from 'react';
import { KeyRound, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useDictionary } from '../../context/DictionaryContext';
import { resetAdminUserPassword } from '../../services/adminUsersApi';
import type { AdminUserListItem } from '../../types';
import { toast } from 'sonner';

export interface UserPasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserListItem | null;
  onPasswordReset?: () => void;
}

export const UserPasswordResetModal: React.FC<UserPasswordResetModalProps> = ({
  isOpen,
  onClose,
  user,
  onPasswordReset,
}) => {
  const { dict } = useDictionary();
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setShowPassword(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage(dict.auth.passwordMinLengthError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await resetAdminUserPassword(user.id, { newPassword });
      toast.success(dict.userManagement.passwordResetSuccess);
      if (onPasswordReset) {
        onPasswordReset();
      }
      onClose();
    } catch (err: any) {
      const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
      const message = `${err?.message || dict.userManagement.modalResetPasswordTitle}${statusText}`;
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={dict.userManagement.modalResetPasswordTitle}
      subtitle={dict.userManagement.modalResetPasswordSubtitle}
      icon={<KeyRound className="w-4 h-4 text-indigo-600" />}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Identity Preview Card */}
        <div className="p-3.5 rounded-2xl bg-sand-50/80 border border-sand-200 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-800 truncate">
              {user.displayName}
            </h4>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 border ${
              user.role === 'admin'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-ocean-50 text-ocean-700 border-ocean-200'
            }`}
          >
            {user.role === 'admin'
              ? dict.userManagement.roleAdminBadge
              : dict.userManagement.roleUserBadge}
          </span>
        </div>

        {/* New Password Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            {dict.userManagement.newPasswordLabel}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder={dict.userManagement.newPasswordPlaceholder}
              autoComplete="new-password"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-sand-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? dict.auth.hidePassword : dict.auth.showPassword}
              title={showPassword ? dict.auth.hidePassword : dict.auth.showPassword}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-sand-100 transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Fail-Loud Error Box */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1 font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-sand-200 text-slate-600 text-xs font-semibold hover:bg-sand-100/70 hover:text-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dict.buttons.cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-soft-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{dict.userManagement.resetPasswordButton}</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                <span>{dict.userManagement.resetPasswordButton}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
