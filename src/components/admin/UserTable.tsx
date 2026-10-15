import React from 'react';
import {
  Pencil,
  KeyRound,
  Trash2,
  UserX,
  UserCheck,
  Shield,
  BookOpen,
  Sparkles,
  Loader2,
  Users,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { formatRelativeTime } from '../../utils/formatters';
import type { AdminUserListItem, AuthUser } from '../../types';

export interface UserTableProps {
  users: AdminUserListItem[];
  currentUser: AuthUser | null;
  isLoading: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: 'createdAt' | 'email' | 'displayName' | 'lastLoginAt' | 'role' | 'status') => void;
  onViewDetail?: (user: AdminUserListItem) => void;
  onEdit: (user: AdminUserListItem) => void;
  onResetPassword: (user: AdminUserListItem) => void;
  onToggleStatus: (user: AdminUserListItem) => void;
  onDelete: (user: AdminUserListItem) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  currentUser,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  onViewDetail,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onDelete,
}) => {
  const { dict } = useDictionary();

  const getInitials = (name: string): string => {
    const clean = (name || '').trim();
    if (!clean) return dict.meta.locale.toUpperCase();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const renderSortIcon = (column: string) => {
    if (!onSort) return null;
    if (sortBy === column) {
      return sortOrder === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
      );
    }
    return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0" />;
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 text-ocean-600 animate-spin" />
        <p className="text-xs font-semibold">{dict.userManagement.loadingUsers}</p>
      </div>
    );
  }

  if (!isLoading && users.length === 0) {
    return (
      <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-3xl bg-sand-100/80 text-slate-400 flex items-center justify-center mb-3.5 border border-sand-200 shadow-2xs">
          <Users className="w-7 h-7" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 mb-1">
          {dict.userManagement.emptyStateTitle}
        </h4>
        <p className="text-xs text-slate-500 max-w-sm">
          {dict.userManagement.emptyStateDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto select-text">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-sand-200/80 bg-sand-50/70 text-[11px] font-bold text-slate-500 tracking-wider uppercase select-none">
            {/* Display Name / Email Header */}
            <th
              scope="col"
              onClick={() => onSort?.('displayName')}
              className={`py-3 px-4 rounded-tl-xl ${
                onSort ? 'cursor-pointer hover:bg-sand-100/80 transition-colors group' : ''
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>{dict.userManagement.userListHeader}</span>
                {renderSortIcon('displayName')}
              </div>
            </th>

            {/* Role Header */}
            <th
              scope="col"
              onClick={() => onSort?.('role')}
              className={`py-3 px-3 ${
                onSort ? 'cursor-pointer hover:bg-sand-100/80 transition-colors group' : ''
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>{dict.userManagement.roleLabel}</span>
                {renderSortIcon('role')}
              </div>
            </th>

            {/* Status Header */}
            <th
              scope="col"
              onClick={() => onSort?.('status')}
              className={`py-3 px-3 ${
                onSort ? 'cursor-pointer hover:bg-sand-100/80 transition-colors group' : ''
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>{dict.userManagement.statusLabel}</span>
                {renderSortIcon('status')}
              </div>
            </th>

            {/* Progress Header */}
            <th scope="col" className="py-3 px-3">
              {dict.userManagement.statsUnitsCompleted} / {dict.userManagement.statsWordsMastered}
            </th>

            {/* Last Login Header */}
            <th
              scope="col"
              onClick={() => onSort?.('lastLoginAt')}
              className={`py-3 px-3 ${
                onSort ? 'cursor-pointer hover:bg-sand-100/80 transition-colors group' : ''
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>{dict.userManagement.lastLoginLabel}</span>
                {renderSortIcon('lastLoginAt')}
              </div>
            </th>

            {/* Created At Header */}
            <th
              scope="col"
              onClick={() => onSort?.('createdAt')}
              className={`py-3 px-3 ${
                onSort ? 'cursor-pointer hover:bg-sand-100/80 transition-colors group' : ''
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>{dict.userManagement.createdAtLabel}</span>
                {renderSortIcon('createdAt')}
              </div>
            </th>

            {/* Actions Header */}
            <th scope="col" className="py-3 px-4 text-right rounded-tr-xl">
              {dict.userManagement.actionsLabel}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sand-100 text-xs">
          {users.map((user) => {
            const isSelf = Boolean(currentUser && currentUser.id === user.id);
            const isAdmin = user.role === 'admin';
            const isActive = user.status === 'active';

            return (
              <tr
                key={user.id}
                className="hover:bg-sand-50/50 transition-colors group"
              >
                {/* User Info & Avatar */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 border shadow-2xs ${
                        isAdmin
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-ocean-50 text-ocean-700 border-ocean-200'
                      }`}
                    >
                      {getInitials(user.displayName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 truncate">
                          {user.displayName}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] bg-sand-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold shrink-0">
                            ({dict.userManagement.selfBadge})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Role Badge */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold border ${
                      isAdmin
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                        : 'bg-ocean-50 text-ocean-700 border-ocean-200/80'
                    }`}
                  >
                    {isAdmin && <Shield className="w-3 h-3 text-indigo-600" />}
                    <span>
                      {isAdmin
                        ? dict.userManagement.roleAdminBadge
                        : dict.userManagement.roleUserBadge}
                    </span>
                  </span>
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-bold border ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                        : 'bg-amber-50 text-amber-700 border-amber-200/80'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span>
                      {isActive
                        ? dict.userManagement.statusActiveBadge
                        : dict.userManagement.statusSuspendedBadge}
                    </span>
                  </span>
                </td>

                {/* Dynamic Learning Stats */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span
                      title={dict.userManagement.statsUnitsCompleted}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sand-100 text-slate-700 text-[11px] font-semibold"
                    >
                      <BookOpen className="w-3 h-3 text-ocean-600" />
                      <span>{user.completedUnitsCount ?? 0}</span>
                    </span>
                    <span
                      title={dict.userManagement.statsWordsMastered}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sand-100 text-slate-700 text-[11px] font-semibold"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>{user.wordsMasteredCount ?? 0}</span>
                    </span>
                  </div>
                </td>

                {/* Last Login */}
                <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 text-xs">
                  {formatRelativeTime(user.lastLoginAt)}
                </td>

                {/* Created At */}
                <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 text-xs">
                  {formatRelativeTime(user.createdAt)}
                </td>

                {/* Action Buttons */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">
                    {/* View Detail */}
                    {onViewDetail && (
                      <button
                        type="button"
                        onClick={() => onViewDetail(user)}
                        aria-label={dict.userManagement.viewDetailButton}
                        title={dict.userManagement.viewDetailButton}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-ocean-700 hover:bg-ocean-50 active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/30"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      aria-label={dict.userManagement.editUserButton}
                      title={dict.userManagement.editUserButton}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-ocean-700 hover:bg-ocean-50 active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/30"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Reset Password */}
                    <button
                      type="button"
                      onClick={() => onResetPassword(user)}
                      aria-label={dict.userManagement.resetPasswordButton}
                      title={dict.userManagement.resetPasswordButton}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>

                    {/* Suspend / Activate Toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleStatus(user)}
                      disabled={isSelf}
                      aria-label={
                        isActive
                          ? dict.userManagement.suspendUserButton
                          : dict.userManagement.activateUserButton
                      }
                      title={
                        isSelf
                          ? dict.userManagement.cannotSuspendSelf
                          : isActive
                          ? dict.userManagement.suspendUserButton
                          : dict.userManagement.activateUserButton
                      }
                      className={`p-1.5 rounded-lg transition-all focus:outline-none ${
                        isSelf
                          ? 'text-slate-300 cursor-not-allowed opacity-50'
                          : isActive
                          ? 'text-slate-500 hover:text-amber-700 hover:bg-amber-50 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500/30'
                          : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500/30'
                      }`}
                    >
                      {isActive ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </button>

                    {/* Delete (Cascade) */}
                    <button
                      type="button"
                      onClick={() => onDelete(user)}
                      disabled={isSelf}
                      aria-label={dict.userManagement.deleteUserButton}
                      title={
                        isSelf
                          ? dict.userManagement.cannotDeleteSelf
                          : dict.userManagement.deleteUserButton
                      }
                      className={`p-1.5 rounded-lg transition-all focus:outline-none ${
                        isSelf
                          ? 'text-slate-300 cursor-not-allowed opacity-50'
                          : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500/30'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
