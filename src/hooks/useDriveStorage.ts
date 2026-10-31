/**
 * Eidos Language OS - Reactive Google Drive & Storage Hook
 * Single Source of Truth architecture (DB authority via /api/drive).
 * Manages Drive status, breadcrumb trail navigation, active folder files, pagination,
 * progress-tracked uploads, Hot Restore backup operations, and OAuth popup messaging.
 * ZERO HARDCODE: All user-facing toasts and labels are driven by dynamic dictionary.
 * FAIL-LOUD: All network and backend errors are surfaced directly to the UI.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useDictionary } from '../context/DictionaryContext';
import { getStoredAuthToken } from '../services/apiClient';
import {
  type DriveEntry,
  type DriveFolderMeta,
  type DriveStatus,
  type DriveCrumb,
  type DriveStorageQuota,
  type CloudBackupItem,
  type GoogleOAuthMessageEventData,
} from '../types/drive';
import {
  getDriveStatus,
  getGoogleAuthUrl,
  disconnectDrive,
  initDriveTaxonomy,
  getDriveStorageQuota,
  listDriveFiles,
  createDriveFolder,
  trashDriveFile,
  untrashDriveFile,
  deleteDriveFilePermanent,
  downloadDriveFile,
  uploadFileToDrive,
  createCloudBackup,
  listCloudBackups,
  getLatestCloudBackup,
  restoreCloudBackup,
} from '../services/driveApiClient';

export interface UseDriveStorageReturn {
  // Connection and Status
  status: DriveStatus | null;
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  error: Error | null;

  // Folder Explorer & Breadcrumbs
  trail: DriveCrumb[];
  currentFolder: DriveFolderMeta | null;
  files: DriveEntry[];
  nextPageToken: string | null;
  isLoadingFiles: boolean;
  openFolder: (folderId: string, folderName?: string) => Promise<void>;
  navigateUp: () => Promise<void>;
  navigateToCrumb: (index: number) => Promise<void>;
  refreshFiles: () => Promise<void>;
  loadMoreFiles: () => Promise<void>;

  // File Operations
  isUploading: boolean;
  uploadProgress: number;
  uploadFile: (file: File, folderId?: string, description?: string) => Promise<DriveEntry | null>;
  createFolder: (name: string, parentId?: string, description?: string) => Promise<DriveEntry | null>;
  trashFile: (fileId: string) => Promise<void>;
  untrashFile: (fileId: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  downloadFile: (fileId: string, filename?: string, mimeType?: string) => Promise<void>;

  // Zero-Transfer Cloud Backups & Hot Restore
  backups: CloudBackupItem[];
  latestBackup: CloudBackupItem | null;
  isLoadingBackups: boolean;
  isBackingUp: boolean;
  isRestoring: boolean;
  createBackup: () => Promise<void>;
  restoreBackup: (fileId: string) => Promise<void>;
  refreshBackups: () => Promise<void>;
  checkLatestBackup: () => Promise<void>;

  // Storage Quota
  quota: DriveStorageQuota | null;
  isQuotaLoading: boolean;
  refreshQuota: () => Promise<void>;

  // Identity Actions
  connectGoogleDrive: () => Promise<void>;
  disconnectGoogleDrive: () => Promise<void>;
  refreshStatus: () => Promise<DriveStatus | null>;
  initializeTaxonomy: () => Promise<void>;
}

export function useDriveStorage(): UseDriveStorageReturn {
  const { dict } = useDictionary();

  // Connection State
  const [status, setStatus] = useState<DriveStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Explorer State
  const [trail, setTrail] = useState<DriveCrumb[]>([]);
  const [currentFolder, setCurrentFolder] = useState<DriveFolderMeta | null>(null);
  const [files, setFiles] = useState<DriveEntry[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);

  // File Upload State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Backup & Restore State
  const [backups, setBackups] = useState<CloudBackupItem[]>([]);
  const [latestBackup, setLatestBackup] = useState<CloudBackupItem | null>(null);
  const [isLoadingBackups, setIsLoadingBackups] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // Storage Quota State
  const [quota, setQuota] = useState<DriveStorageQuota | null>(null);
  const [isQuotaLoading, setIsQuotaLoading] = useState<boolean>(false);

  // Refs for cleanup and tracking
  const popupRef = useRef<Window | null>(null);
  const popupCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (popupCheckIntervalRef.current) {
        clearInterval(popupCheckIntervalRef.current);
      }
    };
  }, []);

  // ============================================================================
  // STATUS & TAXONOMY REFRESH
  // ============================================================================

  const refreshStatus = useCallback(async (): Promise<DriveStatus | null> => {
    if (!getStoredAuthToken()) {
      if (isMountedRef.current) {
        setStatus(null);
        setIsLoading(false);
      }
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await getDriveStatus();
      if (isMountedRef.current) {
        setStatus(res);

        // If connected and root folder exists, initialize root crumb if trail is empty
        if (res.isConnected && res.folderIds?.root) {
          setTrail((prev) => {
            if (prev.length === 0) {
              return [
                {
                  id: res.folderIds!.root!,
                  name: dict.googleDrive.rootCrumb,
                },
              ];
            }
            return prev;
          });
        }
      }
      return res;
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err);
        setStatus(null);
      }
      toast.error(err?.message || dict.googleDrive.connectionError);
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [dict.googleDrive.connectionError, dict.googleDrive.rootCrumb]);

  const initializeTaxonomy = useCallback(async (): Promise<void> => {
    try {
      const res = await initDriveTaxonomy();
      toast.success(res.message || dict.googleDrive.initSuccess);
      await refreshStatus();
    } catch (err: any) {
      toast.error(err?.message || dict.googleDrive.taxonomyInitFailed);
      throw err;
    }
  }, [dict.googleDrive.initSuccess, refreshStatus]);

  const refreshQuota = useCallback(async (): Promise<void> => {
    if (!status?.isConnected) return;
    try {
      setIsQuotaLoading(true);
      const res = await getDriveStorageQuota();
      if (isMountedRef.current) {
        setQuota(res.quota);
      }
    } catch (err: any) {
      console.warn('[useDriveStorage] Quota fetch failed:', err?.message);
    } finally {
      if (isMountedRef.current) {
        setIsQuotaLoading(false);
      }
    }
  }, [status?.isConnected]);

  // ============================================================================
  // FOLDER EXPLORER & NAVIGATION
  // ============================================================================

  const openFolder = useCallback(
    async (folderId: string, folderName?: string): Promise<void> => {
      try {
        setIsLoadingFiles(true);
        setError(null);

        const listRes = await listDriveFiles({ folderId });
        if (!isMountedRef.current) return;

        setCurrentFolder(listRes.folder);
        setFiles(listRes.files);
        setNextPageToken(listRes.nextPageToken);

        // Update trail
        setTrail((prevTrail) => {
          const existingIndex = prevTrail.findIndex((crumb) => crumb.id === folderId);
          if (existingIndex >= 0) {
            // Navigated to an existing ancestor in breadcrumbs
            return prevTrail.slice(0, existingIndex + 1);
          }
          const name = folderName || listRes.folder.name || dict.googleDrive.defaultFolderFallback;
          return [...prevTrail, { id: folderId, name }];
        });
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(err);
        }
        toast.error(err?.message || dict.googleDrive.fileNotFound);
      } finally {
        if (isMountedRef.current) {
          setIsLoadingFiles(false);
        }
      }
    },
    [dict.googleDrive.fileNotFound]
  );

  const navigateUp = useCallback(async (): Promise<void> => {
    if (trail.length <= 1) return; // At root

    const newTrail = trail.slice(0, trail.length - 1);
    const parentCrumb = newTrail[newTrail.length - 1];
    setTrail(newTrail);

    if (parentCrumb) {
      try {
        setIsLoadingFiles(true);
        const listRes = await listDriveFiles({ folderId: parentCrumb.id });
        if (isMountedRef.current) {
          setCurrentFolder(listRes.folder);
          setFiles(listRes.files);
          setNextPageToken(listRes.nextPageToken);
        }
      } catch (err: any) {
        toast.error(err?.message || dict.googleDrive.fileNotFound);
      } finally {
        if (isMountedRef.current) {
          setIsLoadingFiles(false);
        }
      }
    }
  }, [trail, dict.googleDrive.fileNotFound]);

  const navigateToCrumb = useCallback(
    async (index: number): Promise<void> => {
      if (index < 0 || index >= trail.length) return;
      const targetCrumb = trail[index];
      const newTrail = trail.slice(0, index + 1);
      setTrail(newTrail);

      try {
        setIsLoadingFiles(true);
        const listRes = await listDriveFiles({ folderId: targetCrumb.id });
        if (isMountedRef.current) {
          setCurrentFolder(listRes.folder);
          setFiles(listRes.files);
          setNextPageToken(listRes.nextPageToken);
        }
      } catch (err: any) {
        toast.error(err?.message || dict.googleDrive.fileNotFound);
      } finally {
        if (isMountedRef.current) {
          setIsLoadingFiles(false);
        }
      }
    },
    [trail, dict.googleDrive.fileNotFound]
  );

  const refreshFiles = useCallback(async (): Promise<void> => {
    const activeFolderId = currentFolder?.id || (trail.length > 0 ? trail[trail.length - 1].id : undefined);
    try {
      setIsLoadingFiles(true);
      const listRes = await listDriveFiles({ folderId: activeFolderId });
      if (isMountedRef.current) {
        setCurrentFolder(listRes.folder);
        setFiles(listRes.files);
        setNextPageToken(listRes.nextPageToken);
      }
    } catch (err: any) {
      toast.error(err?.message || dict.googleDrive.fileNotFound);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingFiles(false);
      }
    }
  }, [currentFolder?.id, trail, dict.googleDrive.fileNotFound]);

  const loadMoreFiles = useCallback(async (): Promise<void> => {
    if (!nextPageToken || isLoadingFiles) return;
    const activeFolderId = currentFolder?.id || (trail.length > 0 ? trail[trail.length - 1].id : undefined);

    try {
      setIsLoadingFiles(true);
      const listRes = await listDriveFiles({
        folderId: activeFolderId,
        pageToken: nextPageToken,
      });
      if (isMountedRef.current) {
        setFiles((prev) => [...prev, ...listRes.files]);
        setNextPageToken(listRes.nextPageToken);
      }
    } catch (err: any) {
      toast.error(err?.message || dict.googleDrive.fileNotFound);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingFiles(false);
      }
    }
  }, [nextPageToken, isLoadingFiles, currentFolder?.id, trail, dict.googleDrive.fileNotFound]);

  // ============================================================================
  // FILE & FOLDER OPERATIONS
  // ============================================================================

  const uploadFile = useCallback(
    async (file: File, folderId?: string, description?: string): Promise<DriveEntry | null> => {
      const targetFolderId = folderId || currentFolder?.id || (trail.length > 0 ? trail[trail.length - 1].id : undefined);
      try {
        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        const res = await uploadFileToDrive(
          file,
          targetFolderId,
          (pct) => {
            if (isMountedRef.current) {
              setUploadProgress(pct);
            }
          },
          description
        );

        toast.success(res.message || dict.googleDrive.uploadSuccess);
        await refreshFiles();
        return res.file;
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(err);
        }
        toast.error(err?.message || dict.googleDrive.invalidUploadPayload);
        return null;
      } finally {
        if (isMountedRef.current) {
          setIsUploading(false);
          setUploadProgress(0);
        }
      }
    },
    [currentFolder?.id, trail, dict.googleDrive.uploadSuccess, dict.googleDrive.invalidUploadPayload, refreshFiles]
  );

  const createFolder = useCallback(
    async (name: string, parentId?: string, description?: string): Promise<DriveEntry | null> => {
      const targetParentId = parentId || currentFolder?.id || (trail.length > 0 ? trail[trail.length - 1].id : undefined);
      try {
        const res = await createDriveFolder(name, targetParentId, description);
        toast.success(res.message || dict.googleDrive.folderCreated);
        await refreshFiles();
        return res.folder;
      } catch (err: any) {
        toast.error(err?.message || dict.googleDrive.folderNameRequired);
        return null;
      }
    },
    [currentFolder?.id, trail, dict.googleDrive.folderCreated, dict.googleDrive.folderNameRequired, refreshFiles]
  );

  const trashFile = useCallback(
    async (fileId: string): Promise<void> => {
      try {
        const res = await trashDriveFile(fileId);
        toast.success(res.message || dict.googleDrive.trashSuccess);
        // Optimistic UI removal
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      } catch (err: any) {
        toast.error(err?.message || dict.googleDrive.fileIdRequired);
      }
    },
    [dict.googleDrive.trashSuccess, dict.googleDrive.fileIdRequired]
  );

  const untrashFile = useCallback(
    async (fileId: string): Promise<void> => {
      try {
        const res = await untrashDriveFile(fileId);
        toast.success(res.message || dict.googleDrive.untrashSuccess);
        await refreshFiles();
      } catch (err: any) {
        toast.error(err?.message || dict.googleDrive.fileIdRequired);
      }
    },
    [dict.googleDrive.untrashSuccess, dict.googleDrive.fileIdRequired, refreshFiles]
  );

  const deleteFile = useCallback(
    async (fileId: string): Promise<void> => {
      try {
        const res = await deleteDriveFilePermanent(fileId);
        toast.success(res.message || dict.googleDrive.deletePermanentSuccess);
        // Optimistic UI removal
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      } catch (err: any) {
        toast.error(err?.message || dict.googleDrive.fileIdRequired);
      }
    },
    [dict.googleDrive.deletePermanentSuccess, dict.googleDrive.fileIdRequired]
  );

  const downloadFile = useCallback(
    async (fileId: string, filename?: string, mimeType?: string): Promise<void> => {
      try {
        await downloadDriveFile(fileId, filename, mimeType);
      } catch (err: any) {
        toast.error(err?.message || dict.googleDrive.downloadFailed);
      }
    },
    [dict.googleDrive.downloadFailed]
  );

  // ============================================================================
  // BACKUP & RESTORE OPERATIONS
  // ============================================================================

  const refreshBackups = useCallback(async (): Promise<void> => {
    if (!status?.isConnected) return;
    try {
      setIsLoadingBackups(true);
      const res = await listCloudBackups();
      if (isMountedRef.current) {
        setBackups(res.backups);
      }
    } catch (err: any) {
      console.warn('[useDriveStorage] List backups failed:', err?.message);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingBackups(false);
      }
    }
  }, [status?.isConnected]);

  const checkLatestBackup = useCallback(async (): Promise<void> => {
    if (!status?.isConnected) return;
    try {
      const res = await getLatestCloudBackup();
      if (isMountedRef.current) {
        setLatestBackup(res.latestBackup);
      }
    } catch (err: any) {
      console.warn('[useDriveStorage] Latest backup fetch failed:', err?.message);
    }
  }, [status?.isConnected]);

  const createBackup = useCallback(async (): Promise<void> => {
    try {
      setIsBackingUp(true);
      const res = await createCloudBackup();
      toast.success(res.message || dict.googleDrive.backupCreatedSuccess);
      await refreshBackups();
      await checkLatestBackup();
    } catch (err: any) {
      toast.error(err?.message || 'Backup creation failed');
    } finally {
      if (isMountedRef.current) {
        setIsBackingUp(false);
      }
    }
  }, [dict.googleDrive.backupCreatedSuccess, refreshBackups, checkLatestBackup]);

  const restoreBackup = useCallback(
    async (fileId: string): Promise<void> => {
      try {
        setIsRestoring(true);
        const res = await restoreCloudBackup(fileId);
        toast.success(res.message || dict.googleDrive.backupRestoreSuccess);
      } catch (err: any) {
        toast.error(err?.message || dict.googleDrive.backupRestoreFailed);
      } finally {
        if (isMountedRef.current) {
          setIsRestoring(false);
        }
      }
    },
    [dict.googleDrive.backupRestoreSuccess, dict.googleDrive.backupRestoreFailed]
  );

  // ============================================================================
  // OAUTH POPUP & DISCONNECT
  // ============================================================================

  const connectGoogleDrive = useCallback(async (): Promise<void> => {
    try {
      setIsConnecting(true);
      const authUrlRes = await getGoogleAuthUrl();
      if (!authUrlRes.url) {
        throw new Error('Google authorization URL generation failed');
      }

      const width = 560;
      const height = 660;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrlRes.url,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=no`
      );
      popupRef.current = popup;

      // Message listener for popup communication
      const handleMessage = async (event: MessageEvent<GoogleOAuthMessageEventData>) => {
        if (!event.data || typeof event.data !== 'object') return;

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
          }
          if (popupCheckIntervalRef.current) {
            clearInterval(popupCheckIntervalRef.current);
          }

          toast.success(dict.googleDrive.connectedBadge + ': ' + (event.data.email || ''));

          // Automatically initialize taxonomy folders on fresh connection
          try {
            await initDriveTaxonomy();
          } catch (initErr) {
            console.warn('[useDriveStorage] Automatic taxonomy verification notice:', initErr);
          }

          await refreshStatus();
          if (isMountedRef.current) {
            setIsConnecting(false);
          }
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
          }
          if (popupCheckIntervalRef.current) {
            clearInterval(popupCheckIntervalRef.current);
          }

          toast.error(event.data.error || dict.googleDrive.connectionError);
          if (isMountedRef.current) {
            setIsConnecting(false);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Watch for manual popup closure by user
      if (popupCheckIntervalRef.current) {
        clearInterval(popupCheckIntervalRef.current);
      }
      popupCheckIntervalRef.current = setInterval(() => {
        if (popup && popup.closed) {
          if (popupCheckIntervalRef.current) {
            clearInterval(popupCheckIntervalRef.current);
          }
          window.removeEventListener('message', handleMessage);
          if (isMountedRef.current) {
            setIsConnecting(false);
          }
        }
      }, 500);
    } catch (err: any) {
      if (isMountedRef.current) {
        setIsConnecting(false);
      }
      toast.error(err?.message || dict.googleDrive.connectionError);
    }
  }, [dict.googleDrive.connectedBadge, dict.googleDrive.connectionError, refreshStatus]);

  const disconnectGoogleDrive = useCallback(async (): Promise<void> => {
    try {
      setIsDisconnecting(true);
      const res = await disconnectDrive();
      toast.success(res.message || dict.googleDrive.disconnectButton);

      if (isMountedRef.current) {
        setStatus(null);
        setTrail([]);
        setCurrentFolder(null);
        setFiles([]);
        setBackups([]);
        setLatestBackup(null);
        setQuota(null);
      }
    } catch (err: any) {
      toast.error(err?.message || dict.googleDrive.connectionError);
    } finally {
      if (isMountedRef.current) {
        setIsDisconnecting(false);
      }
    }
  }, [dict.googleDrive.disconnectButton, dict.googleDrive.connectionError]);

  // Initial status fetch on mount if authenticated
  useEffect(() => {
    if (getStoredAuthToken()) {
      refreshStatus();
    } else {
      setIsLoading(false);
    }
  }, [refreshStatus]);

  // If status becomes connected, fetch quota & backups, and load root folder if files are empty
  useEffect(() => {
    if (status?.isConnected) {
      refreshQuota();
      refreshBackups();
      checkLatestBackup();

      if (status.folderIds?.root && files.length === 0 && !isLoadingFiles) {
        openFolder(status.folderIds.root, dict.googleDrive.rootCrumb || 'Eidos Drive');
      }
    }
  }, [status?.isConnected, status?.folderIds?.root]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    status,
    isConnected: !!status?.isConnected,
    isLoading,
    isConnecting,
    isDisconnecting,
    error,
    trail,
    currentFolder,
    files,
    nextPageToken,
    isLoadingFiles,
    openFolder,
    navigateUp,
    navigateToCrumb,
    refreshFiles,
    loadMoreFiles,
    isUploading,
    uploadProgress,
    uploadFile,
    createFolder,
    trashFile,
    untrashFile,
    deleteFile,
    downloadFile,
    backups,
    latestBackup,
    isLoadingBackups,
    isBackingUp,
    isRestoring,
    createBackup,
    restoreBackup,
    refreshBackups,
    checkLatestBackup,
    quota,
    isQuotaLoading,
    refreshQuota,
    connectGoogleDrive,
    disconnectGoogleDrive,
    refreshStatus,
    initializeTaxonomy,
  };
}
