import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useDictionary } from '../../context/DictionaryContext';
import { restoreDbBackup, type RestoreBackupResponse } from '../../services/adminSystemApi';
import { formatBytes, formatRelativeTime } from '../../utils/formatters';
import type { DbBackupItem } from '../../types';
import { toast } from 'sonner';

export interface BackupRestoreConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  backup: DbBackupItem | null;
  onRestored: (result: RestoreBackupResponse) => void;
}

export const BackupRestoreConfirmModal: React.FC<BackupRestoreConfirmModalProps> = ({
  isOpen,
  onClose,
  backup,
  onRestored,
}) => {
  const { dict } = useDictionary();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !backup) return null;

  const handleClose = () => {
    if (isRestoring) return;
    setIsConfirmed(false);
    setErrorMessage(null);
    onClose();
  };

  const handleRestore = async () => {
    if (!isConfirmed) return;
    setIsRestoring(true);
    setErrorMessage(null);

    try {
      const result = await restoreDbBackup(backup.filename);
      toast.success(dict.systemMaintenance.restoreSuccessDesc);
      onRestored(result);
      handleClose();
    } catch (err: any) {
      const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
      const msg = `${err?.message || dict.systemMaintenance.restoreConfirmTitle}${statusText}`;
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsRestoring(false);
    }
  };

  const confirmMessage = dict.systemMaintenance.restoreConfirmMessage.replace(
    '{filename}',
    backup.filename
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={dict.systemMaintenance.restoreConfirmTitle}
      subtitle={dict.systemMaintenance.backupsSubtitle}
      icon={<RotateCcw className="w-5 h-5 text-amber-600" />}
      maxWidthClass="max-w-md"
    >
      <div className="flex flex-col gap-4 py-2">
        {/* Fail-Loud Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Selected Backup Snapshot Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-semibold text-slate-800 font-mono truncate max-w-[220px]"
              title={backup.filename}
            >
              {backup.filename}
            </span>
            <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              {formatBytes(backup.sizeBytes)}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {dict.systemMaintenance.backupDateHeader}: {formatRelativeTime(backup.createdAt)}
          </span>
        </div>

        {/* Primary Confirmation Prompt */}
        <p className="text-sm text-slate-700 font-medium leading-relaxed">
          {confirmMessage}
        </p>

        {/* Warning Notice Box */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">
            {dict.systemMaintenance.restoreWarningNotice}
          </div>
        </div>

        {/* Emergency Pre-Restore Safety Assurance */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-100/60 p-2.5 rounded-lg border border-slate-200/60">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{dict.systemMaintenance.emergencyBackupNotice}</span>
        </div>

        {/* Checkbox Guardrail */}
        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            disabled={isRestoring}
            className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500 mt-0.5 shrink-0"
          />
          <span className="text-xs text-slate-700 font-medium select-none leading-relaxed">
            {dict.systemMaintenance.restoreCheckboxConfirmLabel}
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isRestoring}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {dict.systemMaintenance.cancelRestoreButton}
          </button>
          <button
            type="button"
            onClick={handleRestore}
            disabled={isRestoring || !isConfirmed}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRestoring ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{dict.systemMaintenance.restoring}</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{dict.systemMaintenance.confirmRestoreButton}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
