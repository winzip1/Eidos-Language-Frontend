/**
 * Eidos Language OS - Google Drive & Cloud Storage API Client
 * Strongly typed, Fail-Loud REST API client for Google Drive cloud storage.
 * Handles OAuth connection, taxonomy self-healing, quota queries, folder/file management,
 * progress-tracked binary uploads (XHR), Zero-Transfer database backups, and lesson audio mapping.
 * Single Source of Truth architecture (DB authority).
 */
import { apiRequest, getApiBaseUrl, getStoredAuthToken, ApiError, type ApiErrorResponse } from './apiClient';
import {
  type DriveEntry,
  type DriveFolderMeta,
  type DriveStatus,
  type DriveConnectionStatus,
  type DriveTaxonomyMapping,
  type DriveStorageQuota,
  type DriveListResponse,
  type ListDriveFilesOptions,
  type UnitCloudAsset,
  type LinkUnitCloudAssetParams,
  type CloudBackupItem,
  type CreateBackupResult,
  type RestoreBackupResult,
  type LatestBackupResult,
  type GoogleAuthUrlResponse,
  type DriveDisconnectResponse,
  type DriveBackupManifest,
  type DriveBackupStats,
  type BackupManifest,
  type BackupStats,
  type DriveFileItem,
  normalizeDriveEntry,
} from '../types/drive';

// Re-export all types so existing importers continue to work without breaking changes
export type {
  DriveEntry,
  DriveFolderMeta,
  DriveStatus,
  DriveConnectionStatus,
  DriveTaxonomyMapping,
  DriveStorageQuota,
  DriveListResponse,
  ListDriveFilesOptions,
  UnitCloudAsset,
  LinkUnitCloudAssetParams,
  CloudBackupItem,
  CreateBackupResult,
  RestoreBackupResult,
  LatestBackupResult,
  GoogleAuthUrlResponse,
  DriveDisconnectResponse,
  DriveBackupManifest,
  DriveBackupStats,
  BackupManifest,
  BackupStats,
  DriveFileItem,
};

// ============================================================================
// 1. IDENTITY & CONNECTION STATUS
// ============================================================================

/**
 * Fetches the honest, database-backed Google Drive connection status.
 * Fails loud if the server returns an error or unauthorized session.
 */
export async function getDriveStatus(): Promise<DriveStatus> {
  return apiRequest<DriveStatus>('/api/drive/status', {
    method: 'GET',
  });
}

/**
 * Generates a cryptographically signed, purpose-bound Google OAuth 2.0 consent URL.
 */
export async function getGoogleAuthUrl(): Promise<GoogleAuthUrlResponse> {
  return apiRequest<GoogleAuthUrlResponse>('/api/auth/google/url', {
    method: 'GET',
  });
}

/**
 * Disconnects Google Drive: revokes remote token (with timeout protection)
 * and purges stored tokens and taxonomy cache in the database.
 */
export async function disconnectDrive(): Promise<DriveDisconnectResponse> {
  return apiRequest<DriveDisconnectResponse>('/api/drive/disconnect', {
    method: 'POST',
  });
}

/**
 * Initializes and validates the full Eidos Language OS taxonomy folders in Google Drive.
 * Reconstructs missing folders and returns the verified folder IDs.
 */
export async function initDriveTaxonomy(): Promise<{
  success: boolean;
  message: string;
  folderIds: DriveTaxonomyMapping;
}> {
  return apiRequest<{
    success: boolean;
    message: string;
    folderIds: DriveTaxonomyMapping;
  }>('/api/drive/init', {
    method: 'POST',
  });
}

/**
 * Retrieves Drive storage quota and connected account details.
 */
export async function getDriveStorageQuota(): Promise<{
  success: boolean;
  quota: DriveStorageQuota;
}> {
  const res = await apiRequest<{
    success: boolean;
    quota: any;
  }>('/api/drive/quota', {
    method: 'GET',
  });

  const rawQuota = res.quota || {};
  const normalizedQuota: DriveStorageQuota = {
    limit: rawQuota.limit ?? rawQuota.limitBytes ?? null,
    usage: rawQuota.usage ?? rawQuota.usageBytes ?? null,
    usageInDrive: rawQuota.usageInDrive ?? rawQuota.usageInDriveBytes ?? null,
    usageInDriveTrash: rawQuota.usageInDriveTrash ?? rawQuota.usageInDriveTrashBytes ?? null,
    limitBytes: rawQuota.limitBytes ?? rawQuota.limit ?? null,
    usageBytes: rawQuota.usageBytes ?? rawQuota.usage ?? null,
    usageInDriveBytes: rawQuota.usageInDriveBytes ?? rawQuota.usageInDrive ?? null,
    usageInDriveTrashBytes: rawQuota.usageInDriveTrashBytes ?? rawQuota.usageInDriveTrash ?? null,
    userEmail: rawQuota.userEmail ?? null,
    displayName: rawQuota.displayName ?? null,
  };

  return {
    success: res.success,
    quota: normalizedQuota,
  };
}

// ============================================================================
// 2. FOLDER & FILE OPERATIONS
// ============================================================================

/**
 * Lists items inside a folder with bidirectional parents navigation and pagination.
 * Normalizes all returned files with computed type flags (isFolder, isAudio, isTranscript, isBackup).
 */
export async function listDriveFiles(
  options?: ListDriveFilesOptions
): Promise<DriveListResponse> {
  const rawResponse = await apiRequest<{
    success: boolean;
    folder: DriveFolderMeta;
    files: Array<Partial<DriveFileItem> & { id: string; name: string; mimeType: string }>;
    nextPageToken: string | null;
  }>('/api/drive/files', {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });

  const normalizedFiles: DriveEntry[] = (rawResponse.files || []).map((file) =>
    normalizeDriveEntry(file)
  );

  return {
    success: rawResponse.success,
    folder: rawResponse.folder,
    files: normalizedFiles,
    nextPageToken: rawResponse.nextPageToken || null,
  };
}

/**
 * Creates a new folder inside a parent directory.
 */
export async function createDriveFolder(
  name: string,
  parentId?: string,
  description?: string
): Promise<{ success: boolean; message: string; folder: DriveEntry }> {
  const res = await apiRequest<{
    success: boolean;
    message: string;
    folder: Partial<DriveFileItem> & { id: string; name: string; mimeType: string };
  }>('/api/drive/create-folder', {
    method: 'POST',
    body: JSON.stringify({ name, parentId, description }),
  });

  return {
    success: res.success,
    message: res.message,
    folder: normalizeDriveEntry(res.folder),
  };
}

/**
 * Moves a file or folder to Google Drive trash.
 */
export async function trashDriveFile(
  fileId: string
): Promise<{ success: boolean; message: string; file: DriveEntry }> {
  const res = await apiRequest<{
    success: boolean;
    message: string;
    file: Partial<DriveFileItem> & { id: string; name: string; mimeType: string };
  }>('/api/drive/trash', {
    method: 'POST',
    body: JSON.stringify({ fileId }),
  });

  return {
    success: res.success,
    message: res.message,
    file: normalizeDriveEntry(res.file),
  };
}

/**
 * Restores a file or folder from Google Drive trash.
 */
export async function untrashDriveFile(
  fileId: string
): Promise<{ success: boolean; message: string; file: DriveEntry }> {
  const res = await apiRequest<{
    success: boolean;
    message: string;
    file: Partial<DriveFileItem> & { id: string; name: string; mimeType: string };
  }>('/api/drive/untrash', {
    method: 'POST',
    body: JSON.stringify({ fileId }),
  });

  return {
    success: res.success,
    message: res.message,
    file: normalizeDriveEntry(res.file),
  };
}

/**
 * Permanently deletes a file or folder from Google Drive (irreversible).
 */
export async function deleteDriveFilePermanent(
  fileId: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    `/api/drive/files/${encodeURIComponent(fileId)}/permanent`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * Downloads a file from Google Drive and triggers native browser save dialog.
 */
export async function downloadDriveFile(
  fileId: string,
  customFilename?: string,
  mimeType?: string
): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}/api/drive/download`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fileId, mimeType }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new ApiError({
      code: errorData?.error?.code || `HTTP_${res.status}`,
      message: errorData?.error?.message || res.statusText || 'Download failed.',
      statusCode: res.status,
      details: errorData?.error?.details,
    });
  }

  // Parse filename from Content-Disposition header if available
  let resolvedFilename = customFilename || 'download.bin';
  const disposition = res.headers.get('Content-Disposition');
  if (disposition) {
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match && utf8Match[1]) {
      resolvedFilename = decodeURIComponent(utf8Match[1]);
    } else {
      const match = disposition.match(/filename="?([^";]+)"?/i);
      if (match && match[1]) {
        resolvedFilename = decodeURIComponent(match[1]);
      }
    }
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = resolvedFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Reads text content (e.g. transcript, JSON, subtitle) directly from a Google Drive file.
 * Fail-Loud error propagation on non-200 responses.
 */
export async function fetchDriveFileText(
  fileId: string,
  mimeType?: string
): Promise<string> {
  const baseUrl = getApiBaseUrl();
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}/api/drive/download`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fileId, mimeType }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new ApiError({
      code: errorData?.error?.code || `HTTP_${res.status}`,
      message: errorData?.error?.message || res.statusText || 'Failed to fetch file content.',
      statusCode: res.status,
      details: errorData?.error?.details,
    });
  }

  return res.text();
}

/**
 * Builds the direct HTTP 206 Partial Content audio streaming URL for HTML5 `<audio>`.
 * Injects user JWT token as query parameter so standard media element can authenticate.
 */
export function getDriveStreamUrl(fileId: string): string {
  if (!fileId || typeof fileId !== 'string') return '';
  const baseUrl = getApiBaseUrl();
  const token = getStoredAuthToken();
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${baseUrl}/api/drive/stream/${encodeURIComponent(fileId.trim())}${tokenParam}`;
}

// ============================================================================
// 3. PROGRESS-TRACKED BINARY UPLOAD (XHR)
// ============================================================================

/**
 * Uploads a local file to Google Drive with real-time percentage progress callback.
 * Built with XMLHttpRequest to monitor upload progress without external libraries.
 * Fail-Loud: surfaces exact server error code and HTTP status code.
 */
export function uploadFileToDrive(
  file: File,
  folderId?: string,
  onProgress?: (percentage: number) => void,
  description?: string
): Promise<{ success: boolean; message: string; file: DriveEntry }> {
  return new Promise((resolve, reject) => {
    const baseUrl = getApiBaseUrl();
    const token = getStoredAuthToken();
    const xhr = new XMLHttpRequest();

    xhr.open('POST', `${baseUrl}/api/drive/upload`, true);
    xhr.responseType = 'json';

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (event.lengthComputable && event.total > 0) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress(Math.min(100, Math.max(0, percentage)));
        }
      };
    }

    xhr.onload = () => {
      const status = xhr.status;
      const responseData = xhr.response;

      if (status >= 200 && status < 300 && responseData && responseData.success) {
        if (onProgress) onProgress(100);
        resolve({
          success: true,
          message: responseData.message || 'File uploaded successfully.',
          file: normalizeDriveEntry(responseData.file),
        });
        return;
      }

      // Fail-Loud error parsing
      const errInfo: ApiErrorResponse = responseData?.error || {
        code: `HTTP_${status}`,
        message: responseData?.message || xhr.statusText || 'Upload failed.',
        statusCode: status,
        details: responseData?.error?.details || responseData,
      };

      reject(new ApiError(errInfo));
    };

    xhr.onerror = () => {
      reject(
        new ApiError({
          code: 'NETWORK_ERROR',
          message: 'Network connection failed during file upload.',
          statusCode: 0,
        })
      );
    };

    xhr.ontimeout = () => {
      reject(
        new ApiError({
          code: 'UPLOAD_TIMEOUT',
          message: 'File upload request timed out.',
          statusCode: 408,
        })
      );
    };

    const formData = new FormData();
    formData.append('file', file, file.name);
    if (folderId && folderId.trim()) {
      formData.append('folderId', folderId.trim());
    }
    if (description && description.trim()) {
      formData.append('description', description.trim());
    }

    xhr.send(formData);
  });
}

/**
 * Backward compatibility alias for uploadFileToDrive.
 */
export async function uploadDriveFile(
  file: File,
  folderId?: string,
  description?: string
): Promise<{ success: boolean; message: string; file: DriveEntry }> {
  return uploadFileToDrive(file, folderId, undefined, description);
}

// ============================================================================
// 4. ZERO-TRANSFER CLOUD SYSTEM BACKUP & HOT RESTORE
// ============================================================================

/**
 * Creates an atomic SQLite snapshot, packages manifest and database,
 * and streams it directly to Google Drive "03_Sistem_Yedekleri" (Zero-Transfer).
 */
export async function createCloudBackup(): Promise<CreateBackupResult> {
  return apiRequest<CreateBackupResult>('/api/drive/backup', {
    method: 'POST',
  });
}

/**
 * Lists all available system backup zip archives in Google Drive "03_Sistem_Yedekleri".
 */
export async function listCloudBackups(): Promise<{
  success: boolean;
  message: string;
  count: number;
  backups: CloudBackupItem[];
}> {
  return apiRequest<{
    success: boolean;
    message: string;
    count: number;
    backups: CloudBackupItem[];
  }>('/api/drive/backups', {
    method: 'GET',
  });
}

/**
 * Resolves the most recent system backup for cold-start disaster recovery.
 */
export async function getLatestCloudBackup(): Promise<LatestBackupResult> {
  return apiRequest<LatestBackupResult>('/api/drive/backups/latest', {
    method: 'GET',
  });
}

/**
 * Executes Hot Restore protocol:
 * Downloads backup from Google Drive, validates checksum and SQLite integrity,
 * atomically replaces database file, and resynchronizes server schema.
 */
export async function restoreCloudBackup(fileId: string): Promise<RestoreBackupResult> {
  return apiRequest<RestoreBackupResult>('/api/drive/restore', {
    method: 'POST',
    body: JSON.stringify({ fileId }),
  });
}

// ============================================================================
// 5. CLOUD LESSON ASSET MAPPING (LINK-TO-UNIT)
// ============================================================================

/**
 * Links a lesson coordinate to a Google Drive file.
 */
export async function linkDriveFileToUnit(
  params: LinkUnitCloudAssetParams
): Promise<{ success: boolean; message: string; asset: UnitCloudAsset }> {
  return apiRequest<{ success: boolean; message: string; asset: UnitCloudAsset }>(
    '/api/drive/units/link',
    {
      method: 'POST',
      body: JSON.stringify(params),
    }
  );
}

/**
 * Backward compatibility alias for linkDriveFileToUnit.
 */
export const linkDriveUnit = linkDriveFileToUnit;

/**
 * Lists all active unit cloud mappings for the authenticated user.
 */
export async function getUnitCloudMap(filters?: {
  languageId?: string;
  levelId?: string;
}): Promise<{ success: boolean; count: number; assets: UnitCloudAsset[] }> {
  const queryParams = new URLSearchParams();
  if (filters?.languageId) queryParams.set('languageId', filters.languageId);
  if (filters?.levelId) queryParams.set('levelId', filters.levelId);
  const qStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

  return apiRequest<{ success: boolean; count: number; assets: UnitCloudAsset[] }>(
    `/api/drive/units/cloud-map${qStr}`,
    {
      method: 'GET',
    }
  );
}

/**
 * Unlinks a unit cloud asset mapping.
 */
export async function unlinkDriveFileFromUnit(
  id: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    `/api/drive/units/link/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * Backward compatibility alias for unlinkDriveFileFromUnit.
 */
export const unlinkDriveUnit = unlinkDriveFileFromUnit;
