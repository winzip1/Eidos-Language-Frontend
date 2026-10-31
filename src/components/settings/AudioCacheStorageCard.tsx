/**
 * Eidos Language OS - Audio Cache Storage Management Card
 * Allows inspecting total cached lesson audio size, count of cached units,
 * and clearing offline audio storage with safety confirmation.
 *
 * Rules Adherence:
 * - ZERO HARDCODE: All text & confirmation messages from dict.offlineCache.
 * - NO MOCK DATA: Inspects real IndexedDB metadata and Web Cache sizes.
 * - STRICT LIGHT THEME: Yacht-deck aesthetic, zero `dark:` classes.
 * - MODULAR: Clean separate component with accessible modal dialog.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { HardDrive, Trash2, CheckCircle2, AlertCircle, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { audioCacheService } from '../../services/audioCacheService';
import { Modal } from '../common/Modal';
import { toast } from 'sonner';

export const AudioCacheStorageCard: React.FC = () => {
  const { dict } = useDictionary();

  const [totalSizeBytes, setTotalSizeBytes] = useState<number>(0);
  const [cachedUnitsCount, setCachedUnitsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const loadCacheStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [size, allMeta] = await Promise.all([
        audioCacheService.getTotalCacheSizeBytes(),
        audioCacheService.getAllCachedMetadata(),
      ]);
      setTotalSizeBytes(size);
      setCachedUnitsCount(allMeta.length);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(dict.offlineCache.deleteFailed, { description: msg });
    } finally {
      setIsLoading(false);
    }
  }, [dict.offlineCache.deleteFailed]);

  useEffect(() => {
    loadCacheStats();
  }, [loadCacheStats]);

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await audioCacheService.clearAllCache();
      setShowConfirmModal(false);
      await loadCacheStats();
      toast.success(dict.offlineCache.clearAllSuccess);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(dict.offlineCache.deleteFailed, { description: msg });
    } finally {
      setIsClearing(false);
    }
  };

  const formatMb = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1);
  };

  const unitsText = dict.offlineCache.unitsStored.replace('{count}', String(cachedUnitsCount));

  return (
    <div className="bg-white p-4 rounded-2xl border border-sand-200 shadow-2xs space-y-3">
      {/* Header with Title and Refresh Action */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-ocean-600 shrink-0" />
            <span>{dict.offlineCache.storageTitle}</span>
          </h4>
          <p className="text-[11px] text-slate-400">
            {dict.offlineCache.storageDesc}
          </p>
        </div>

        <button
          type="button"
          onClick={loadCacheStats}
          disabled={isLoading || isClearing}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-sand-100 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
          title={dict.buttons.refresh}
          aria-label={dict.buttons.refresh}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-ocean-600' : ''}`} />
        </button>
      </div>

      {/* Storage Metrics Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-sand-50/70 rounded-xl border border-sand-200/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-sand-200 flex items-center justify-center text-ocean-600 shrink-0 shadow-2xs">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">{dict.offlineCache.totalSize}:</span>
              <span className="text-xs font-mono font-extrabold text-slate-900">
                {isLoading ? '...' : `${formatMb(totalSizeBytes)} MB`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {cachedUnitsCount > 0 ? unitsText : dict.offlineCache.noCachedUnits}
            </p>
          </div>
        </div>

        {/* Clear Cache Action Button */}
        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          disabled={isLoading || isClearing || cachedUnitsCount === 0}
          className="min-h-[38px] px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          <span>{dict.offlineCache.clearCache}</span>
        </button>
      </div>

      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 px-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
        <span>{dict.offlineCache.retentionNotice}</span>
      </div>

      {/* Safety Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={dict.offlineCache.clearAllConfirmTitle}
        subtitle={dict.offlineCache.clearAllConfirmMessage}
        icon={<Trash2 className="w-4 h-4 text-rose-600" />}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {dict.offlineCache.clearAllConfirmMessage}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="min-h-[38px] px-4 py-2 bg-sand-100 hover:bg-sand-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
            >
              {dict.settings.resetCancelButton}
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isClearing}
              className="min-h-[38px] px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs hover:shadow-soft transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
            >
              {isClearing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{dict.offlineCache.clearCache}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
