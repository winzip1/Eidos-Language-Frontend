import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Loader2,
  AlertCircle,
  TableProperties,
  HardDrive,
  RefreshCw,
  X,
  Zap,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { getDbStats, runDbVacuum } from '../../services/adminSystemApi';
import { formatBytes, formatNumber } from '../../utils/formatters';
import type { DbStats, VacuumResult } from '../../types';
import { toast } from 'sonner';

export interface DatabaseMaintenanceCardProps {
  className?: string;
  onStatsUpdated?: (stats: DbStats) => void;
}

export const DatabaseMaintenanceCard: React.FC<DatabaseMaintenanceCardProps> = ({
  className = '',
  onStatsUpdated,
}) => {
  const { dict } = useDictionary();
  const [stats, setStats] = useState<DbStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVacuuming, setIsVacuuming] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [vacuumResult, setVacuumResult] = useState<VacuumResult | null>(null);

  const fetchStats = useCallback(
    async (silent = false) => {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        const data = await getDbStats();
        setStats(data);
        if (onStatsUpdated) {
          onStatsUpdated(data);
        }
      } catch (err: any) {
        const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
        const msg = `${err?.message || dict.systemMaintenance.dbStatsTitle}${statusText}`;
        setErrorMessage(msg);
        if (!silent) {
          toast.error(msg);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [dict.systemMaintenance.dbStatsTitle, onStatsUpdated]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleVacuum = async () => {
    setIsVacuuming(true);
    setErrorMessage(null);
    setVacuumResult(null);

    try {
      const result = await runDbVacuum();
      setVacuumResult(result);
      const freedFormatted = formatBytes(result.freedBytes);
      const successDesc = dict.systemMaintenance.vacuumSuccessDesc.replace('{freed}', freedFormatted);
      toast.success(successDesc);
      await fetchStats(true);
    } catch (err: any) {
      const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
      const msg = `${err?.message || dict.systemMaintenance.vacuumTitle}${statusText}`;
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsVacuuming(false);
    }
  };

  const getTableLabel = (tableName: string): string => {
    switch (tableName) {
      case 'users':
        return dict.systemMaintenance.tableUsersLabel;
      case 'user_progress':
        return dict.systemMaintenance.tableProgressLabel;
      case 'user_vocabulary':
        return dict.systemMaintenance.tableVocabLabel;
      case 'bookmarks':
        return dict.systemMaintenance.tableBookmarksLabel;
      case 'system_logs':
        return dict.systemMaintenance.tableLogsLabel;
      case 'app_state':
        return dict.systemMaintenance.tableStateLabel;
      case 'system_settings':
        return dict.systemMaintenance.tableSettingsLabel;
      case 'course_requests':
        return 'course_requests';
      default:
        return tableName.replace(/_/g, ' ');
    }
  };

  const isIntegrityOk = stats?.integrity?.toLowerCase() === 'ok';
  const reclaimable = stats?.reclaimableBytes ?? 0;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col gap-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                {dict.systemMaintenance.dbStatsTitle}
              </h3>
              {stats && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    reclaimable > 0
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>
                    {reclaimable > 0
                      ? dict.systemMaintenance.reclaimableSpaceBadge.replace(
                          '{size}',
                          formatBytes(reclaimable)
                        )
                      : dict.systemMaintenance.databaseOptimizedBadge}
                  </span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {dict.systemMaintenance.dbStatsSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchStats(true)}
            disabled={isLoading || isRefreshing || isVacuuming}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
            title={dict.systemMaintenance.refreshLogsButton}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>{dict.systemMaintenance.refreshLogsButton}</span>
          </button>

          <button
            type="button"
            onClick={handleVacuum}
            disabled={isVacuuming || isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVacuuming ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{dict.systemMaintenance.vacuuming}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{dict.systemMaintenance.vacuumButton}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fail-Loud Error Box */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Vacuum Success Banner with Dismiss X */}
      {vacuumResult && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2.5 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-semibold">{dict.systemMaintenance.vacuumSuccessTitle}: </span>
              <span>
                {dict.systemMaintenance.vacuumFreedBytesLabel}: {formatBytes(vacuumResult.freedBytes)} (
                {vacuumResult.durationMs}ms)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVacuumResult(null)}
            className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !stats && (
        <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-slate-400">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          <p className="text-xs font-medium">{dict.userManagement.loadingUsers}</p>
        </div>
      )}

      {/* Main Database Metrics */}
      {stats && (
        <div className="flex flex-col gap-5">
          {/* Top Indicators: Integrity, File Size, Total Records */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Integrity Status */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between hover:border-slate-300 transition-colors">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">
                  {dict.systemMaintenance.dbIntegrityLabel}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isIntegrityOk
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {isIntegrityOk ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  {isIntegrityOk
                    ? dict.systemMaintenance.dbIntegrityOk
                    : dict.systemMaintenance.dbIntegrityFailed}
                </span>
              </div>
            </div>

            {/* Total Records */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between hover:border-slate-300 transition-colors">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">
                  {dict.systemMaintenance.totalRecordsLabel}
                </span>
                <span className="text-xl font-bold text-slate-900 tracking-tight">
                  {formatNumber(stats.totalRecords)}
                </span>
              </div>
              <TableProperties className="w-5 h-5 text-slate-400" />
            </div>

            {/* File & WAL Size */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between hover:border-slate-300 transition-colors">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">
                  {dict.systemMaintenance.dbFileSizeBytes}
                </span>
                <span className="text-xl font-bold text-slate-900 tracking-tight">
                  {formatBytes(stats.fileSizeBytes)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  WAL: {formatBytes(stats.walSizeBytes)}
                </span>
              </div>
              <HardDrive className="w-5 h-5 text-slate-400" />
            </div>
          </div>

          {/* Table-by-table Row Counts Grid */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
              {dict.systemMaintenance.tableStatsTitle}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.entries(stats.tables || {}).map(([tableName, count]) => (
                <div
                  key={tableName}
                  className="p-3 rounded-lg bg-white border border-slate-200/70 flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <span className="text-[11px] font-medium text-slate-500 truncate" title={tableName}>
                    {getTableLabel(tableName)}
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-base font-bold text-slate-900">
                      {formatNumber(count)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {dict.systemMaintenance.tableRecordsFormat.replace('{count}', '')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
