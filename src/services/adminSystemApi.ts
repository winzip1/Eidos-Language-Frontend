/**
 * Eidos Language OS - Admin System Maintenance & Telemetry Frontend API Service
 * Strongly Typed, Fail-Loud API Bindings for Phase 9 Database Maintenance & Telemetry Panel
 * Uses apiClient.ts under the hood (Cookie + Bearer auth & Cache Busting)
 */
import { apiRequest, getApiBaseUrl, getStoredAuthToken } from './apiClient';
import type {
  DbStats,
  VacuumResult,
  SystemHealthTelemetry,
  DbBackupsListResponse,
  SystemLogItem,
  SystemLogsQueryParams,
  PaginatedResponse,
  PaginatedSystemLogsResponse,
  PruneBackupsResult,
} from '../types';

export interface BackupCreateResponse {
  filename: string;
  path: string;
  sizeBytes: number;
  createdAt: string;
}

export interface RestoreBackupResponse {
  emergencyBackup: string;
  integrity: {
    ok: boolean;
    message: string;
  };
}

/**
 * Fetch real-time server runtime telemetry (memory, uptime, OS and SQLite metrics)
 */
export async function getSystemTelemetry(): Promise<SystemHealthTelemetry> {
  return apiRequest<SystemHealthTelemetry>('/api/v1/system/telemetry', {
    method: 'GET',
  });
}

/**
 * Fetch table row counts, database and WAL sizes, and PRAGMA integrity_check
 */
export async function getDbStats(): Promise<DbStats> {
  return apiRequest<DbStats>('/api/v1/system/db/stats', {
    method: 'GET',
  });
}

/**
 * Executes SQLite VACUUM and PRAGMA optimize to compact database and reclaim free space
 */
export async function runDbVacuum(): Promise<VacuumResult> {
  return apiRequest<VacuumResult>('/api/v1/system/db/vacuum', {
    method: 'POST',
  });
}

/**
 * Triggers a lock-free physical SQLite snapshot via VACUUM INTO
 */
export async function createDbBackup(): Promise<BackupCreateResponse> {
  return apiRequest<BackupCreateResponse>('/api/v1/system/db/backup', {
    method: 'POST',
  });
}

/**
 * Retrieves the list of physical .db backups stored on the server
 */
export async function getDbBackups(): Promise<DbBackupsListResponse> {
  return apiRequest<DbBackupsListResponse>('/api/v1/system/db/backups', {
    method: 'GET',
  });
}

/**
 * Returns the direct download URL for a specific backup file
 */
export function getBackupDownloadUrl(filename: string): string {
  const base = getApiBaseUrl();
  return `${base}/api/v1/system/db/backups/${encodeURIComponent(filename)}`;
}

/**
 * Safely downloads a physical database backup file with Bearer auth and fail-loud error verification
 */
export async function downloadBackupFile(filename: string): Promise<void> {
  const token = getStoredAuthToken();
  const downloadUrl = getBackupDownloadUrl(filename);
  const response = await fetch(downloadUrl, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMsg = `Download failed with HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) {
        errorMsg = errJson.error.message;
      }
    } catch {
      // Non-JSON response
    }
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Deletes a physical database backup file from the server
 */
export async function deleteDbBackup(filename: string): Promise<{ success: boolean; message: string; filename: string }> {
  return apiRequest<{ success: boolean; message: string; filename: string }>(
    `/api/v1/system/db/backups/${encodeURIComponent(filename)}`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * Prunes older database backups based on retention policy (keepLatest count or olderThanDays age)
 */
export async function pruneDbBackups(options: { keepLatest?: number; olderThanDays?: number }): Promise<PruneBackupsResult> {
  const query = new URLSearchParams();
  if (options.keepLatest !== undefined) query.set('keepLatest', String(options.keepLatest));
  if (options.olderThanDays !== undefined) query.set('olderThanDays', String(options.olderThanDays));

  const queryString = query.toString();
  const endpoint = `/api/v1/system/db/backups${queryString ? `?${queryString}` : ''}`;
  return apiRequest<PruneBackupsResult>(endpoint, {
    method: 'DELETE',
  });
}

/**
 * Restores the active database from a specified backup snapshot.
 * Automatic emergency snapshot is created prior to restoring.
 */
export async function restoreDbBackup(filename: string): Promise<RestoreBackupResponse> {
  return apiRequest<RestoreBackupResponse>('/api/v1/system/db/restore', {
    method: 'POST',
    body: JSON.stringify({ filename }),
  });
}

/**
 * Fetches paginated system audit logs with severity breakdown summary, log level and search filters
 */
export async function getSystemLogs(params: SystemLogsQueryParams = {}): Promise<PaginatedSystemLogsResponse> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.level) query.set('level', params.level);
  if (params.search) query.set('search', params.search);

  const queryString = query.toString();
  const endpoint = `/api/v1/system/logs${queryString ? `?${queryString}` : ''}`;
  return apiRequest<PaginatedSystemLogsResponse>(endpoint, {
    method: 'GET',
  });
}

/**
 * Purges system audit logs with optional age threshold and log level filtering
 */
export async function clearSystemLogs(options: { olderThanDays?: number; level?: string } = {}): Promise<{ deletedCount: number; message: string }> {
  const query = new URLSearchParams();
  if (options.olderThanDays !== undefined) query.set('olderThanDays', String(options.olderThanDays));
  if (options.level) query.set('level', options.level);

  const queryString = query.toString();
  const endpoint = `/api/v1/system/logs${queryString ? `?${queryString}` : ''}`;
  return apiRequest<{ deletedCount: number; message: string }>(endpoint, {
    method: 'DELETE',
  });
}
