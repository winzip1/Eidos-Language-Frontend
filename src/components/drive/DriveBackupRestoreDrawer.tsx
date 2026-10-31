import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  RefreshCw,
  X,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileArchive,
  Clock,
  Users,
  BookOpen,
  Sparkles,
  TrendingUp,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { Modal } from '../common/Modal';
import {
  createCloudBackup,
  listCloudBackups,
  restoreCloudBackup,
  type CloudBackupItem,
} from '../../services/driveApiClient';

interface DriveBackupRestoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onBackupCreated?: () => void;
  onBackupRestored?: () => void;
}

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

export const DriveBackupRestoreDrawer: React.FC<DriveBackupRestoreDrawerProps> = ({
  isOpen,
  onClose,
  onBackupCreated,
  onBackupRestored,
}) => {
  const { dict } = useDictionary();
  const [backups, setBackups] = useState<CloudBackupItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [selectedBackup, setSelectedBackup] = useState<CloudBackupItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBackups = useCallback(async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await listCloudBackups();
      setBackups(res.backups || []);
    } catch (err: unknown) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchBackups();
  }, [isOpen, fetchBackups]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRestoring && !isCreating) {
        selectedBackup ? setSelectedBackup(null) : onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isRestoring, isCreating, selectedBackup]);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    setStatusMessage(null);
    try {
      const res = await createCloudBackup();
      setStatusMessage({ type: 'success', text: res.message || dict.googleDrive.backupCreatedSuccess });
      await fetchBackups();
      onBackupCreated?.();
    } catch (err: unknown) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackup) return;
    setIsRestoring(true);
    try {
      const res = await restoreCloudBackup(selectedBackup.id);
      setStatusMessage({ type: 'success', text: res.message || dict.googleDrive.backupRestoreSuccess });
      setSelectedBackup(null);
      await fetchBackups();
      onBackupRestored?.();
    } catch (err: unknown) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-fade-in"
          onClick={() => { if (!isRestoring && !isCreating) onClose(); }}
        />

        <div className="relative w-full max-w-lg bg-white h-full shadow-soft-lg flex flex-col z-10 animate-slide-left border-l border-sand-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-sand-200 bg-sand-50/70 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-ocean-50 text-ocean-700 border border-ocean-100 shadow-2xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">{dict.googleDrive.backupDrawerTitle}</h3>
                <p className="text-[11px] text-slate-400">{dict.googleDrive.backupDrawerSubtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={fetchBackups}
                disabled={isLoading}
                title={dict.googleDrive.refresh}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-sand-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-ocean-600' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                title={dict.googleDrive.closeDrawer}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-sand-200 transition-all cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="p-4 bg-sand-50/30 border-b border-sand-200 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <FileArchive className="w-4 h-4 text-ocean-600" />
              <span>{dict.googleDrive.itemsCount.replace('{count}', String(backups.length))}</span>
            </div>

            <button
              type="button"
              onClick={handleCreateBackup}
              disabled={isCreating}
              className="min-h-[38px] px-3.5 py-1.5 bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-bold rounded-xl shadow-2xs hover:shadow-soft transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              <span>{isCreating ? dict.googleDrive.creatingBackupState : dict.googleDrive.quickBackupButton}</span>
            </button>
          </div>

          {/* Status Message Alert */}
          {statusMessage && (
            <div
              className={`mx-4 mt-3 p-3 rounded-xl border flex items-start justify-between gap-2 text-xs shrink-0 ${
                statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                <span className="leading-relaxed font-medium">{statusMessage.text}</span>
              </div>
              <button type="button" onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Backup List Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading && backups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-ocean-600" />
                <span className="text-xs font-medium">{dict.googleDrive.connectingState}</span>
              </div>
            ) : backups.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-sand-50/50 rounded-2xl border border-dashed border-sand-300 text-center space-y-3">
                <div className="p-3 bg-white rounded-full border border-sand-200 text-slate-400 shadow-2xs">
                  <Database className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700">{dict.googleDrive.noBackupsYet}</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs">{dict.googleDrive.backupDrawerSubtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateBackup}
                  disabled={isCreating}
                  className="min-h-[36px] px-3 py-1.5 bg-ocean-50 hover:bg-ocean-100 text-ocean-700 border border-ocean-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{dict.googleDrive.quickBackupButton}</span>
                </button>
              </div>
            ) : (
              backups.map((b) => (
                <div key={b.id} className="p-3.5 bg-white rounded-2xl border border-sand-200 shadow-2xs hover:border-ocean-300 transition-all space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <FileArchive className="w-4 h-4 text-ocean-600 shrink-0" />
                        <h4 className="text-xs font-extrabold text-slate-800 truncate" title={b.name}>{b.name}</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatDate(b.modifiedTime || b.createdTime)}</span>
                        </span>
                        <span>•</span>
                        <span>{formatBytes(b.size)}</span>
                      </div>
                    </div>
                    {b.webViewLink && (
                      <a
                        href={b.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={dict.googleDrive.openInDriveAction}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-ocean-600 hover:bg-ocean-50 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* SHA-256 Checksum Badge */}
                  {b.dbChecksumSha256 && (
                    <div className="p-2 bg-sand-50 rounded-xl border border-sand-200/80 flex items-center gap-1.5 text-[10px] font-mono text-slate-600">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-slate-400 select-none shrink-0 font-sans font-semibold">{dict.googleDrive.backupChecksumLabel}:</span>
                      <span className="truncate" title={b.dbChecksumSha256}>{b.dbChecksumSha256}</span>
                    </div>
                  )}

                  {/* Manifest Stats Chips */}
                  {b.stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[10px] text-slate-600">
                      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-1">
                        <Users className="w-3 h-3 text-ocean-600 shrink-0" />
                        <span className="truncate font-medium">{dict.googleDrive.statsUsers}: {b.stats.usersCount}</span>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate font-medium">{dict.googleDrive.statsUnits}: {b.stats.unitCloudAssetCount}</span>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span className="truncate font-medium">{dict.googleDrive.statsVocab}: {b.stats.vocabularyCount}</span>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate font-medium">{dict.googleDrive.statsProgress}: {b.stats.progressCount}</span>
                      </div>
                    </div>
                  )}

                  {/* Restore Action */}
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedBackup(b)}
                      className="min-h-[34px] px-3 py-1.5 bg-sand-100 hover:bg-sand-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-ocean-600" />
                      <span>{dict.googleDrive.restoreBackupAction}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Light Theme Restore Confirmation Modal */}
      <Modal
        isOpen={!!selectedBackup}
        onClose={() => { if (!isRestoring) setSelectedBackup(null); }}
        title={dict.googleDrive.restoreConfirmTitle}
        subtitle={dict.googleDrive.restoreConfirmMessage}
        icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 font-medium leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>{dict.googleDrive.restoreConfirmMessage}</p>
              {selectedBackup && (
                <p className="font-bold text-amber-950 font-mono text-[11px] pt-1">
                  {selectedBackup.name} ({formatBytes(selectedBackup.size)})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={isRestoring}
              onClick={() => setSelectedBackup(null)}
              className="min-h-[38px] px-4 py-2 bg-sand-100 hover:bg-sand-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {dict.googleDrive.restoreCancelAction}
            </button>
            <button
              type="button"
              disabled={isRestoring}
              onClick={handleConfirmRestore}
              className="min-h-[38px] px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow-2xs hover:shadow-soft transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isRestoring && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isRestoring ? dict.googleDrive.restoringBackupState : dict.googleDrive.restoreConfirmAction}</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
