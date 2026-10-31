/**
 * Eidos Language OS - Drive Create Folder Modal
 * Controlled modal for creating directories in Google Drive taxonomy.
 * Auto-focus, enter-key submission, validation, and honest error handling.
 * STRICTLY LIGHT THEME & ZERO HARDCODE.
 */
import React, { useState, useEffect, useRef } from 'react';
import { FolderPlus, Loader2, Folder } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { Modal } from '../common/Modal';
import type { DriveEntry } from '../../types/drive';

export interface DriveCreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFolderName?: string;
  onCreateFolder: (name: string) => Promise<DriveEntry | null>;
}

export const DriveCreateFolderModal: React.FC<DriveCreateFolderModalProps> = ({
  isOpen,
  onClose,
  targetFolderName,
  onCreateFolder,
}) => {
  const { dict } = useDictionary();
  const [folderName, setFolderName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await onCreateFolder(trimmed);
      if (res) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title={dict.googleDrive.createFolderModalTitle}
      subtitle={
        targetFolderName ? (
          <span className="flex items-center gap-1 text-slate-500">
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            <span>{dict.googleDrive.targetFolderLabel}: {targetFolderName}</span>
          </span>
        ) : undefined
      }
      icon={<FolderPlus className="w-5 h-5 text-amber-500" />}
      maxWidthClass="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="folder-name-input"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            {dict.googleDrive.folderNamePlaceholder}
          </label>
          <input
            id="folder-name-input"
            ref={inputRef}
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder={dict.googleDrive.folderNamePlaceholder}
            disabled={isSubmitting}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-sand-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/10 shadow-2xs transition-all min-h-[44px]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-sand-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 bg-sand-50 hover:bg-sand-100 rounded-xl border border-sand-200 transition-all cursor-pointer min-h-[44px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dict.googleDrive.cancelButton}
          </button>
          <button
            type="submit"
            disabled={!folderName.trim() || isSubmitting}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-soft min-h-[44px] ${
              folderName.trim() && !isSubmitting
                ? 'bg-ocean-600 hover:bg-ocean-700 text-white cursor-pointer active:scale-95'
                : 'bg-sand-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FolderPlus className="w-4 h-4" />
            )}
            <span>{dict.googleDrive.createFolderSubmit}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
