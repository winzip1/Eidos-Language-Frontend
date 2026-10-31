/**
 * Eidos Language OS - Offline Audio Download Indicator
 * Displays real-time download status, offline readiness badge, and cache management popover.
 *
 * Rules Adherence:
 * - ZERO HARDCODE: All strings & labels from dict.offlineCache.
 * - NO MOCK DATA: Renders real downloaded bytes and progress percent only.
 * - STRICT LIGHT THEME: Pure whites, soft slate borders, yacht deck simplicity, zero `dark:` classes.
 * - MODULAR: Self-contained component with accessible keyboard & touch interactions.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Download, CheckCircle2, Loader2, Trash2, HardDrive } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { audioCacheService } from '../../services/audioCacheService';
import { useCourse } from '../../context/CourseContext';

export interface OfflineDownloadIndicatorProps {
  className?: string;
  compact?: boolean;
}

export const OfflineDownloadIndicator: React.FC<OfflineDownloadIndicatorProps> = ({
  className = '',
  compact = false,
}) => {
  const { dict } = useDictionary();
  const { activeCourse } = useCourse();
  const {
    unitNumber,
    isOfflineCached,
    isDownloadingAudio,
    downloadProgress,
    cacheUnitForOffline,
    deleteUnitOfflineCache,
  } = usePlayer();

  const [isOpen, setIsOpen] = useState(false);
  const [cachedSizeBytes, setCachedSizeBytes] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Close popover on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerButtonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Load cached file size when popover opens or unit cache status changes
  useEffect(() => {
    let isMounted = true;
    if (isOfflineCached && unitNumber && activeCourse?.courseId) {
      audioCacheService.getMetadata(activeCourse.courseId, unitNumber).then((meta) => {
        if (isMounted) {
          setCachedSizeBytes(meta?.sizeBytes ?? null);
        }
      });
    } else {
      setCachedSizeBytes(null);
    }
    return () => {
      isMounted = false;
    };
  }, [isOfflineCached, unitNumber, activeCourse]);

  if (!unitNumber) return null;

  const handleToggleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloadingAudio) return;
    if (isOfflineCached) {
      setIsOpen((prev) => !prev);
    } else {
      await cacheUnitForOffline(unitNumber);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await deleteUnitOfflineCache(unitNumber);
      setIsOpen(false);
      triggerButtonRef.current?.focus();
    } finally {
      setIsDeleting(false);
    }
  };

  const formatMb = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1);
  };

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={popoverRef}>
      {isDownloadingAudio ? (
        <div
          className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl sm:rounded-2xl bg-ocean-50 border border-ocean-200 text-ocean-800 text-xs font-bold animate-pulse shadow-2xs select-none"
          role="status"
          aria-live="polite"
          title={
            downloadProgress && downloadProgress.totalBytes > 0
              ? `%${downloadProgress.progressPercent} (${formatMb(downloadProgress.downloadedBytes)} MB)`
              : dict.offlineCache.cacheDownloading
          }
          aria-label={
            downloadProgress && downloadProgress.totalBytes > 0
              ? `%${downloadProgress.progressPercent}`
              : dict.offlineCache.cacheDownloading
          }
        >
          <Loader2 className="w-4 h-4 animate-spin text-ocean-600 shrink-0" />
          {!compact && (
            <span className="hidden md:inline truncate max-w-[140px]">
              {downloadProgress && downloadProgress.totalBytes > 0
                ? `%${downloadProgress.progressPercent}`
                : dict.offlineCache.cacheDownloading}
            </span>
          )}
        </div>
      ) : isOfflineCached ? (
        <button
          ref={triggerButtonRef}
          type="button"
          onClick={handleToggleDownload}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl sm:rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          title={dict.offlineCache.cacheReadyOffline}
          aria-label={dict.offlineCache.cacheReadyOffline}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {!compact && (
            <span className="hidden md:inline truncate">
              {dict.offlineCache.cachedBadge}
            </span>
          )}
        </button>
      ) : (
        <button
          ref={triggerButtonRef}
          type="button"
          onClick={handleToggleDownload}
          className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl sm:rounded-2xl bg-white hover:bg-sand-50 text-slate-700 hover:text-slate-900 border border-sand-200 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/50"
          title={dict.offlineCache.downloadForOffline}
          aria-label={dict.offlineCache.downloadForOffline}
        >
          <Download className="w-4 h-4 text-slate-500 shrink-0" />
          {!compact && (
            <span className="hidden md:inline truncate">
              {dict.offlineCache.downloadForOffline}
            </span>
          )}
        </button>
      )}

      {/* Popover Details Menu for Cached Unit */}
      {isOpen && isOfflineCached && (
        <div
          role="dialog"
          aria-label={dict.offlineCache.cacheReadyOffline}
          className="absolute right-0 top-full mt-2 w-64 bg-white border border-sand-200 rounded-2xl shadow-xl p-3.5 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150 space-y-2.5"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-sand-100">
            <HardDrive className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-extrabold text-slate-900 truncate">
              {dict.offlineCache.cacheReadyOffline}
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            {cachedSizeBytes !== null && cachedSizeBytes > 0 && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">{dict.offlineCache.cacheSize}:</span>
                <span className="font-mono font-bold text-slate-900">{formatMb(cachedSizeBytes)} MB</span>
              </div>
            )}
            <div className="text-[11px] text-slate-500 bg-sand-50/80 p-2 rounded-xl border border-sand-200/80 leading-relaxed">
              {dict.offlineCache.retentionNotice}
            </div>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/90 text-xs font-bold transition-all disabled:opacity-50 active:scale-95 cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>{dict.offlineCache.clearCache}</span>
          </button>
        </div>
      )}
    </div>
  );
};
