import React, { useState, useEffect } from 'react';
import { UserCog, Save, Loader2, AlertCircle, Shield, User } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useDictionary } from '../../context/DictionaryContext';
import { updateAdminUser } from '../../services/adminUsersApi';
import type { AdminUserListItem, AuthUser, UserRole, UserStatus } from '../../types';
import { toast } from 'sonner';

export interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserListItem | null;
  currentUser: AuthUser | null;
  onUserUpdated: (updatedUser: AdminUserListItem) => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  user,
  currentUser,
  onUserUpdated,
}) => {
  const { dict } = useDictionary();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [status, setStatus] = useState<UserStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSelf = Boolean(currentUser && user && currentUser.id === user.id);

  useEffect(() => {
    if (user && isOpen) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setRole(user.role);
      setStatus(user.status);
      setErrorMessage(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setErrorMessage(dict.auth.nameRequiredError);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage(dict.auth.emailInvalidError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await updateAdminUser(user.id, {
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        role,
        status,
      });

      toast.success(dict.userManagement.userUpdatedSuccess);
      onUserUpdated(res.user);
      onClose();
    } catch (err: any) {
      const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
      const message = `${err?.message || dict.userManagement.modalEditTitle}${statusText}`;
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
      title={dict.userManagement.modalEditTitle}
      subtitle={dict.userManagement.modalEditSubtitle}
      icon={<UserCog className="w-4 h-4 text-ocean-600" />}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            {dict.auth.displayNameLabel}
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder={dict.auth.displayNamePlaceholder}
            className="w-full px-3.5 py-2.5 rounded-xl border border-sand-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 bg-white"
          />
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            {dict.auth.emailLabel}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder={dict.auth.emailPlaceholder}
            className="w-full px-3.5 py-2.5 rounded-xl border border-sand-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 bg-white"
          />
        </div>

        {/* Role & Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {dict.userManagement.roleLabel}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('user')}
                disabled={isSelf}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  role === 'user'
                    ? 'bg-ocean-50 text-ocean-800 border-ocean-300 shadow-2xs'
                    : 'bg-white text-slate-600 border-sand-200 hover:bg-sand-50'
                } ${isSelf ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{dict.userManagement.roleUserBadge}</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-300 shadow-2xs'
                    : 'bg-white text-slate-600 border-sand-200 hover:bg-sand-50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{dict.userManagement.roleAdminBadge}</span>
              </button>
            </div>
            {isSelf && (
              <p className="text-[11px] text-slate-400 mt-1">
                {dict.userManagement.cannotDeleteSelf}
              </p>
            )}
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {dict.userManagement.statusLabel}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  status === 'active'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                    : 'bg-white text-slate-600 border-sand-200 hover:bg-sand-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{dict.userManagement.statusActiveBadge}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('suspended')}
                disabled={isSelf}
                title={isSelf ? dict.userManagement.cannotSuspendSelf : undefined}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  status === 'suspended'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                    : 'bg-white text-slate-600 border-sand-200 hover:bg-sand-50'
                } ${isSelf ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate">{dict.userManagement.statusSuspendedBadge}</span>
              </button>
            </div>
            {isSelf && (
              <p className="text-[11px] text-slate-400 mt-1">
                {dict.userManagement.cannotSuspendSelf}
              </p>
            )}
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
            className="px-4 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-soft-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{dict.buttons.save}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{dict.buttons.save}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
