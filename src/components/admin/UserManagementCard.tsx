import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  UserPlus,
  RefreshCw,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminUsers,
  type UserManagementSummary,
} from '../../services/adminUsersApi';
import type { AdminUserListItem, UserRole, UserStatus } from '../../types';
import { UserTable } from './UserTable';
import { UserCreateModal } from './UserCreateModal';
import { UserEditModal } from './UserEditModal';
import { UserPasswordResetModal } from './UserPasswordResetModal';
import { UserDeleteConfirmModal } from './UserDeleteConfirmModal';
import { UserStatusConfirmModal } from './UserStatusConfirmModal';
import { UserDetailModal } from './UserDetailModal';
import { toast } from 'sonner';

type SortColumn = 'createdAt' | 'email' | 'displayName' | 'lastLoginAt' | 'role' | 'status';

export const UserManagementCard: React.FC = () => {
  const { dict } = useDictionary();
  const { user: currentUser } = useAuth();

  // Data & Pagination State
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [summary, setSummary] = useState<UserManagementSummary>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    adminUsers: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Sorting State
  const [sortBy, setSortBy] = useState<SortColumn>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Search & Filter State with 300ms Debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<AdminUserListItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUserListItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ user: AdminUserListItem; status: UserStatus } | null>(null);
  const [viewingDetailUserId, setViewingDetailUserId] = useState<string | null>(null);

  // Race condition guard ref
  const requestIdRef = useRef(0);

  // Handle Search Input Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load Users from Backend API
  const loadUsers = useCallback(
    async (showSilentLoading = false) => {
      const currentRequestId = ++requestIdRef.current;
      if (showSilentLoading) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setFetchError(null);

      try {
        const res = await getAdminUsers({
          page,
          limit,
          search: debouncedSearch || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          sortBy,
          sortOrder,
        });

        // Guard against race conditions from previous in-flight requests
        if (currentRequestId !== requestIdRef.current) return;

        setUsers(res.items || []);
        const calculatedTotalPages = res.totalPages || 1;
        setTotalPages(calculatedTotalPages);
        setTotalCount(res.total || 0);

        if (page > calculatedTotalPages && calculatedTotalPages >= 1) {
          setPage(calculatedTotalPages);
        }

        if (res.summary) {
          setSummary(res.summary);
        }
      } catch (err: any) {
        if (currentRequestId !== requestIdRef.current) return;
        const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
        const message = `${err?.message || dict.userManagement.title}${statusText}`;
        setFetchError(message);
        toast.error(message);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [page, limit, debouncedSearch, roleFilter, statusFilter, sortBy, sortOrder, dict.userManagement.title]
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Sorting Toggle Handler
  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Status Modal Trigger
  const handleToggleStatusRequest = (targetUser: AdminUserListItem) => {
    if (currentUser && currentUser.id === targetUser.id) {
      toast.error(dict.userManagement.cannotSuspendSelf);
      return;
    }
    const nextStatus: UserStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    setStatusTarget({ user: targetUser, status: nextStatus });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-sand-200/90 shadow-soft-lg p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-sand-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-ocean-50 text-ocean-700 flex items-center justify-center border border-ocean-200/60 shadow-2xs">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                {dict.userManagement.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              {dict.userManagement.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => loadUsers(true)}
              disabled={isLoading || isRefreshing}
              title={dict.userManagement.refreshingUsers}
              aria-label={dict.userManagement.refreshingUsers}
              className="p-2.5 rounded-xl border border-sand-200 text-slate-500 hover:text-slate-800 hover:bg-sand-50 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/30"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-ocean-600' : ''}`}
              />
            </button>

            {/* Add User Action Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-soft-sm flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/30"
            >
              <UserPlus className="w-4 h-4" />
              <span>{dict.userManagement.addUserButton}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          {/* Total Users */}
          <div className="p-4 rounded-2xl bg-sand-50/70 border border-sand-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-sand-200">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-lg font-black text-slate-800">
                {summary.totalUsers}
              </span>
              <span className="block text-[11px] font-semibold text-slate-500 truncate">
                {dict.userManagement.totalUsersCount}
              </span>
            </div>
          </div>

          {/* Active Users */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-lg font-black text-emerald-800">
                {summary.activeUsers}
              </span>
              <span className="block text-[11px] font-semibold text-emerald-700 truncate">
                {dict.userManagement.activeUsersCount}
              </span>
            </div>
          </div>

          {/* Suspended Users */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
              <UserX className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-lg font-black text-amber-800">
                {summary.suspendedUsers}
              </span>
              <span className="block text-[11px] font-semibold text-amber-700 truncate">
                {dict.userManagement.suspendedUsersCount}
              </span>
            </div>
          </div>

          {/* Admin Users */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-200">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-lg font-black text-indigo-800">
                {summary.adminUsers}
              </span>
              <span className="block text-[11px] font-semibold text-indigo-700 truncate">
                {dict.userManagement.adminUsersCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table & Filter Container */}
      <div className="bg-white rounded-3xl border border-sand-200/90 shadow-soft-lg overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-sand-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-sand-50/40">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={dict.userManagement.searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-sand-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 bg-white"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label={dict.buttons.clear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role and Status Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as 'all' | UserRole);
                setPage(1);
              }}
              aria-label={dict.userManagement.roleLabel}
              className="px-3 py-2 rounded-xl border border-sand-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-ocean-500 cursor-pointer"
            >
              <option value="all">{dict.userManagement.filterRoleAll}</option>
              <option value="admin">{dict.userManagement.filterRoleAdmin}</option>
              <option value="user">{dict.userManagement.filterRoleUser}</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | UserStatus);
                setPage(1);
              }}
              aria-label={dict.userManagement.statusLabel}
              className="px-3 py-2 rounded-xl border border-sand-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-ocean-500 cursor-pointer"
            >
              <option value="all">{dict.userManagement.filterStatusAll}</option>
              <option value="active">{dict.userManagement.filterStatusActive}</option>
              <option value="suspended">{dict.userManagement.filterStatusSuspended}</option>
            </select>
          </div>
        </div>

        {/* Fail-Loud Error Alert */}
        {fetchError && (
          <div
            role="alert"
            className="m-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1 font-medium">{fetchError}</span>
            <button
              type="button"
              onClick={() => loadUsers()}
              className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold transition-colors cursor-pointer"
            >
              {dict.buttons.retry}
            </button>
          </div>
        )}

        {/* User Table Component */}
        <UserTable
          users={users}
          currentUser={currentUser}
          isLoading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onViewDetail={(user) => setViewingDetailUserId(user.id)}
          onEdit={(user) => setEditingUser(user)}
          onResetPassword={(user) => setResettingPasswordUser(user)}
          onToggleStatus={handleToggleStatusRequest}
          onDelete={(user) => setDeletingUser(user)}
        />

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-sand-100 bg-sand-50/60 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              {dict.userManagement.paginationPage} {page} / {totalPages} (Toplam {totalCount})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || isLoading}
                className="px-3 py-1.5 rounded-xl border border-sand-200 bg-white text-slate-600 hover:bg-sand-50 active:scale-[0.98] transition-all font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{dict.userManagement.paginationPrevious}</span>
              </button>

              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || isLoading}
                className="px-3 py-1.5 rounded-xl border border-sand-200 bg-white text-slate-600 hover:bg-sand-50 active:scale-[0.98] transition-all font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/30"
              >
                <span>{dict.userManagement.paginationNext}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={() => loadUsers(true)}
      />

      <UserEditModal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        currentUser={currentUser}
        onUserUpdated={() => loadUsers(true)}
      />

      <UserPasswordResetModal
        isOpen={Boolean(resettingPasswordUser)}
        onClose={() => setResettingPasswordUser(null)}
        user={resettingPasswordUser}
        onPasswordReset={() => loadUsers(true)}
      />

      <UserDeleteConfirmModal
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        user={deletingUser}
        onDeleted={() => loadUsers(true)}
      />

      <UserStatusConfirmModal
        isOpen={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        user={statusTarget?.user ?? null}
        targetStatus={statusTarget?.status ?? 'active'}
        onStatusConfirmed={() => loadUsers(true)}
      />

      <UserDetailModal
        isOpen={Boolean(viewingDetailUserId)}
        onClose={() => setViewingDetailUserId(null)}
        userId={viewingDetailUserId}
      />
    </div>
  );
};
