import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  BookOpen,
  Sparkles,
  Layers,
  Headphones,
  Bookmark,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useDictionary } from '../../context/DictionaryContext';
import { getAdminUserDetail, type AdminUserDetailResponse } from '../../services/adminUsersApi';
import { formatRelativeTime } from '../../utils/formatters';

export interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const { dict } = useDictionary();
  const [data, setData] = useState<AdminUserDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      setIsLoading(true);
      setErrorMessage(null);
      getAdminUserDetail(userId)
        .then((res) => {
          setData(res);
        })
        .catch((err: any) => {
          const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
          setErrorMessage(`${err?.message || dict.userManagement.modalDetailTitle}${statusText}`);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setData(null);
      setErrorMessage(null);
    }
  }, [isOpen, userId, dict.userManagement.modalDetailTitle]);

  if (!isOpen) return null;

  const getInitials = (name: string): string => {
    const clean = (name || '').trim();
    if (!clean) return dict.meta.locale.toUpperCase();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const user = data?.user;
  const stats = data?.stats;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dict.userManagement.modalDetailTitle}
      subtitle={dict.userManagement.modalDetailSubtitle}
      icon={<User className="w-4 h-4 text-ocean-600" />}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-7 h-7 text-ocean-600 animate-spin" />
            <p className="text-xs font-semibold">{dict.userManagement.loadingUsers}</p>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1 font-medium">{errorMessage}</span>
          </div>
        )}

        {!isLoading && user && stats && (
          <>
            {/* Identity Card */}
            <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-12 h-12 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 border shadow-2xs ${
                    user.role === 'admin'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-ocean-50 text-ocean-700 border-ocean-200'
                  }`}
                >
                  {getInitials(user.displayName)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-slate-800 truncate">
                    {user.displayName}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Role Badge */}
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold border ${
                    user.role === 'admin'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-ocean-50 text-ocean-700 border-ocean-200'
                  }`}
                >
                  {user.role === 'admin' && <Shield className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>
                    {user.role === 'admin'
                      ? dict.userManagement.roleAdminBadge
                      : dict.userManagement.roleUserBadge}
                  </span>
                </span>

                {/* Status Badge */}
                <span
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold border ${
                    user.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      user.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span>
                    {user.status === 'active'
                      ? dict.userManagement.statusActiveBadge
                      : dict.userManagement.statusSuspendedBadge}
                  </span>
                </span>
              </div>
            </div>

            {/* Timestamps Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-white border border-sand-200 flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block font-semibold">
                    {dict.userManagement.createdAtLabel}
                  </span>
                  <span className="font-bold text-slate-700 truncate">
                    {formatRelativeTime(user.createdAt)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-sand-200 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block font-semibold">
                    {dict.userManagement.lastLoginLabel}
                  </span>
                  <span className="font-bold text-slate-700 truncate">
                    {formatRelativeTime(user.lastLoginAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* 5 Learning Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Completed Units */}
              <div className="p-3.5 rounded-2xl bg-ocean-50/60 border border-ocean-200/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-ocean-100 text-ocean-700 flex items-center justify-center shrink-0 border border-ocean-200">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-base font-black text-ocean-900">
                    {stats.completedUnitsCount}
                  </span>
                  <span className="block text-[11px] font-semibold text-ocean-700 truncate">
                    {dict.userManagement.statsUnitsCompleted}
                  </span>
                </div>
              </div>

              {/* Words Mastered */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-base font-black text-amber-900">
                    {stats.wordsMasteredCount}
                  </span>
                  <span className="block text-[11px] font-semibold text-amber-700 truncate">
                    {dict.userManagement.statsWordsMastered}
                  </span>
                </div>
              </div>

              {/* Units Attempted */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-200">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-base font-black text-indigo-900">
                    {stats.totalUnitsAttempted}
                  </span>
                  <span className="block text-[11px] font-semibold text-indigo-700 truncate">
                    {dict.userManagement.statsTotalAttempted}
                  </span>
                </div>
              </div>

              {/* Total Listened Minutes */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-base font-black text-emerald-900">
                    {stats.totalListenedMinutes}
                  </span>
                  <span className="block text-[11px] font-semibold text-emerald-700 truncate">
                    {dict.userManagement.statsTotalListenedMinutes}
                  </span>
                </div>
              </div>

              {/* Bookmarks */}
              <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/60 flex items-center gap-3 col-span-2 sm:col-span-1">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-base font-black text-purple-900">
                    {stats.bookmarksCount}
                  </span>
                  <span className="block text-[11px] font-semibold text-purple-700 truncate">
                    {dict.userManagement.statsBookmarksCount}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Close Button */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-sand-200 text-slate-600 text-xs font-semibold hover:bg-sand-100/70 hover:text-slate-800 transition-all cursor-pointer"
          >
            {dict.buttons.close}
          </button>
        </div>
      </div>
    </Modal>
  );
};
