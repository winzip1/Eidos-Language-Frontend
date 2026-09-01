import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileJson,
  X,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';

export const DataBackupResetCard: React.FC = () => {
  const { dict } = useDictionary();
  const { exportProgressBackup, importProgressBackup, resetProgress } = useAuth();

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const backupData = await exportProgressBackup();
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `eidos_language_backup_${timestamp}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: dict.settings.savedSuccess,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || dict.errors.internalServerError,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatusMessage(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed || (typeof parsed !== 'object')) {
        throw new Error(dict.settings.importError);
      }

      await importProgressBackup(parsed);
      setStatusMessage({
        type: 'success',
        text: dict.settings.importSuccess,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || dict.settings.importError,
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    setStatusMessage(null);
    try {
      await resetProgress();
      setShowResetModal(false);
      setStatusMessage({
        type: 'success',
        text: dict.settings.resetSuccess,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || dict.errors.internalServerError,
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div>
        <label className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-1">
          <Database className="w-4 h-4 text-ocean-600" />
          <span>{dict.settings.backupTitle}</span>
        </label>
        <p className="text-[11px] text-slate-400">
          {dict.settings.backupSubtitle}
        </p>
      </div>

      <div className="space-y-3 bg-sand-50/60 p-4 rounded-2xl border border-sand-200">
        {/* Status notification banner */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-semibold animate-fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 1. Export Backup Card */}
        <div className="bg-white p-3.5 rounded-xl border border-sand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-0.5">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-ocean-600" />
              <span>{dict.settings.exportBackupLabel}</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              {dict.settings.exportBackupDesc}
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-3.5 py-2 bg-ocean-50 hover:bg-ocean-100 text-ocean-700 hover:text-ocean-900 border border-ocean-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-50"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>{dict.settings.exportButton}</span>
          </button>
        </div>

        {/* 2. Import Backup Card */}
        <div className="bg-white p-3.5 rounded-xl border border-sand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-0.5">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-amber-600" />
              <span>{dict.settings.importBackupLabel}</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              {dict.settings.importBackupDesc}
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 hover:text-amber-950 border border-amber-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{dict.settings.importButton}</span>
          </button>
        </div>

        {/* 3. Danger Zone: Reset Progress Card */}
        <div className="bg-rose-50/40 p-3.5 rounded-xl border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-extrabold text-rose-900 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>{dict.settings.resetDataLabel}</span>
            </h4>
            <p className="text-[11px] text-rose-700/80">
              {dict.settings.resetDataDesc}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-soft transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{dict.settings.resetDataLabel}</span>
          </button>
        </div>
      </div>

      {/* Safety Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title={dict.settings.resetConfirmTitle}
        subtitle={dict.settings.resetConfirmMessage}
        icon={<AlertTriangle className="w-4 h-4 text-rose-600" />}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {dict.settings.resetConfirmMessage}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              {dict.settings.resetCancelButton}
            </button>
            <button
              type="button"
              onClick={handleConfirmReset}
              disabled={isResetting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-soft transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {dict.settings.resetConfirmButton}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
