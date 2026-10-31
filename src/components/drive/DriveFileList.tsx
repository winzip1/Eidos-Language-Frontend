/**
 * Eidos Language OS - Drive File List & Folder Grouping
 * Organizes Google Drive content into grouped sections (Folders top, Files bottom).
 * Provides responsive grid/list switching, pagination (load more), and loading skeletons.
 * STRICTLY LIGHT THEME & ZERO HARDCODE.
 */
import React from 'react';
import { Folder, File, Loader2 } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { DriveFileCard } from './DriveFileCard';
import { DriveEmptyState } from './DriveEmptyState';
import type { DriveEntry, UnitCloudAsset } from '../../types/drive';

export interface DriveFileListProps {
  entries: DriveEntry[];
  viewMode: 'grid' | 'list';
  cloudAssetMap?: Record<string, UnitCloudAsset>;
  isLoading: boolean;
  nextPageToken: string | null;
  onLoadMore: () => void;
  onOpenFolder: (folderId: string, folderName: string) => void;
  onDownload: (entry: DriveEntry) => void;
  onPreview?: (entry: DriveEntry) => void;
  onLinkToLesson?: (entry: DriveEntry) => void;
  onTrash: (entry: DriveEntry) => void;
  onDeletePermanent: (entry: DriveEntry) => void;
  onUploadClick: () => void;
  isFiltered?: boolean;
  onClearFilter?: () => void;
  className?: string;
}

export const DriveFileList: React.FC<DriveFileListProps> = ({
  entries,
  viewMode,
  cloudAssetMap,
  isLoading,
  nextPageToken,
  onLoadMore,
  onOpenFolder,
  onDownload,
  onPreview,
  onLinkToLesson,
  onTrash,
  onDeletePermanent,
  onUploadClick,
  isFiltered = false,
  onClearFilter,
  className = '',
}) => {
  const { dict } = useDictionary();

  // Separate folders and files
  const folders = entries.filter((e) => e.isFolder);
  const files = entries.filter((e) => !e.isFolder);

  // ============================================================================
  // LOADING SKELETON (when initial load has 0 items)
  // ============================================================================
  if (isLoading && entries.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="bg-white border border-sand-200/60 rounded-2xl p-4 shadow-2xs animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-sand-100 rounded-xl" />
                <div className="w-4 h-4 bg-sand-100 rounded" />
              </div>
              <div className="h-4 bg-sand-100 rounded w-3/4" />
              <div className="h-3 bg-sand-100 rounded w-1/2 pt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // EMPTY STATE VIEW
  // ============================================================================
  if (entries.length === 0) {
    if (isFiltered) {
      return (
        <DriveEmptyState
          type="no_search_results"
          onClearSearch={onClearFilter}
          className={className}
        />
      );
    }
    return (
      <DriveEmptyState
        type="empty_folder"
        onUpload={onUploadClick}
        className={className}
      />
    );
  }

  const containerClass =
    viewMode === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5'
      : 'space-y-2';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Folders Section */}
      {folders.length > 0 && (
        <section aria-label={dict.googleDrive.foldersSectionTitle} className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {dict.googleDrive.foldersSectionTitle} ({folders.length})
            </span>
          </div>
          <div className={containerClass}>
            {folders.map((entry) => (
              <DriveFileCard
                key={entry.id}
                entry={entry}
                viewMode={viewMode}
                onOpenFolder={onOpenFolder}
                onDownload={onDownload}
                onPreview={onPreview}
                onLinkToLesson={onLinkToLesson}
                onTrash={onTrash}
                onDeletePermanent={onDeletePermanent}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. Files Section */}
      {files.length > 0 && (
        <section aria-label={dict.googleDrive.filesSectionTitle} className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            <File className="w-3.5 h-3.5 text-ocean-600" />
            <span>
              {dict.googleDrive.filesSectionTitle} ({files.length})
            </span>
          </div>
          <div className={containerClass}>
            {files.map((entry) => (
              <DriveFileCard
                key={entry.id}
                entry={entry}
                viewMode={viewMode}
                cloudAsset={cloudAssetMap?.[entry.id]}
                onOpenFolder={onOpenFolder}
                onDownload={onDownload}
                onPreview={onPreview}
                onLinkToLesson={onLinkToLesson}
                onTrash={onTrash}
                onDeletePermanent={onDeletePermanent}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Pagination (Load More Button) */}
      {nextPageToken && (
        <div className="flex justify-center pt-4 pb-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-sand-50 text-slate-700 hover:text-slate-900 border border-sand-200/90 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-soft transition-all active:scale-95 cursor-pointer min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-ocean-600" />
            ) : null}
            <span>{dict.googleDrive.loadMore}</span>
          </button>
        </div>
      )}
    </div>
  );
};
