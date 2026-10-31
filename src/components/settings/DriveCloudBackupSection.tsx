import React, { useState } from 'react';
import {
  Cloud,
  Database,
  FileArchive,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import type { DriveStorageStatus, CloudBackupItem } from '../../types/drive';

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? isoString : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return isoString;
  }
}

export interface DriveCloudBackupSectionProps {
  isConnected: boolean;
  status: DriveStorageStatus | null;
  connectGoogleDrive: () => void;
  latestBackup: CloudBackupItem | null;
  createBackup: () => Promise<void>;
  restoreBackup: (fileId: string) => Promise<void>;
  isBackingUp: boolean;
  isRestoring: boolean;
  checkLatestBackup: () => Promise<void>;
  onOpenManageDrawer: () => void;
  onError: (msg: string) => void;
}

export const DriveCloudBackupSection: React.FC<DriveCloudBackupSectionProps> = ({
  isConnected,
  status,
  connectGoogleDrive,
  latestBackup,
  createBackup,
  restoreBackup,
  isBackingUp,
  isRestoring,
  checkLatestBackup,
  onOpenManageDrawer,
  onError,
}) => {
  const { dict } = useDictionary();
  const [isColdStartDismissed, setIsColdStartDismissed] = useState<boolean>(false);

  const handleRestoreLatest = async () => {
    if (!latestBackup) return;
    try {
      await restoreBackup(latestBackup.id);
      setIsColdStartDismissed(true);
      await checkLatestBackup();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : dict.googleDrive.backupRestoreFailed);
    }
  };

  return (
    <div className="space-y-3">
      {/* Railway Cold-Start Recovery Alert Card */}
      {!isColdStartDismissed && isConnected && latestBackup && (
        <div className="bg-ocean-50/80 p-4 rounded-2xl border border-ocean-200 shadow-2xs space-y-3 animate-fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-ocean-100 text-ocean-700 shrink-0 mt-0.5">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-ocean-950 flex items-center gap-1.5">
                  <span>{dict.googleDrive.coldStartAlertTitle}</span>
                </h4>
                <p className="text-[11px] text-ocean-800 leading-relaxed">
                  {dict.googleDrive.coldStartAlertDesc}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-ocean-700/80 font-mono pt-0.5">
                  <span className="font-sans font-bold">{dict.googleDrive.lastBackupDate}</span>
                  <span>{formatDate(latestBackup.modifiedTime || latestBackup.createdTime)}</span>
                  <span>•</span>
                  <span>{formatBytes(latestBackup.size)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsColdStartDismissed(true)}
              className="text-ocean-400 hover:text-ocean-700 p-1 cursor-pointer"
              title={dict.googleDrive.coldStartDismissButton}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-ocean-200/60">
            <button
              type="button"
              onClick={() => setIsColdStartDismissed(true)}
              className="px-3 py-1.5 text-xs font-bold text-ocean-700 hover:text-ocean-900 cursor-pointer"
            >
              {dict.googleDrive.coldStartDismissButton}
            </button>
            <button
              type="button"
              onClick={handleRestoreLatest}
              disabled={isRestoring}
              className="min-h-[34px] px-3.5 py-1.5 bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-bold rounded-xl shadow-2xs hover:shadow-soft transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              {isRestoring ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              <span>
                {isRestoring
                  ? dict.googleDrive.restoringBackupState
                  : dict.googleDrive.coldStartRestoreButton}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Google Drive Cloud Backup Integration Section */}
      <div className="bg-sand-50/60 p-4 rounded-2xl border border-sand-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-sand-200/80">
          <div className="space-y-0.5">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-ocean-600" />
              <span>{dict.googleDrive.cloudBackupCardTitle}</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              {dict.googleDrive.cloudBackupCardSubtitle}
            </p>
          </div>

          {/* Honest Google Drive Status Badge */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="truncate max-w-[140px]">{status?.email || dict.googleDrive.connectedBadge}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={connectGoogleDrive}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-sand-100 hover:bg-sand-200 text-slate-700 border border-sand-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer active:scale-95"
              >
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>{dict.googleDrive.connectButton}</span>
              </button>
            )}
          </div>
        </div>

        {isConnected ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Quick Backup Action */}
            <button
              type="button"
              onClick={createBackup}
              disabled={isBackingUp}
              className="min-h-[42px] px-3.5 py-2 bg-white hover:bg-ocean-50/50 text-slate-700 hover:text-ocean-700 border border-sand-200 hover:border-ocean-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-between shadow-2xs active:scale-98 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                {isBackingUp ? (
                  <Loader2 className="w-4 h-4 text-ocean-600 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 text-ocean-600" />
                )}
                <span>
                  {isBackingUp
                    ? dict.googleDrive.creatingBackupState
                    : dict.googleDrive.quickBackupButton}
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400">Zero-Transfer</span>
            </button>

            {/* Manage Cloud Backups (Opens Drawer) */}
            <button
              type="button"
              onClick={onOpenManageDrawer}
              className="min-h-[42px] px-3.5 py-2 bg-ocean-50 hover:bg-ocean-100 text-ocean-700 hover:text-ocean-900 border border-ocean-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-between shadow-2xs active:scale-98"
            >
              <div className="flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-ocean-600" />
                <span>{dict.googleDrive.manageBackupsButton}</span>
              </div>
              <Clock className="w-3.5 h-3.5 text-ocean-400" />
            </button>
          </div>
        ) : (
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{dict.googleDrive.notConnectedWarning}</span>
            </div>
            <button
              type="button"
              onClick={connectGoogleDrive}
              className="min-h-[32px] px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer shrink-0 active:scale-95"
            >
              {dict.googleDrive.connectButton}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
