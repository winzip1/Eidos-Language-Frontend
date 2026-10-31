/**
 * Eidos Language OS - Drive Media & File Preview Modal
 * Full modal inspection for audio files (streaming player), transcripts (formatted text/JSON),
 * and binary files with direct download and lesson linking shortcuts.
 * STRICTLY LIGHT THEME & ZERO HARDCODE (Yacht-Deck Modern Aesthetic).
 */
import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Music,
  Download,
  ExternalLink,
  Link2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  File as FileIcon,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDictionary } from '../../context/DictionaryContext';
import { formatBytes, formatRelativeTime } from '../../utils/formatters';
import { fetchDriveFileText, downloadDriveFile } from '../../services/driveApiClient';
import { DriveAudioPlayer } from './DriveAudioPlayer';
import type { DriveEntry } from '../../types/drive';

export interface DriveFilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: DriveEntry | null;
  onLinkToUnit?: (entry: DriveEntry) => void;
}

export const DriveFilePreviewModal: React.FC<DriveFilePreviewModalProps> = ({
  isOpen,
  onClose,
  entry,
  onLinkToUnit,
}) => {
  const { dict } = useDictionary();

  // Transcript Content State
  const [transcriptContent, setTranscriptContent] = useState<string>('');
  const [isLoadingText, setIsLoadingText] = useState<boolean>(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Load transcript text when a transcript entry is opened
  useEffect(() => {
    if (!isOpen || !entry) {
      setTranscriptContent('');
      setTextError(null);
      setIsCopied(false);
      return;
    }

    if (entry.isTranscript) {
      setIsLoadingText(true);
      setTextError(null);
      fetchDriveFileText(entry.id, entry.mimeType)
        .then((text) => {
          // Attempt JSON beautification if valid JSON
          try {
            const parsed = JSON.parse(text);
            setTranscriptContent(JSON.stringify(parsed, null, 2));
          } catch {
            setTranscriptContent(text);
          }
        })
        .catch((err) => {
          setTextError(err?.message || dict.googleDrive.downloadFailed);
        })
        .finally(() => {
          setIsLoadingText(false);
        });
    }
  }, [isOpen, entry, dict.googleDrive.downloadFailed]);

  // Copy transcript text to clipboard
  const handleCopyTranscript = async () => {
    if (!transcriptContent) return;
    try {
      await navigator.clipboard.writeText(transcriptContent);
      setIsCopied(true);
      toast.success(dict.googleDrive.previewCopySuccess);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Panoya kopyalanamadı.');
    }
  };

  // Direct download trigger
  const handleDownload = () => {
    if (!entry) return;
    downloadDriveFile(entry.id, entry.name, entry.mimeType).catch((err) => {
      toast.error(dict.googleDrive.downloadFailed, {
        description: err?.message,
      });
    });
  };

  if (!isOpen || !entry) return null;

  const formattedSize = entry.size ? formatBytes(Number(entry.size)) : '';
  const formattedDate = formatRelativeTime(entry.modifiedTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-white border border-sand-200/90 rounded-3xl shadow-soft-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand-100 bg-sand-50/40 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="p-2 bg-sand-100 rounded-xl text-slate-600 shrink-0">
              {entry.isAudio ? (
                <Music className="w-5 h-5 text-ocean-600" />
              ) : entry.isTranscript ? (
                <FileText className="w-5 h-5 text-emerald-600" />
              ) : entry.isBackup ? (
                <Archive className="w-5 h-5 text-violet-600" />
              ) : (
                <FileIcon className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div className="min-w-0">
              <h3
                id="preview-modal-title"
                title={entry.name}
                className="text-sm sm:text-base font-bold text-slate-800 truncate"
              >
                {entry.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {formattedSize ? `${formattedSize} • ` : ''}
                {formattedDate}
              </p>
            </div>
          </div>

          {/* Top Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onLinkToUnit && (entry.isAudio || entry.isTranscript) && (
              <button
                type="button"
                onClick={() => onLinkToUnit(entry)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ocean-50 hover:bg-ocean-100 text-ocean-700 border border-ocean-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer min-h-[38px]"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{dict.googleDrive.linkToLessonAction}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label={dict.googleDrive.previewCloseAction}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-sand-100 rounded-xl transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* 1. Audio Player Mode */}
          {entry.isAudio && (
            <div className="space-y-3">
              <DriveAudioPlayer fileId={entry.id} fileName={entry.name} autoPlay={false} />
            </div>
          )}

          {/* 2. Transcript Preview Mode */}
          {entry.isTranscript && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {dict.googleDrive.previewTranscriptTitle}
                </span>
                {transcriptContent && (
                  <button
                    type="button"
                    onClick={handleCopyTranscript}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-ocean-600 hover:text-ocean-700 transition-colors cursor-pointer min-h-[36px]"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{dict.googleDrive.previewCopyTranscript}</span>
                  </button>
                )}
              </div>

              {isLoadingText ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-sand-50/50 rounded-2xl border border-sand-200/60">
                  <Loader2 className="w-6 h-6 animate-spin text-ocean-600 mb-2" />
                  <span className="text-xs">{dict.googleDrive.previewLoadingContent}</span>
                </div>
              ) : textError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{textError}</span>
                </div>
              ) : transcriptContent.trim() ? (
                <div className="max-h-[360px] overflow-y-auto bg-sand-50/80 border border-sand-200/90 rounded-2xl p-4 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap select-text">
                  {transcriptContent}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-6 text-center">
                  {dict.googleDrive.previewEmptyTranscript}
                </p>
              )}
            </div>
          )}

          {/* 3. Non-Audio / Non-Transcript Generic File Mode */}
          {!entry.isAudio && !entry.isTranscript && (
            <div className="space-y-4">
              <div className="p-6 bg-sand-50/60 rounded-2xl border border-sand-200/60 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-white rounded-2xl shadow-soft mb-3 border border-sand-200/50">
                  {entry.isBackup ? (
                    <Archive className="w-10 h-10 text-violet-600" />
                  ) : (
                    <FileIcon className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                <h4 className="text-sm font-semibold text-slate-800 break-all">{entry.name}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  {dict.googleDrive.previewUnsupportedFormat}
                </p>
              </div>

              {/* Metadata Details Table */}
              <div className="bg-sand-50/40 rounded-xl p-3 border border-sand-200/50 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-sand-200/40">
                  <span className="text-slate-500">{dict.googleDrive.previewFileTypeLabel}:</span>
                  <span className="font-medium text-slate-700">{entry.mimeType}</span>
                </div>
                {formattedSize && (
                  <div className="flex justify-between py-1 border-b border-sand-200/40">
                    <span className="text-slate-500">{dict.googleDrive.fileSizeLabel}:</span>
                    <span className="font-medium text-slate-700">{formattedSize}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">{dict.googleDrive.modifiedDateLabel}:</span>
                  <span className="font-medium text-slate-700">{formattedDate}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 px-5 py-4 border-t border-sand-100 bg-sand-50/40 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-sand-50 text-slate-700 border border-sand-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4 text-ocean-600" />
              <span>{dict.googleDrive.previewDownloadAction}</span>
            </button>

            {entry.webViewLink && (
              <a
                href={entry.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-sand-50 text-slate-700 border border-sand-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors min-h-[44px]"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
                <span>{dict.googleDrive.previewOpenInDrive}</span>
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-sand-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[44px]"
          >
            {dict.googleDrive.previewCloseAction}
          </button>
        </div>
      </div>
    </div>
  );
};
