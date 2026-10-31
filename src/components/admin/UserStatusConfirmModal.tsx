import React, { useState } from 'react';
import { UserX, UserCheck, Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useDictionary } from '../../context/DictionaryContext';
import { updateAdminUser } from '../../services/adminUsersApi';
import type { AdminUserListItem, UserStatus } from '../../types';
import { toast } from 'sonner';

export interface UserStatusConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserListItem | null;
  targetStatus: UserStatus;
  onStatusConfirmed: (updatedUser: AdminUserListItem) => void;
}

export const UserStatusConfirmModal: React.FC<UserStatusConfirmModalProps> = ({
  isOpen,
  onClose,
  user,
  targetStatus,
  onStatusConfirmed,
}) => {
  const { dict } = useDictionary();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isSuspending = targetStatus === 'suspended';

  const title = isSuspending
    ? dict.userManagement.modalSuspendTitle
    : dict.userManagement.modalActivateTitle;

  const subtitle = isSuspending
    ? dict.userManagement.modalSuspendMessage
    : dict.userManagement.modalActivateMessage;

  const confirmButtonLabel = isSuspending
    ? dict.userManagement.confirmSuspendButton
    : dict.userManagement.confirmActivateButton;

  const cancelButtonLabel = isSuspending
    ? dict.userManagement.cancelSuspendButton
    : dict.buttons.cancel;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await updateAdminUser(user.id, { status: targetStatus });
      toast.success(dict.userManagement.statusChangedSuccess);
      onStatusConfirmed(res.user);
      onClose();
    } catch (err: any) {
      const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
      const message = `${err?.message || title}${statusText}`;
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string): string => {
    const clean = (name || '').trim();
    if (!clean) return dict.meta.locale.toUpperCase();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={title}
      subtitle={subtitle}
      icon={
        isSuspending ? (
          <UserX className="w-4 h-4 text-amber-600" />
        ) : (
          <UserCheck className="w-4 h-4 text-emerald-600" />
        )
      }
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        {/* User Identity Preview Card */}
        <div className="p-3.5 rounded-2xl bg-sand-50/80 border border-sand-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 border border-sand-200">
            {getInitials(user.displayName)}
          </div>
          <div className="min-w-0 flex-1">
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
            {cancelButtonLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-soft-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isSuspending
                ? 'bg-amber-600 hover:bg-amber-700 active:scale-[0.98]'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{confirmButtonLabel}</span>
              </>
            ) : isSuspending ? (
              <>
                <UserX className="w-3.5 h-3.5" />
                <span>{confirmButtonLabel}</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>{confirmButtonLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
