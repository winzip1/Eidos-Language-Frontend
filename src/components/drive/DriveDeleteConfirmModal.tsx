/**
 * Eidos Language OS - Drive Delete / Trash Confirmation Modal
 * Reversible (Trash) and irreversible (Permanent Delete) confirmation dialogs.
 * STRICTLY LIGHT THEME & ZERO HARDCODE.
 */
import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2, Folder, File } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { Modal } from '../common/Modal';
import type { DriveEntry } from '../../types/drive';

export interface DriveDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: DriveEntry | null;
  isPermanent: boolean;
  onConfirm: (entry: DriveEntry) => Promise<void>;
}

export const DriveDeleteConfirmModal: React.FC<DriveDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  entry,
  isPermanent,
  onConfirm,
}) => {
  const { dict } = useDictionary();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!entry) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm(entry);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const title = isPermanent
    ? dict.googleDrive.deleteConfirmTitle
    : dict.googleDrive.trashConfirmTitle;
  const message = isPermanent
    ? dict.googleDrive.deleteConfirmMessage
    : dict.googleDrive.trashConfirmMessage;
  const actionLabel = isPermanent
    ? dict.googleDrive.confirmDeleteAction
    : dict.googleDrive.confirmTrashAction;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isDeleting) onClose();
      }}
      title={title}
      icon={
        isPermanent ? (
          <AlertTriangle className="w-5 h-5 text-rose-600" />
        ) : (
          <Trash2 className="w-5 h-5 text-amber-500" />
        )
      }
      maxWidthClass="max-w-sm"
    >
      <div className="space-y-4">
        {/* Entry Detail Box */}
        <div className="flex items-center gap-3 p-3 bg-sand-50/80 rounded-2xl border border-sand-200/90">
          <div className="p-2.5 bg-white rounded-xl border border-sand-200/60 shrink-0">
            {entry.isFolder ? (
              <Folder className="w-5 h-5 text-amber-500 fill-amber-50" />
            ) : (
              <File className="w-5 h-5 text-ocean-600 fill-ocean-50" />
            )}
          </div>
          <div className="min-w-0">
            <h5 className="text-xs sm:text-sm font-semibold text-slate-800 truncate" title={entry.name}>
              {entry.name}
            </h5>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {entry.isFolder ? dict.googleDrive.filterFolders : (entry.mimeType || dict.googleDrive.defaultFileFallback)}
            </p>
          </div>
        </div>

        {/* Warning Message */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-sand-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 bg-sand-50 hover:bg-sand-100 rounded-xl border border-sand-200 transition-all cursor-pointer min-h-[44px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dict.googleDrive.cancelButton}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all shadow-soft min-h-[44px] cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isPermanent
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>{actionLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
