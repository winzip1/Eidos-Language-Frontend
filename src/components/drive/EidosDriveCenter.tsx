/**
 * Eidos Language OS - Google Drive Explorer Center
 * Main orchestration shell for Google Drive file browser, taxonomy navigation,
 * progress-tracked uploads, and cloud asset operations.
 * Single Source of Truth architecture (DB authority via useDriveStorage).
 * STRICTLY LIGHT THEME & ZERO HARDCODE (Yacht-Deck Modern Aesthetic).
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { HardDrive, Cloud, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useDictionary, interpolate } from '../../context/DictionaryContext';
import { formatBytes } from '../../utils/formatters';
import { useDriveStorage } from '../../hooks/useDriveStorage';
import { getUnitCloudMap } from '../../services/driveApiClient';
import { DriveBreadcrumbs } from './DriveBreadcrumbs';
import { DriveToolbar, type DriveFilterType, type DriveToolbarCounts } from './DriveToolbar';
import { DriveFileList } from './DriveFileList';
import { DriveEmptyState } from './DriveEmptyState';
import { DriveUploadModal } from './DriveUploadModal';
import { DriveCreateFolderModal } from './DriveCreateFolderModal';
import { DriveDeleteConfirmModal } from './DriveDeleteConfirmModal';
import { DriveFilePreviewModal } from './DriveFilePreviewModal';
import { DriveLinkToUnitModal } from './DriveLinkToUnitModal';
import type { DriveEntry, UnitCloudAsset } from '../../types/drive';

export interface EidosDriveCenterProps {
  onNavigate?: (view: any) => void;
  onPreviewAsset?: (entry: DriveEntry) => void;
  onLinkAssetToLesson?: (entry: DriveEntry) => void;
  className?: string;
}

export const EidosDriveCenter: React.FC<EidosDriveCenterProps> = ({
  onNavigate,
  onPreviewAsset,
  onLinkAssetToLesson,
  className = '',
}) => {
  const { dict } = useDictionary();

  // Storage and Explorer State from Hook
  const {
    status,
    isConnected,
    isLoading,
    isConnecting,
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
    deleteFile,
    downloadFile,
    quota,
    connectGoogleDrive,
  } = useDriveStorage();

  // Local UI State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<DriveFilterType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Cloud Lesson Mappings State
  const [cloudMap, setCloudMap] = useState<UnitCloudAsset[]>([]);

  // Modal State
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    entry: DriveEntry;
    isPermanent: boolean;
  } | null>(null);
  const [previewTarget, setPreviewTarget] = useState<DriveEntry | null>(null);
  const [linkTarget, setLinkTarget] = useState<DriveEntry | null>(null);

  // Fetch unit cloud mappings when connected
  const fetchCloudMappings = useCallback(async () => {
    if (!isConnected) return;
    try {
      const res = await getUnitCloudMap();
      if (res && res.assets) {
        setCloudMap(res.assets);
      }
    } catch (err: any) {
      console.warn('[EidosDriveCenter] Cloud map fetch warning:', err?.message);
    }
  }, [isConnected]);

  useEffect(() => {
    fetchCloudMappings();
  }, [fetchCloudMappings]);

  // Lookup map: driveFileId -> UnitCloudAsset
  const cloudAssetMap = useMemo(() => {
    const map: Record<string, UnitCloudAsset> = {};
    for (const a of cloudMap) {
      if (a.driveFileId) {
        map[a.driveFileId] = a;
      }
    }
    return map;
  }, [cloudMap]);

  // Active target folder name for modals
  const activeFolderName = currentFolder?.name || (trail.length > 0 ? trail[trail.length - 1].name : undefined);
  const activeFolderId = currentFolder?.id || (trail.length > 0 ? trail[trail.length - 1].id : undefined);

  // Deterministic filter counts calculation
  const counts: DriveToolbarCounts = useMemo(() => {
    let audio = 0;
    let transcripts = 0;
    let backups = 0;
    let folders = 0;

    for (const f of files) {
      if (f.isFolder) folders++;
      if (f.isAudio) audio++;
      if (f.isTranscript) transcripts++;
      if (f.isBackup) backups++;
    }

    return {
      all: files.length,
      audio,
      transcripts,
      backups,
      folders,
    };
  }, [files]);

  // Deterministic file filtering (filter pill + search query)
  const filteredFiles = useMemo(() => {
    return files.filter((entry) => {
      // 1. Type filter
      if (activeFilter === 'audio' && !entry.isAudio) return false;
      if (activeFilter === 'transcripts' && !entry.isTranscript) return false;
      if (activeFilter === 'backups' && !entry.isBackup) return false;
      if (activeFilter === 'folders' && !entry.isFolder) return false;

      // 2. Search query match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return entry.name.toLowerCase().includes(query);
      }

      return true;
    });
  }, [files, activeFilter, searchQuery]);

  // Preview callback (opens preview modal)
  const handlePreview = useCallback(
    (entry: DriveEntry) => {
      setPreviewTarget(entry);
      if (onPreviewAsset) {
        onPreviewAsset(entry);
      }
    },
    [onPreviewAsset]
  );

  // Link to Lesson callback (opens smart link modal)
  const handleLinkToLesson = useCallback(
    (entry: DriveEntry) => {
      setLinkTarget(entry);
      if (onLinkAssetToLesson) {
        onLinkAssetToLesson(entry);
      }
    },
    [onLinkAssetToLesson]
  );

  // Transition from Preview modal to Link modal
  const handleLinkFromPreview = useCallback((entry: DriveEntry) => {
    setPreviewTarget(null);
    setLinkTarget(entry);
  }, []);

  // Update cloud map on link success
  const handleLinkSuccess = useCallback((newAsset: UnitCloudAsset) => {
    setCloudMap((prev) => {
      const filtered = prev.filter(
        (a) => a.id !== newAsset.id && a.driveFileId !== newAsset.driveFileId
      );
      return [...filtered, newAsset];
    });
  }, []);

  // Update cloud map on unlink success
  const handleUnlinkSuccess = useCallback((unlinkedId: string) => {
    setCloudMap((prev) => prev.filter((a) => a.id !== unlinkedId));
  }, []);

  // Deletion confirm triggers
  const handleRequestTrash = (entry: DriveEntry) => {
    setDeleteTarget({ entry, isPermanent: false });
  };

  const handleRequestDeletePermanent = (entry: DriveEntry) => {
    setDeleteTarget({ entry, isPermanent: true });
  };

  const handleExecuteDelete = async (entry: DriveEntry) => {
    if (!deleteTarget) return;
    if (deleteTarget.isPermanent) {
      await deleteFile(entry.id);
    } else {
      await trashFile(entry.id);
    }
  };

  // Quota calculation
  const quotaUsageText = useMemo(() => {
    if (!quota) return null;
    const usageNum = quota.usage ? Number(quota.usage) : 0;
    const limitNum = quota.limit ? Number(quota.limit) : 0;
    if (limitNum > 0) {
      return interpolate(dict.googleDrive.quotaUsedText, {
        used: formatBytes(usageNum),
        total: formatBytes(limitNum),
      });
    }
    return formatBytes(usageNum);
  }, [quota, dict.googleDrive.quotaUsedText]);

  const quotaPercent = useMemo(() => {
    if (!quota || !quota.usage || !quota.limit) return 0;
    const u = Number(quota.usage);
    const l = Number(quota.limit);
    if (l <= 0) return 0;
    return Math.min(100, Math.round((u / l) * 100));
  }, [quota]);

  return (
    <div className={`space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-5 ${className}`}>
      {/* 1. Header & Storage Identity Banner */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-sand-200/90 rounded-3xl p-4 sm:p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-ocean-50 text-ocean-600 flex items-center justify-center border border-ocean-200/60 shadow-2xs shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                {dict.googleDrive.explorerTitle}
              </h1>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{dict.googleDrive.connectedBadge}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sand-100 text-slate-500 border border-sand-200">
                  <span>{dict.googleDrive.disconnectedBadge}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {status?.email ? status.email : dict.googleDrive.cloudStorageDesc}
            </p>
          </div>
        </div>

        {/* Storage Quota Gauge (When connected) */}
        {isConnected && quota && (
          <div className="w-full sm:w-auto sm:text-right shrink-0 sm:min-w-[200px] pt-1 sm:pt-0 border-t sm:border-t-0 border-sand-100">
            <div className="flex items-center sm:justify-end gap-2 text-xs font-semibold text-slate-700">
              <Cloud className="w-3.5 h-3.5 text-ocean-600" />
              <span>{quotaUsageText}</span>
            </div>
            <div className="w-full sm:w-48 h-2 bg-sand-100 rounded-full overflow-hidden mt-1.5 border border-sand-200/60">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  quotaPercent > 90 ? 'bg-rose-500' : quotaPercent > 75 ? 'bg-amber-500' : 'bg-ocean-500'
                }`}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* 2. Main Body Content */}
      {!isConnected ? (
        <DriveEmptyState
          type="not_connected"
          onConnect={connectGoogleDrive}
          isConnecting={isConnecting}
        />
      ) : (
        <main className="space-y-4">
          {/* Breadcrumb Trail Navigation */}
          <DriveBreadcrumbs
            trail={trail}
            onNavigateToCrumb={navigateToCrumb}
            onNavigateUp={navigateUp}
            isLoading={isLoadingFiles}
          />

          {/* Action & Filter Toolbar */}
          <DriveToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onUploadClick={() => setIsUploadOpen(true)}
            onNewFolderClick={() => setIsNewFolderOpen(true)}
            onRefreshClick={refreshFiles}
            isLoading={isLoadingFiles}
            counts={counts}
          />

          {/* Grouped Files & Folders Presentation */}
          <DriveFileList
            entries={filteredFiles}
            viewMode={viewMode}
            cloudAssetMap={cloudAssetMap}
            isLoading={isLoadingFiles}
            nextPageToken={nextPageToken}
            onLoadMore={loadMoreFiles}
            onOpenFolder={openFolder}
            onDownload={(e) => downloadFile(e.id, e.name, e.mimeType)}
            onPreview={handlePreview}
            onLinkToLesson={handleLinkToLesson}
            onTrash={handleRequestTrash}
            onDeletePermanent={handleRequestDeletePermanent}
            onUploadClick={() => setIsUploadOpen(true)}
            isFiltered={activeFilter !== 'all' || searchQuery.trim().length > 0}
            onClearFilter={() => {
              setActiveFilter('all');
              setSearchQuery('');
            }}
          />
        </main>
      )}

      {/* 3. Modals */}
      <DriveUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        targetFolderName={activeFolderName}
        targetFolderId={activeFolderId}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        onUpload={uploadFile}
      />

      <DriveCreateFolderModal
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        targetFolderName={activeFolderName}
        onCreateFolder={(name) => createFolder(name, activeFolderId)}
      />

      <DriveDeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        entry={deleteTarget?.entry || null}
        isPermanent={deleteTarget?.isPermanent ?? false}
        onConfirm={handleExecuteDelete}
      />

      {/* Faz 7: Media & Audio Preview Modal */}
      <DriveFilePreviewModal
        isOpen={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        entry={previewTarget}
        onLinkToUnit={handleLinkFromPreview}
      />

      {/* Faz 7: Smart Link To Unit Modal */}
      <DriveLinkToUnitModal
        isOpen={!!linkTarget}
        onClose={() => setLinkTarget(null)}
        entry={linkTarget}
        existingMapping={linkTarget ? cloudAssetMap[linkTarget.id] : null}
        onLinkSuccess={handleLinkSuccess}
        onUnlinkSuccess={handleUnlinkSuccess}
      />
    </div>
  );
};
