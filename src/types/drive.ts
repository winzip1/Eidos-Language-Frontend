/**
 * Eidos Language OS - Google Drive & Cloud Storage TypeScript Models
 * Strongly typed data contracts for Google Drive integration,
 * folder taxonomy, breadcrumbs, Zero-Transfer backups, and lesson cloud assets.
 * Single Source of Truth architecture (DB authority).
 */

export const GOOGLE_DRIVE_MIME_TYPES = {
  FOLDER: 'application/vnd.google-apps.folder',
  AUDIO_MPEG: 'audio/mpeg',
  AUDIO_MP3: 'audio/mp3',
  AUDIO_WAV: 'audio/wav',
  AUDIO_OGG: 'audio/ogg',
  AUDIO_AAC: 'audio/aac',
  AUDIO_M4A: 'audio/mp4',
  ZIP: 'application/zip',
  OCTET_STREAM: 'application/octet-stream',
  JSON: 'application/json',
  TEXT_PLAIN: 'text/plain',
} as const;

/**
 * Single Drive entry (file or folder) with computed type flags.
 */
export interface DriveEntry {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  description?: string;
  parents?: string[];
  trashed?: boolean;
  isFolder: boolean;
  isAudio: boolean;
  isTranscript: boolean;
  isBackup: boolean;
}

/**
 * Metadata for a directory folder with parent references.
 */
export interface DriveFolderMeta {
  id: string;
  name: string;
  parents: string[];
  webViewLink: string | null;
}

/**
 * Google Drive taxonomy folder ID mapping.
 */
export interface DriveTaxonomyMapping {
  rootContainer?: string;
  root?: string;
  audio?: string;
  transcripts?: string;
  backups?: string;
  personal?: string;
  [key: string]: string | undefined;
}

/**
 * Single Source of Truth Drive connection status returned by backend.
 */
export interface DriveStatus {
  isConnected: boolean;
  email: string | null;
  refreshTokenPresent: boolean;
  grantedScopes: string[];
  rootFolderId?: string;
  folderIds?: Record<string, string> | null;
  isInitialized?: boolean;
}

/**
 * Backward compatibility alias for DriveStatus.
 */
export type DriveConnectionStatus = DriveStatus;
export type DriveStorageStatus = DriveStatus;

/**
 * Breadcrumb navigation item.
 */
export interface DriveCrumb {
  id: string;
  name: string;
}

/**
 * Mapped lesson audio or transcript asset stored in Google Drive.
 */
export interface UnitCloudAsset {
  id: string;
  userId?: string;
  courseId: string;
  languageId: string;
  levelId: string;
  unitNumber: number;
  driveFileId: string;
  fileName: string;
  fileSize?: number;
  fileSizeBytes?: number;
  mimeType: string;
  durationSeconds?: number | null;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Statistics snapshot embedded in backup manifest.
 */
export interface DriveBackupStats {
  usersCount: number;
  progressCount: number;
  vocabularyCount: number;
  unitCloudAssetCount: number;
  transcriptsCount: number;
}

/**
 * System backup manifest metadata.
 */
export interface DriveBackupManifest {
  version: string;
  createdAt: string;
  appVersion: string;
  stats: DriveBackupStats;
  dbChecksumSha256: string;
}

/**
 * Backup manifest alias for backward compatibility.
 */
export type BackupManifest = DriveBackupManifest;
export type BackupStats = DriveBackupStats;

/**
 * Google Drive storage quota and connected account details.
 */
export interface DriveStorageQuota {
  limit: string | null;
  usage: string | null;
  usageInDrive: string | null;
  usageInDriveTrash: string | null;
  limitBytes?: string | null;
  usageBytes?: string | null;
  usageInDriveBytes?: string | null;
  usageInDriveTrashBytes?: string | null;
  userEmail?: string | null;
  displayName?: string | null;
}

/**
 * Raw file item returned by Google Drive API.
 */
export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  description?: string;
  parents?: string[];
  trashed?: boolean;
}

/**
 * Paginated folder listing response.
 */
export interface DriveListResponse {
  success: boolean;
  folder: DriveFolderMeta;
  files: DriveEntry[];
  nextPageToken: string | null;
}

/**
 * Options for listing Drive files.
 */
export interface ListDriveFilesOptions {
  folderId?: string;
  query?: string;
  pageToken?: string;
  pageSize?: number;
}

/**
 * Parameters for linking a course unit to a Drive file.
 */
export interface LinkUnitCloudAssetParams {
  courseId?: string;
  languageId?: string;
  levelId?: string;
  unitNumber: number;
  driveFileId: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  durationSeconds?: number;
}

/**
 * Single system backup item in 03_Sistem_Yedekleri.
 */
export interface CloudBackupItem {
  id: string;
  name: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  description?: string;
  dbChecksumSha256?: string;
  stats?: DriveBackupStats;
  manifest?: DriveBackupManifest;
}

/**
 * Zero-Transfer backup creation result.
 */
export interface CreateBackupResult {
  success: boolean;
  fileId: string;
  fileName: string;
  fileSize: number;
  webViewLink?: string;
  manifest: DriveBackupManifest;
  uploadedAt: string;
  message: string;
}

/**
 * Hot restore execution result.
 */
export interface RestoreBackupResult {
  success: boolean;
  restoredAt: string;
  manifest: DriveBackupManifest;
  stats: DriveBackupStats;
  message: string;
}

/**
 * Latest backup resolution result.
 */
export interface LatestBackupResult {
  hasBackup: boolean;
  latestBackup: CloudBackupItem | null;
  message?: string;
}

/**
 * Google OAuth URL response.
 */
export interface GoogleAuthUrlResponse {
  success: boolean;
  url: string;
  scopes: string[];
}

/**
 * Drive disconnect response.
 */
export interface DriveDisconnectResponse {
  success: boolean;
  message: string;
}

/**
 * Window postMessage event dispatched from OAuth popup.
 */
export interface GoogleOAuthMessageEventData {
  type: 'GOOGLE_AUTH_SUCCESS' | 'GOOGLE_AUTH_ERROR';
  email?: string;
  error?: string;
  title?: string;
}

// ============================================================================
// HELPER DISCRIMINATOR FUNCTIONS
// ============================================================================

/**
 * Checks whether an entry is a folder.
 */
export function isFolderEntry(mimeType: string): boolean {
  return mimeType === GOOGLE_DRIVE_MIME_TYPES.FOLDER;
}

/**
 * Checks whether an entry is an audio file.
 */
export function isAudioEntry(mimeType: string, name: string = ''): boolean {
  if (mimeType.startsWith('audio/')) return true;
  return /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(name);
}

/**
 * Checks whether an entry is a transcript or text asset.
 */
export function isTranscriptEntry(mimeType: string, name: string = ''): boolean {
  if (mimeType === GOOGLE_DRIVE_MIME_TYPES.JSON && (name.includes('transcript') || name.endsWith('.json'))) {
    return true;
  }
  return /\.(vtt|srt|txt)$/i.test(name);
}

/**
 * Checks whether an entry is an Eidos system backup archive.
 */
export function isBackupEntry(mimeType: string, name: string = ''): boolean {
  if (mimeType === GOOGLE_DRIVE_MIME_TYPES.ZIP) return true;
  return name.startsWith('eidos_backup_') || name.endsWith('.zip');
}

/**
 * Normalizes raw API response into a strictly typed DriveEntry with computed flags.
 */
export function normalizeDriveEntry(raw: Partial<DriveFileItem> & { id: string; name: string; mimeType: string }): DriveEntry {
  const mimeType = raw.mimeType || 'application/octet-stream';
  const name = raw.name || 'Untitled';

  return {
    id: raw.id,
    name,
    mimeType,
    size: raw.size,
    modifiedTime: raw.modifiedTime,
    webViewLink: raw.webViewLink,
    webContentLink: raw.webContentLink,
    thumbnailLink: raw.thumbnailLink,
    description: raw.description,
    parents: raw.parents,
    trashed: raw.trashed,
    isFolder: isFolderEntry(mimeType),
    isAudio: isAudioEntry(mimeType, name),
    isTranscript: isTranscriptEntry(mimeType, name),
    isBackup: isBackupEntry(mimeType, name),
  };
}
