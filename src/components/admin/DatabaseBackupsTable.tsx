import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Archive,
  Plus,
  Download,
  RotateCcw,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileArchive,
  ShieldCheck,
  Scissors,
  Copy,
  Check,
  Search,
  X,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import {
  getDbBackups,
  createDbBackup,
  downloadBackupFile,
  pruneDbBackups,
} from '../../services/adminSystemApi';
import { formatBytes, formatRelativeTime } from '../../utils/formatters';
import type { DbBackupItem } from '../../types';
import { BackupRestoreConfirmModal } from './BackupRestoreConfirmModal';
import { BackupDeleteConfirmModal } from './BackupDeleteConfirmModal';
import { toast } from 'sonner';

export interface DatabaseBackupsTableProps {
  className?: string;
  onBackupRestored?: () => void;
}

export const DatabaseBackupsTable: React.FC<DatabaseBackupsTableProps> = ({
  className = '',
  onBackupRestored,
}) => {
  const { dict } = useDictionary();
  const [backups, setBackups] = useState<DbBackupItem[]>([]);
  const [totalStorageBytes, setTotalStorageBytes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isPruning, setIsPruning] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [copiedFilename, setCopiedFilename] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [restoringBackup, setRestoringBackup] = useState<DbBackupItem | null>(null);
  const [deletingBackup, setDeletingBackup] = useState<DbBackupItem | null>(null);

  const fetchBackups = useCallback(
    async (silent = false) => {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        const res = await getDbBackups();
        setBackups(res.backups || []);
        setTotalStorageBytes(res.totalSizeBytes || 0);
      } catch (err: any) {
        const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
        const msg = `${err?.message || dict.systemMaintenance.backupsTitle}${statusText}`;
        setErrorMessage(msg);
        if (!silent) {
          toast.error(msg);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [dict.systemMaintenance.backupsTitle]
  );

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    setErrorMessage(null);

    try {
      await createDbBackup();
      toast.success(dict.systemMaintenance.backupCreatedSuccess);
      await fetchBackups(true);
    } catch (err: any) {
      const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
      const msg = `${err?.message || dict.systemMaintenance.createBackupButton}${statusText}`;
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePruneOldBackups = async () => {
    setIsPruning(true);
    setErrorMessage(null);

    try {
      const result = await pruneDbBackups({ keepLatest: 5 });
      const desc = dict.systemMaintenance.pruneSuccessDesc
        .replace('{count}', String(result.deletedCount))
        .replace('{size}', formatBytes(result.reclaimedBytes));
      toast.success(desc);
      await fetchBackups(true);
    } catch (err: any) {
      const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
      const msg = `${err?.message || dict.systemMaintenance.pruneOldBackupsButton}${statusText}`;
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsPruning(false);
    }
  };

  const handleDownload = async (filename: string) => {
    setDownloadingFile(filename);
    try {
      await downloadBackupFile(filename);
    } catch (err: any) {
      const msg = err?.message || dict.systemMaintenance.downloadBackupAction;
      toast.error(msg);
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleCopyFilename = async (filename: string) => {
    try {
      await navigator.clipboard.writeText(filename);
      setCopiedFilename(filename);
      toast.success(dict.systemMaintenance.detailsCopiedSuccess);
      setTimeout(() => setCopiedFilename(null), 2000);
    } catch {
      // Ignore clipboard write failures
    }
  };

  const handleRestoredSuccess = () => {
    fetchBackups(true);
    if (onBackupRestored) {
      onBackupRestored();
    }
  };

  const handleDeletedSuccess = (filename: string) => {
    setBackups((prev) => prev.filter((b) => b.filename !== filename));
  };

  // Filtered backups based on search query
  const filteredBackups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return backups;
    return backups.filter((b) => b.filename.toLowerCase().includes(q));
  }, [backups, searchQuery]);

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col gap-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                {dict.systemMaintenance.backupsTitle}
              </h3>
              {backups.length > 0 && (
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                  {dict.systemMaintenance.totalBackupsStorageLabel
                    .replace('{count}', String(backups.length))
                    .replace('{size}', formatBytes(totalStorageBytes))}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {dict.systemMaintenance.backupsSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Prune old backups (when more than 5 exist) */}
          {backups.length > 5 && (
            <button
              type="button"
              onClick={handlePruneOldBackups}
              disabled={isPruning || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
              title={dict.systemMaintenance.pruneOldBackupsButton}
            >
              {isPruning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              ) : (
                <Scissors className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>{dict.systemMaintenance.pruneOldBackupsButton}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchBackups(true)}
            disabled={isLoading || isRefreshing || isCreating || isPruning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
            title={dict.systemMaintenance.refreshLogsButton}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>{dict.systemMaintenance.refreshLogsButton}</span>
          </button>

          <button
            type="button"
            onClick={handleCreateBackup}
            disabled={isCreating || isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-ocean-600 hover:bg-ocean-700 active:bg-ocean-800 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{dict.systemMaintenance.creatingBackup}</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>{dict.systemMaintenance.createBackupButton}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fail-Loud Error Alert */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Safety Notice & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-2.5 bg-slate-50/70 border border-slate-200/60 rounded-xl text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-ocean-600 shrink-0" />
          <span>{dict.systemMaintenance.emergencyBackupNotice}</span>
        </div>

        {backups.length > 3 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={dict.systemMaintenance.backupFilenameHeader}
              className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && backups.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-slate-400">
          <Loader2 className="w-6 h-6 text-ocean-600 animate-spin" />
          <p className="text-xs font-medium">{dict.userManagement.loadingUsers}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && backups.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-center">
          <FileArchive className="w-10 h-10 text-slate-300 mb-1" />
          <p className="text-xs font-semibold text-slate-700">
            {dict.systemMaintenance.backupsListTitle}
          </p>
          <p className="text-xs text-slate-400 max-w-sm">
            {dict.systemMaintenance.backupsSubtitle}
          </p>
        </div>
      )}

      {/* Backups Table */}
      {backups.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">{dict.systemMaintenance.backupFilenameHeader}</th>
                <th className="py-3 px-4">{dict.systemMaintenance.backupSizeHeader}</th>
                <th className="py-3 px-4">{dict.systemMaintenance.backupDateHeader}</th>
                <th className="py-3 px-4 text-right">{dict.systemMaintenance.backupActionsHeader}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBackups.map((item) => {
                const isCopied = copiedFilename === item.filename;

                return (
                  <tr
                    key={item.filename}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono font-medium text-slate-900 truncate max-w-[240px]"
                          title={item.filename}
                        >
                          {item.filename}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyFilename(item.filename)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity p-0.5 rounded"
                          title={dict.systemMaintenance.copyDetailsAction}
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">
                      {formatBytes(item.sizeBytes)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatRelativeTime(item.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* Download Action */}
                        <button
                          type="button"
                          onClick={() => handleDownload(item.filename)}
                          disabled={downloadingFile === item.filename}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors disabled:opacity-50"
                          title={dict.systemMaintenance.downloadBackupAction}
                        >
                          {downloadingFile === item.filename ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-ocean-600" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>{dict.systemMaintenance.downloadBackupAction}</span>
                        </button>

                        {/* Restore Action */}
                        <button
                          type="button"
                          onClick={() => setRestoringBackup(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-md transition-colors"
                          title={dict.systemMaintenance.restoreBackupAction}
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                          <span>{dict.systemMaintenance.restoreBackupAction}</span>
                        </button>

                        {/* Delete Action */}
                        <button
                          type="button"
                          onClick={() => setDeletingBackup(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-md transition-colors"
                          title={dict.systemMaintenance.deleteBackupAction}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>{dict.systemMaintenance.deleteBackupAction}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Restore Confirm Modal */}
      <BackupRestoreConfirmModal
        isOpen={Boolean(restoringBackup)}
        onClose={() => setRestoringBackup(null)}
        backup={restoringBackup}
        onRestored={handleRestoredSuccess}
      />

      {/* Delete Confirm Modal */}
      <BackupDeleteConfirmModal
        isOpen={Boolean(deletingBackup)}
        onClose={() => setDeletingBackup(null)}
        backup={deletingBackup}
        onDeleted={handleDeletedSuccess}
      />
    </div>
  );
};
