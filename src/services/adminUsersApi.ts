/**
 * Eidos Language OS - Admin User Management Frontend API Service
 * Strongly Typed, Fail-Loud API Bindings for Phase 8 Admin Panel
 * Uses apiClient.ts under the hood (Cookie + Bearer auth & Cache Busting)
 */
import { apiRequest } from './apiClient';
import type {
  AdminUserListItem,
  AdminUsersListParams,
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  AdminResetPasswordRequest,
  PaginatedResponse,
} from '../types';

export interface UserManagementSummary {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  adminUsers: number;
}

export interface ExtendedPaginatedUsersResponse extends PaginatedResponse<AdminUserListItem> {
  summary?: UserManagementSummary;
}

export interface AdminUserDetailResponse {
  user: AdminUserListItem;
  stats: {
    completedUnitsCount: number;
    wordsMasteredCount: number;
    totalUnitsAttempted: number;
    totalListenedMinutes: number;
    bookmarksCount: number;
  };
}

/**
 * Fetch paginated list of users with search, role, status and sorting filters
 */
export async function getAdminUsers(
  params: AdminUsersListParams & {
    sortBy?: 'createdAt' | 'email' | 'displayName' | 'lastLoginAt' | 'role' | 'status';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<ExtendedPaginatedUsersResponse> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.role) query.set('role', params.role);
  if (params.status) query.set('status', params.status);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const queryString = query.toString();
  const endpoint = `/api/v1/admin/users${queryString ? `?${queryString}` : ''}`;
  return apiRequest<ExtendedPaginatedUsersResponse>(endpoint, {
    method: 'GET',
  });
}

/**
 * Fetch detailed activity and progress analytics for a specific user
 */
export async function getAdminUserDetail(userId: string): Promise<AdminUserDetailResponse> {
  return apiRequest<AdminUserDetailResponse>(`/api/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'GET',
  });
}

/**
 * Create a new user account with role, status and initial password
 */
export async function createAdminUser(
  data: AdminCreateUserRequest
): Promise<{ user: AdminUserListItem }> {
  return apiRequest<{ user: AdminUserListItem }>('/api/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update user profile, role or status (active / suspended)
 */
export async function updateAdminUser(
  userId: string,
  data: AdminUpdateUserRequest
): Promise<{ user: AdminUserListItem }> {
  return apiRequest<{ user: AdminUserListItem }>(`/api/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Reset user password directly by administrator
 */
export async function resetAdminUserPassword(
  userId: string,
  data: AdminResetPasswordRequest
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/v1/admin/users/${encodeURIComponent(userId)}/password`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Cascade delete user and all associated learning records
 */
export async function deleteAdminUser(userId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}
