/**
 * Eidos Language OS - Cloud System Backup & Hot Restore Section
 * Yacht-Deck Premium Light Theme aesthetic (Pure White, Sand/Slate, Ocean Blue, Emerald).
 * Zero Hardcode: All text, buttons, modals, and status badges from dictionary.
 * Fail-Loud: Real HTTP status codes and API errors surfaced via Sonner toasts.
 * 360dp Mobile Ergonomics: >= 44px tap targets, responsive layout without horizontal overflows.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Archive,
  Download,
  RotateCcw,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Database,
  Calendar,
  HardDrive,
  Users,
  BookOpen,
  Award,
  Cloud,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDictionary } from '../../context/DictionaryContext';
import { Modal } from '../common/Modal';
import {
  createCloudBackup,
  listCloudBackups,
  getLatestCloudBackup,
  restoreCloudBackup,
  downloadDriveFile,
  type CloudBackupItem,
  type LatestBackupResult,
  type BackupStats,
} from '../../services/driveApiClient';

export interface CloudBackupSectionProps {
  className?: string;
  onBackupSuccess?: () => void;
  onRestoreSuccess?: () => void;
}

export const CloudBackupSection: React.FC<CloudBackupSectionProps> = ({
  className = '',
  onBackupSuccess,
  onRestoreSuccess,
}) => {
  const { dict } = useDictionary();

  const [latest, setLatest] = useState<LatestBackupResult | null>(null);
  const [backups, setBackups] = useState<CloudBackupItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showList, setShowList] = useState<boolean>(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<CloudBackupItem | null>(null);

  // Helper to format byte counts into human-readable representation
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  // Helper to format ISO timestamp cleanly
  const formatDate = (isoString?: string): string => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  // Loads latest backup metadata and full backup list from Google Drive
  const loadBackups = useCallback(async () => {
    setIsLoading(true);
    try {
      const [latestRes, listRes] = await Promise.all([
        getLatestCloudBackup(),
        listCloudBackups(),
      ]);
      setLatest(latestRes);
      setBackups(listRes.backups || []);
    } catch (err: any) {
      console.error('[CloudBackupSection] Failed to load backups:', err);
      toast.error(dict.googleDrive.connectionError, {
        description: err?.message || String(err),
      });
    } finally {
      setIsLoading(false);
    }
  }, [dict.googleDrive.connectionError]);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  // Triggers atomic snapshot and zero-transfer upload to Google Drive
  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const res = await createCloudBackup();
      toast.success(res.message || dict.googleDrive.backupCreatedSuccess, {
        description: `${res.fileName} (${formatBytes(res.fileSize)})`,
      });
      await loadBackups();
      onBackupSuccess?.();
    } catch (err: any) {
      console.error('[CloudBackupSection] Create backup error:', err);
      toast.error(dict.googleDrive.backupInProgress, {
        description: err?.message || String(err),
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Triggers Hot Restore protocol with live DB swap
  const handleConfirmRestore = async () => {
    if (!selectedBackupForRestore) return;
    setIsRestoring(true);
    try {
      const res = await restoreCloudBackup(selectedBackupForRestore.id);
      setSelectedBackupForRestore(null);
      toast.success(res.message || dict.googleDrive.backupRestoreSuccess, {
        description: `${dict.googleDrive.statsUsers}: ${res.stats.usersCount}, ${dict.googleDrive.statsVocab}: ${res.stats.vocabularyCount}, ${dict.googleDrive.statsProgress}: ${res.stats.progressCount}`,
      });
      await loadBackups();
      onRestoreSuccess?.();
    } catch (err: any) {
      console.error('[CloudBackupSection] Restore error:', err);
      toast.error(dict.googleDrive.backupRestoreFailed, {
        description: err?.message || String(err),
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Downloads backup zip archive directly to user device
  const handleDownload = async (backup: CloudBackupItem) => {
    setDownloadingId(backup.id);
    try {
      await downloadDriveFile(backup.id, backup.name, 'application/zip');
      toast.success(dict.settings.savedSuccess, {
        description: backup.name,
      });
    } catch (err: any) {
      console.error('[CloudBackupSection] Download error:', err);
      toast.error(dict.googleDrive.downloadFailed, {
        description: err?.message || String(err),
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className={`space-y-3 pt-2 ${className}`}>
      {/* Header & Quick Action Row */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-ocean-50/40 via-white to-sand-50/60 border border-sand-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-ocean-100/70 border border-ocean-200 flex items-center justify-center text-ocean-700 shadow-2xs shrink-0 mt-0.5">
              <Archive className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {dict.googleDrive.backupPanelTitle}
                </h4>
                {backups.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-ocean-50 text-ocean-700 border border-ocean-200">
                    {backups.length}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                {dict.googleDrive.taxonomyFoldersSummary}
              </p>
            </div>
          </div>

          {/* Create Backup Button (Responsive tap target >= 44px) */}
          <button
            type="button"
            onClick={handleCreateBackup}
            disabled={isCreating || isRestoring}
            className="min-h-[44px] w-full sm:w-auto px-4 py-2 bg-ocean-600 hover:bg-ocean-700 active:bg-ocean-800 text-white font-bold text-xs rounded-xl shadow-2xs hover:shadow-soft transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{dict.googleDrive.creatingBackupState}</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                <span>{dict.googleDrive.createBackupButton}</span>
              </>
            )}
          </button>
        </div>

        {/* Latest Backup Details Banner */}
        <div className="mt-3.5 pt-3 border-t border-sand-100">
          {isLoading ? (
            <div className="py-2 flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-ocean-600" />
              <span>{dict.globalPlayer.buffering}</span>
            </div>
          ) : latest?.hasBackup && latest.latestBackup ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-slate-700 block truncate">
                    {dict.googleDrive.latestBackupLabel}:{' '}
                    <span className="font-bold text-slate-900">
                      {latest.latestBackup.name}
                    </span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(latest.latestBackup.modifiedTime)}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <HardDrive className="w-3 h-3 text-slate-400" />
                      {formatBytes(latest.latestBackup.size)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Latest Backup */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(latest.latestBackup!)}
                  disabled={downloadingId === latest.latestBackup.id}
                  title={dict.googleDrive.downloadBackupAction}
                  className="min-h-[38px] p-2 bg-white hover:bg-ocean-50 active:bg-ocean-100 text-slate-600 hover:text-ocean-700 border border-sand-200 rounded-xl transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
                >
                  {downloadingId === latest.latestBackup.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBackupForRestore(latest.latestBackup!)}
                  disabled={isRestoring || isCreating}
                  className="min-h-[38px] px-3 py-1.5 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 border border-amber-200/90 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>{dict.googleDrive.restoreBackupAction}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-1 text-xs text-slate-400 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>{dict.googleDrive.noBackupsYet}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expandable History Toggle Button */}
      {backups.length > 1 && (
        <div>
          <button
            type="button"
            onClick={() => setShowList((prev) => !prev)}
            className="w-full min-h-[38px] px-3.5 py-2 bg-sand-50/70 hover:bg-sand-100 active:bg-sand-200 border border-sand-200/80 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between transition-all cursor-pointer shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
          >
            <span className="flex items-center gap-1.5">
              <Archive className="w-3.5 h-3.5 text-ocean-600" />
              <span>
                {showList
                  ? dict.googleDrive.hideBackupsButton
                  : `${dict.googleDrive.viewBackupsButton} (${backups.length})`}
              </span>
            </span>
            {showList ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Backup History Table */}
          {showList && (
            <div className="mt-2 p-2 bg-white rounded-xl border border-sand-200/90 shadow-2xs space-y-1.5 max-h-60 overflow-y-auto">
              {backups.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-lg bg-sand-50/50 hover:bg-sand-100/60 border border-sand-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-800 block truncate" title={b.name}>
                      {b.name}
                    </span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span>{formatDate(b.modifiedTime)}</span>
                      <span className="font-mono">{formatBytes(b.size)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownload(b)}
                      disabled={downloadingId === b.id}
                      title={dict.googleDrive.downloadBackupAction}
                      className="p-1.5 bg-white hover:bg-ocean-50 text-slate-600 hover:text-ocean-700 border border-sand-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {downloadingId === b.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBackupForRestore(b)}
                      disabled={isRestoring || isCreating}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-700" />
                      <span>{dict.googleDrive.restoreBackupAction}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hot Restore Safety Confirmation Modal */}
      <Modal
        isOpen={!!selectedBackupForRestore}
        onClose={() => setSelectedBackupForRestore(null)}
        title={dict.googleDrive.restoreConfirmTitle}
        subtitle={selectedBackupForRestore?.name || ''}
        icon={<RotateCcw className="w-4 h-4 text-amber-600" />}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 font-medium leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>{dict.googleDrive.restoreConfirmMessage}</p>
          </div>

          {selectedBackupForRestore && (
            <div className="p-3 rounded-xl bg-sand-50/70 border border-sand-200/80 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{dict.googleDrive.latestBackupLabel}:</span>
                <span className="font-bold text-slate-900 font-mono text-[11px] truncate max-w-[200px]">
                  {selectedBackupForRestore.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{dict.accountSettings.memberSinceLabel}:</span>
                <span className="font-semibold text-slate-700">
                  {formatDate(selectedBackupForRestore.modifiedTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{dict.googleDrive.quotaUsageLabel}:</span>
                <span className="font-mono font-semibold text-slate-700">
                  {formatBytes(selectedBackupForRestore.size)}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedBackupForRestore(null)}
              disabled={isRestoring}
              className="min-h-[44px] px-4 py-2 bg-sand-100 hover:bg-sand-200 active:bg-sand-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40 active:scale-[0.98]"
            >
              {dict.googleDrive.restoreCancelAction}
            </button>
            <button
              type="button"
              onClick={handleConfirmRestore}
              disabled={isRestoring}
              className="min-h-[44px] px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-2xs hover:shadow-soft transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            >
              {isRestoring && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {isRestoring
                  ? dict.googleDrive.restoringBackupState
                  : dict.googleDrive.restoreConfirmAction}
              </span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
