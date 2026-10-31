/**
 * Eidos Language OS - Drive File & Folder Card
 * Adaptive presentation (Grid / List) for Google Drive files and directories.
 * Provides file type iconography, metadata, download, preview, and deletion actions.
 * STRICTLY LIGHT THEME & ZERO HARDCODE.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  Music,
  FileText,
  Archive,
  File as FileIcon,
  Download,
  Trash2,
  ExternalLink,
  MoreVertical,
  Play,
  Link2,
  CheckCircle2,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { formatBytes, formatRelativeTime } from '../../utils/formatters';
import { formatCloudAssetBadgeText } from '../../utils/driveFileNameParser';
import type { DriveEntry, UnitCloudAsset } from '../../types/drive';

export interface DriveFileCardProps {
  entry: DriveEntry;
  viewMode: 'grid' | 'list';
  cloudAsset?: UnitCloudAsset;
  onOpenFolder: (folderId: string, folderName: string) => void;
  onDownload: (entry: DriveEntry) => void;
  onPreview?: (entry: DriveEntry) => void;
  onLinkToLesson?: (entry: DriveEntry) => void;
  onTrash: (entry: DriveEntry) => void;
  onDeletePermanent: (entry: DriveEntry) => void;
  className?: string;
}

export const DriveFileCard: React.FC<DriveFileCardProps> = ({
  entry,
  viewMode,
  cloudAsset,
  onOpenFolder,
  onDownload,
  onPreview,
  onLinkToLesson,
  onTrash,
  onDeletePermanent,
  className = '',
}) => {
  const { dict } = useDictionary();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleCardClick = () => {
    if (entry.isFolder) {
      onOpenFolder(entry.id, entry.name);
    } else if (onPreview && (entry.isAudio || entry.isTranscript)) {
      onPreview(entry);
    }
  };

  // Render type-specific iconography
  const renderIcon = (sizeClass: string = 'w-6 h-6') => {
    if (entry.isFolder) {
      return <Folder className={`${sizeClass} text-amber-500 fill-amber-100/70`} />;
    }
    if (entry.isAudio) {
      return <Music className={`${sizeClass} text-ocean-600 fill-ocean-100/70`} />;
    }
    if (entry.isTranscript) {
      return <FileText className={`${sizeClass} text-emerald-600 fill-emerald-100/70`} />;
    }
    if (entry.isBackup) {
      return <Archive className={`${sizeClass} text-violet-600 fill-violet-100/70`} />;
    }
    return <FileIcon className={`${sizeClass} text-slate-400 fill-slate-100/70`} />;
  };

  const formattedSize = entry.size ? formatBytes(Number(entry.size)) : '';
  const formattedDate = formatRelativeTime(entry.modifiedTime);

  // ============================================================================
  // GRID VIEW PRESENTATION
  // ============================================================================
  if (viewMode === 'grid') {
    return (
      <div
        className={`group relative flex flex-col justify-between bg-white border border-sand-200/90 hover:border-ocean-300 rounded-2xl p-3 sm:p-4 shadow-2xs hover:shadow-soft transition-all duration-200 select-none ${className}`}
      >
        {/* Main Clickable Area */}
        <div
          onClick={handleCardClick}
          className="flex-1 cursor-pointer flex flex-col min-w-0"
        >
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="p-2.5 bg-sand-50/80 group-hover:bg-ocean-50/60 rounded-xl transition-colors border border-sand-200/50">
              {renderIcon('w-7 h-7 sm:w-8 sm:h-8')}
            </div>

            {/* Menu Trigger Button */}
            <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={dict.googleDrive.actionsLabel}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-sand-100 rounded-lg transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Action Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-7 z-30 w-44 bg-white border border-sand-200 rounded-xl shadow-soft-lg py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                  {!entry.isFolder && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onDownload(entry);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-sand-50 cursor-pointer font-medium"
                      >
                        <Download className="w-3.5 h-3.5 text-ocean-600" />
                        <span>{dict.googleDrive.downloadAction}</span>
                      </button>
                      {onPreview && (entry.isAudio || entry.isTranscript) && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onPreview(entry);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-sand-50 cursor-pointer font-medium"
                        >
                          <Play className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{dict.googleDrive.previewAction}</span>
                        </button>
                      )}
                      {onLinkToLesson && (entry.isAudio || entry.isTranscript) && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onLinkToLesson(entry);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-sand-50 cursor-pointer font-medium"
                        >
                          <Link2 className="w-3.5 h-3.5 text-amber-600" />
                          <span>{dict.googleDrive.linkToLessonAction}</span>
                        </button>
                      )}
                    </>
                  )}
                  {entry.webViewLink && (
                    <a
                      href={entry.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-sand-50 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span>{dict.googleDrive.openInDriveAction}</span>
                    </a>
                  )}
                  <div className="border-t border-sand-100 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onTrash(entry);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-amber-700 hover:bg-amber-50 cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>{dict.googleDrive.moveToTrashAction}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDeletePermanent(entry);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-700 hover:bg-rose-50 cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>{dict.googleDrive.permanentDeleteAction}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Name & Title */}
          <h4
            title={entry.name}
            className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-ocean-700 line-clamp-2 leading-tight mb-2 break-words"
          >
            {entry.name}
          </h4>

          {/* Unit Cloud Link Badge */}
          {cloudAsset && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-ocean-50 text-ocean-700 border border-ocean-200/80 shadow-2xs max-w-full truncate">
                <CheckCircle2 className="w-3 h-3 text-ocean-600 shrink-0" />
                <span className="truncate">{formatCloudAssetBadgeText(cloudAsset, dict)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className="pt-2 border-t border-sand-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">{formattedSize || (entry.isFolder ? dict.googleDrive.filterFolders : '')}</span>
          <span className="shrink-0">{formattedDate}</span>
        </div>
      </div>
    );
  }

  // ============================================================================
  // LIST VIEW PRESENTATION
  // ============================================================================
  return (
    <div
      className={`group flex items-center justify-between gap-3 bg-white border border-sand-200/90 hover:border-ocean-300 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-2xs hover:shadow-soft transition-all select-none ${className}`}
    >
      {/* Icon & File Info */}
      <div
        onClick={handleCardClick}
        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
      >
        <div className="p-2 bg-sand-50/80 group-hover:bg-ocean-50/60 rounded-xl transition-colors border border-sand-200/50 shrink-0">
          {renderIcon('w-5 h-5')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              title={entry.name}
              className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-ocean-700 truncate"
            >
              {entry.name}
            </h4>
            {cloudAsset && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-ocean-50 text-ocean-700 border border-ocean-200/80 shadow-2xs shrink-0 max-w-[200px] truncate">
                <CheckCircle2 className="w-3 h-3 text-ocean-600 shrink-0" />
                <span className="truncate">{formatCloudAssetBadgeText(cloudAsset, dict)}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            {formattedSize && <span>{formattedSize}</span>}
            {formattedSize && <span>•</span>}
            <span>{formattedDate}</span>
            {cloudAsset && (
              <span className="md:hidden inline-flex items-center gap-1 text-[10px] text-ocean-700 font-semibold truncate">
                • {formatCloudAssetBadgeText(cloudAsset, dict)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Row Quick Action Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {!entry.isFolder && onPreview && (entry.isAudio || entry.isTranscript) && (
          <button
            type="button"
            onClick={() => onPreview(entry)}
            aria-label={dict.googleDrive.previewAction}
            title={dict.googleDrive.previewAction}
            className="p-1.5 sm:p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4" />
          </button>
        )}
        {!entry.isFolder && (
          <button
            type="button"
            onClick={() => onDownload(entry)}
            aria-label={dict.googleDrive.downloadAction}
            title={dict.googleDrive.downloadAction}
            className="p-1.5 sm:p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-ocean-700 hover:bg-ocean-50 rounded-lg transition-colors cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Overflow Menu Trigger */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={dict.googleDrive.actionsLabel}
            className="p-1.5 sm:p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-sand-100 rounded-lg transition-colors cursor-pointer active:scale-95"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-8 z-30 w-44 bg-white border border-sand-200 rounded-xl shadow-soft-lg py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
              {!entry.isFolder && onPreview && (entry.isAudio || entry.isTranscript) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onPreview(entry);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-sand-50 cursor-pointer font-medium"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{dict.googleDrive.previewAction}</span>
                </button>
              )}
              {!entry.isFolder && onLinkToLesson && (entry.isAudio || entry.isTranscript) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLinkToLesson(entry);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-sand-50 cursor-pointer font-medium"
                >
                  <Link2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>{dict.googleDrive.linkToLessonAction}</span>
                </button>
              )}
              {entry.webViewLink && (
                <a
                  href={entry.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-sand-50 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>{dict.googleDrive.openInDriveAction}</span>
                </a>
              )}
              <div className="border-t border-sand-100 my-1" />
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onTrash(entry);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-amber-700 hover:bg-amber-50 cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                <span>{dict.googleDrive.moveToTrashAction}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDeletePermanent(entry);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-700 hover:bg-rose-50 cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>{dict.googleDrive.permanentDeleteAction}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
