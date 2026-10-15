import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useDictionary } from '../../context/DictionaryContext';
import { deleteDbBackup } from '../../services/adminSystemApi';
import { formatBytes } from '../../utils/formatters';
import type { DbBackupItem } from '../../types';
import { toast } from 'sonner';

export interface BackupDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  backup: DbBackupItem | null;
  onDeleted: (filename: string) => void;
}

export const BackupDeleteConfirmModal: React.FC<BackupDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  backup,
  onDeleted,
}) => {
  const { dict } = useDictionary();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !backup) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteDbBackup(backup.filename);
      toast.success(dict.systemMaintenance.deleteBackupSuccess);
      onDeleted(backup.filename);
      onClose();
    } catch (err: any) {
      const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
      const msg = `${err?.message || dict.systemMaintenance.deleteBackupConfirmTitle}${statusText}`;
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmMessage = dict.systemMaintenance.deleteBackupConfirmMessage.replace(
    '{filename}',
    backup.filename
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={isDeleting ? () => {} : onClose}
      title={dict.systemMaintenance.deleteBackupConfirmTitle}
      subtitle={dict.systemMaintenance.backupsSubtitle}
      icon={<Trash2 className="w-5 h-5 text-rose-600" />}
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

        {/* Selected Backup Item Preview */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 font-mono truncate max-w-[240px]" title={backup.filename}>
            {backup.filename}
          </span>
          <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
            {formatBytes(backup.sizeBytes)}
          </span>
        </div>

        {/* Confirmation Question */}
        <p className="text-sm text-slate-700 font-medium leading-relaxed">
          {confirmMessage}
        </p>

        {/* Irreversible Warning Box */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">
            {dict.userManagement.modalDeleteWarning}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {dict.buttons.cancel}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{dict.userManagement.confirmDeleteButton}...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{dict.systemMaintenance.confirmDeleteBackupButton}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
