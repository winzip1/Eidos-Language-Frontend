/**
 * Eidos Language OS - Drive Drag & Drop Upload Modal
 * Modal supporting file drag-and-drop, native picker, progress bar (%0-100),
 * and target directory context display.
 * STRICTLY LIGHT THEME & ZERO HARDCODE.
 */
import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, File, X, Loader2, CheckCircle2, Folder } from 'lucide-react';
import { useDictionary, interpolate } from '../../context/DictionaryContext';
import { formatBytes } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import type { DriveEntry } from '../../types/drive';

export interface DriveUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFolderName?: string;
  targetFolderId?: string;
  isUploading: boolean;
  uploadProgress: number;
  onUpload: (file: File, folderId?: string, description?: string) => Promise<DriveEntry | null>;
}

export const DriveUploadModal: React.FC<DriveUploadModalProps> = ({
  isOpen,
  onClose,
  targetFolderName,
  targetFolderId,
  isUploading,
  uploadProgress,
  onUpload,
}) => {
  const { dict } = useDictionary();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset internal state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setDescription('');
      setIsDragOver(false);
    }
  }, [isOpen]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isUploading) return;

    const uploaded = await onUpload(selectedFile, targetFolderId, description.trim() || undefined);
    if (uploaded) {
      // Successfully uploaded
      onClose();
    }
  };

  const progressText = interpolate(dict.googleDrive.uploadProgressLabel, {
    percentage: uploadProgress,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isUploading) onClose();
      }}
      title={dict.googleDrive.uploadModalTitle}
      subtitle={
        targetFolderName ? (
          <span className="flex items-center gap-1 text-slate-500">
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            <span>{dict.googleDrive.targetFolderLabel}: {targetFolderName}</span>
          </span>
        ) : undefined
      }
      icon={<UploadCloud className="w-5 h-5" />}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropzone Container */}
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-ocean-500 bg-ocean-50/70 scale-[1.01]'
                : 'border-sand-300 hover:border-ocean-400 bg-sand-50/50 hover:bg-sand-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-white text-ocean-600 flex items-center justify-center mb-3 border border-sand-200 shadow-2xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-1">
              {dict.googleDrive.dragAndDropPrompt}
            </p>
            <p className="text-[11px] text-slate-400 mb-3">
              {dict.googleDrive.supportedFormatsNotice}
            </p>
            <button
              type="button"
              className="px-3 py-1.5 bg-white text-ocean-700 text-xs font-semibold rounded-lg border border-sand-200 shadow-2xs hover:bg-ocean-50 transition-colors pointer-events-none"
            >
              {dict.googleDrive.selectFileButton}
            </button>
          </div>
        ) : (
          /* Selected File Information Card */
          <div className="bg-sand-50/80 border border-sand-200/90 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-white rounded-xl border border-sand-200/80 text-ocean-600 shrink-0">
                  <File className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs sm:text-sm font-semibold text-slate-800 truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-sand-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Optional File Description */}
            {!isUploading && (
              <div>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={dict.googleDrive.descriptionPlaceholder}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-sand-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-ocean-500 shadow-2xs"
                />
              </div>
            )}
          </div>
        )}

        {/* Real-time Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-2 pt-1 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-ocean-600" />
                <span>{dict.googleDrive.uploadingNotice}</span>
              </span>
              <span className="font-bold text-ocean-700">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-sand-200/70 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-ocean-600 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-sand-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 bg-sand-50 hover:bg-sand-100 rounded-xl border border-sand-200 transition-all cursor-pointer min-h-[44px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dict.googleDrive.cancelButton}
          </button>
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-soft min-h-[42px] ${
              selectedFile && !isUploading
                ? 'bg-ocean-600 hover:bg-ocean-700 text-white cursor-pointer active:scale-95'
                : 'bg-sand-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{isUploading ? progressText : dict.googleDrive.uploadFileButton}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
