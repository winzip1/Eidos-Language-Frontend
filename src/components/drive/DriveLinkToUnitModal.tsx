/**
 * Eidos Language OS - Drive Smart Link-To-Unit Modal
 * Links Google Drive audio and transcript files to specific course units.
 * Features smart regex auto-detection from filenames with manual override controls,
 * existing mapping status checks, unlinking capabilities, and Fail-Loud error surfacing.
 * STRICTLY LIGHT THEME & ZERO HARDCODE (Yacht-Deck Modern Aesthetic).
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Link2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Music,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDictionary } from '../../context/DictionaryContext';
import {
  linkDriveFileToUnit,
  unlinkDriveFileFromUnit,
} from '../../services/driveApiClient';
import {
  parseDriveFileName,
  formatCloudAssetBadgeText,
  PARSER_SUPPORTED_LANGUAGES,
  PARSER_SUPPORTED_LEVELS,
} from '../../utils/driveFileNameParser';
import type { DriveEntry, UnitCloudAsset } from '../../types/drive';

export interface DriveLinkToUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: DriveEntry | null;
  existingMapping?: UnitCloudAsset | null;
  onLinkSuccess?: (asset: UnitCloudAsset) => void;
  onUnlinkSuccess?: (assetId: string) => void;
}

export const DriveLinkToUnitModal: React.FC<DriveLinkToUnitModalProps> = ({
  isOpen,
  onClose,
  entry,
  existingMapping,
  onLinkSuccess,
  onUnlinkSuccess,
}) => {
  const { dict } = useDictionary();

  // Form Field State
  const [selectedLanguage, setSelectedLanguage] = useState<string>('german');
  const [selectedLevel, setSelectedLevel] = useState<string>('level1');
  const [selectedUnit, setSelectedUnit] = useState<number>(1);

  // Status & Progress State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUnlinking, setIsUnlinking] = useState<boolean>(false);
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(false);
  const [autoDetectNotice, setAutoDetectNotice] = useState<string>('');

  // Evaluate smart filename regex analysis upon opening
  useEffect(() => {
    if (!isOpen || !entry) {
      setIsSubmitting(false);
      setIsUnlinking(false);
      setIsAutoDetected(false);
      setAutoDetectNotice('');
      return;
    }

    if (existingMapping) {
      // Prioritize existing mapping if already linked
      setSelectedLanguage(existingMapping.languageId || 'german');
      setSelectedLevel(existingMapping.levelId || 'level1');
      setSelectedUnit(existingMapping.unitNumber || 1);
      setIsAutoDetected(false);
    } else {
      // Smart Auto-Detection from filename
      const parsed = parseDriveFileName(entry.name);
      setSelectedLanguage(parsed.languageId);
      setSelectedLevel(parsed.levelId);
      setSelectedUnit(parsed.unitNumber);

      if (parsed.isDetected) {
        setIsAutoDetected(true);
        const previewText = formatCloudAssetBadgeText(
          {
            languageId: parsed.languageId,
            levelId: parsed.levelId,
            unitNumber: parsed.unitNumber,
          },
          dict
        );
        setAutoDetectNotice(previewText);
      } else {
        setIsAutoDetected(false);
        setAutoDetectNotice('');
      }
    }
  }, [isOpen, entry, existingMapping, dict]);

  // Derived courseId
  const computedCourseId = useMemo(() => {
    if (selectedLanguage === 'german') {
      return 'german_pimsleur';
    }
    return `eidos-${selectedLanguage}-${selectedLevel}`;
  }, [selectedLanguage, selectedLevel]);

  // Submit link action
  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;

    setIsSubmitting(true);
    try {
      const res = await linkDriveFileToUnit({
        courseId: computedCourseId,
        languageId: selectedLanguage,
        levelId: selectedLevel,
        unitNumber: selectedUnit,
        driveFileId: entry.id,
        fileName: entry.name,
        fileSizeBytes: entry.size ? Number(entry.size) : undefined,
        mimeType: entry.mimeType,
      });

      toast.success(dict.googleDrive.unitLinkedSuccess, {
        description: formatCloudAssetBadgeText(res.asset, dict),
      });

      if (onLinkSuccess) {
        onLinkSuccess(res.asset);
      }
      onClose();
    } catch (err: any) {
      toast.error('Bağlama işlemi başarısız oldu.', {
        description: err?.message || 'Bilinmeyen bir hata oluştu.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit unlink action
  const handleUnlink = async () => {
    if (!existingMapping) return;

    setIsUnlinking(true);
    try {
      await unlinkDriveFileFromUnit(existingMapping.id);
      toast.success(dict.googleDrive.unitUnlinkedSuccess);
      if (onUnlinkSuccess) {
        onUnlinkSuccess(existingMapping.id);
      }
      onClose();
    } catch (err: any) {
      toast.error('Eşleme kaldırılamadı.', {
        description: err?.message || 'Bilinmeyen bir hata oluştu.',
      });
    } finally {
      setIsUnlinking(false);
    }
  };

  if (!isOpen || !entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white border border-sand-200/90 rounded-3xl shadow-soft-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand-100 bg-sand-50/40 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="p-2 bg-ocean-50 rounded-xl text-ocean-600 shrink-0 border border-ocean-100">
              <Link2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3
                id="link-modal-title"
                className="text-sm sm:text-base font-bold text-slate-800 truncate"
              >
                {dict.googleDrive.linkModalTitle}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{entry.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.googleDrive.previewCloseAction}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-sand-100 rounded-xl transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSaveLink} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Smart Auto-Detection Banner */}
          {isAutoDetected && !existingMapping && (
            <div className="flex items-start gap-2.5 p-3.5 bg-ocean-50/80 border border-ocean-200/80 rounded-2xl text-ocean-900 text-xs shadow-2xs">
              <Sparkles className="w-4 h-4 text-ocean-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold">{dict.googleDrive.linkAutoDetectedBanner}:</span>
                <p className="font-semibold text-ocean-800 mt-0.5">{autoDetectNotice}</p>
              </div>
            </div>
          )}

          {/* Existing Mapping Notice */}
          {existingMapping && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{dict.googleDrive.linkAlreadyLinkedBadge}</span>
                </span>
                <button
                  type="button"
                  onClick={handleUnlink}
                  disabled={isUnlinking}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100/70 border border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 min-h-[34px]"
                >
                  {isUnlinking ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3 text-rose-600" />
                  )}
                  <span>
                    {isUnlinking
                      ? dict.googleDrive.linkUnlinkingState
                      : dict.googleDrive.linkUnlinkButton}
                  </span>
                </button>
              </div>
              <p className="text-xs text-emerald-800 font-medium">
                {formatCloudAssetBadgeText(existingMapping, dict)}
              </p>
            </div>
          )}

          {/* Form Fields: Language, Level, Unit */}
          <div className="space-y-3.5">
            {/* 1. Language Selector */}
            <div>
              <label
                htmlFor="link-language-select"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                {dict.googleDrive.linkLanguageLabel}
              </label>
              <select
                id="link-language-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-sand-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-colors min-h-[44px]"
              >
                {PARSER_SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.flag} {dict.googleDrive[lang.displayNameKey as keyof typeof dict.googleDrive] || lang.defaultName}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Level Selector */}
            <div>
              <label
                htmlFor="link-level-select"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                {dict.googleDrive.linkLevelLabel}
              </label>
              <select
                id="link-level-select"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-sand-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-colors min-h-[44px]"
              >
                {PARSER_SUPPORTED_LEVELS.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    Seviye {lvl.displayName} ({lvl.cefr})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Unit Number Selector (1..30) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="link-unit-input"
                  className="block text-xs font-bold text-slate-700"
                >
                  {dict.googleDrive.linkUnitNumberLabel}
                </label>
                <span className="text-xs font-mono font-bold text-ocean-700">
                  Ünite {selectedUnit}
                </span>
              </div>
              <input
                id="link-unit-input"
                type="number"
                min="1"
                max="30"
                value={selectedUnit}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setSelectedUnit(isNaN(val) ? 1 : Math.max(1, Math.min(30, val)));
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-sand-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-colors min-h-[44px]"
                required
              />
            </div>
          </div>

          {/* Preview of Badge Result */}
          <div className="pt-2 border-t border-sand-100 flex items-center justify-between text-xs text-slate-500">
            <span>Önizleme Rozeti:</span>
            <span className="font-semibold text-ocean-700">
              {formatCloudAssetBadgeText(
                {
                  languageId: selectedLanguage,
                  levelId: selectedLevel,
                  unitNumber: selectedUnit,
                },
                dict
              )}
            </span>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[44px]"
            >
              {dict.googleDrive.cancelButton}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-ocean-600 hover:bg-ocean-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-soft transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{dict.googleDrive.linkSubmittingState}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{dict.googleDrive.linkSubmitButton}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
