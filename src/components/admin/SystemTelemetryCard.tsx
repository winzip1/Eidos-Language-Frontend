import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Clock,
  RefreshCw,
  AlertCircle,
  Loader2,
  Server,
  Radio,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { getSystemTelemetry } from '../../services/adminSystemApi';
import { formatBytes, formatUptime, formatRelativeTime } from '../../utils/formatters';
import type { SystemHealthTelemetry } from '../../types';
import { toast } from 'sonner';

export interface SystemTelemetryCardProps {
  className?: string;
}

export const SystemTelemetryCard: React.FC<SystemTelemetryCardProps> = ({ className = '' }) => {
  const { dict } = useDictionary();
  const [telemetry, setTelemetry] = useState<SystemHealthTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTelemetry = useCallback(
    async (silent = false) => {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        const data = await getSystemTelemetry();
        setTelemetry(data);
      } catch (err: any) {
        const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
        const msg = `${err?.message || dict.systemMaintenance.telemetryTitle}${statusText}`;
        setErrorMessage(msg);
        if (!silent) {
          toast.error(msg);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [dict.systemMaintenance.telemetryTitle]
  );

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  // Auto-refresh interval (10 seconds)
  useEffect(() => {
    if (isAutoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchTelemetry(true);
      }, 10000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRefresh, fetchTelemetry]);

  // Derived Heap Utilization %
  const heapUsed = telemetry?.memory?.heapUsed || 0;
  const heapTotal = telemetry?.memory?.heapTotal || 1;
  const heapPercent = Math.min(100, Math.max(0, Math.round((heapUsed / heapTotal) * 100)));

  const heapProgressColor =
    heapPercent > 85 ? 'bg-rose-500' : heapPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col gap-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ocean-50 border border-ocean-100 flex items-center justify-center text-ocean-600 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                {dict.systemMaintenance.telemetryTitle}
              </h3>
              {telemetry && (
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                  {dict.systemMaintenance.lastUpdatedLabel}: {formatRelativeTime(telemetry.timestamp)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {dict.systemMaintenance.telemetrySubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Live Auto-Refresh Toggle */}
          <button
            type="button"
            onClick={() => setIsAutoRefresh((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isAutoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Radio
              className={`w-3.5 h-3.5 ${
                isAutoRefresh ? 'text-emerald-600 animate-pulse' : 'text-slate-400'
              }`}
            />
            <span>{dict.systemMaintenance.autoRefreshLabel}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => fetchTelemetry(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
            title={dict.systemMaintenance.refreshLogsButton}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>{dict.systemMaintenance.refreshLogsButton}</span>
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

      {/* Loading State */}
      {isLoading && !telemetry && (
        <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-slate-400">
          <Loader2 className="w-6 h-6 text-ocean-600 animate-spin" />
          <p className="text-xs font-medium">{dict.userManagement.loadingUsers}</p>
        </div>
      )}

      {/* Telemetry Grid */}
      {telemetry && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Uptime Card */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">
                {dict.systemMaintenance.serverUptimeLabel}
              </span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {formatUptime(telemetry.uptimeSeconds)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 truncate">
              {dict.systemMaintenance.platformLabel}: {telemetry.os.platform} ({telemetry.os.arch})
              {telemetry.os.cpuCount ? ` • ${telemetry.os.cpuCount} CPUs` : ''}
            </span>
          </div>

          {/* Heap Memory Card */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">
                {dict.systemMaintenance.memoryHeapUsedLabel}
              </span>
              <Cpu className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xl font-bold text-slate-900 tracking-tight">
                  {formatBytes(telemetry.memory.heapUsed)}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {heapPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${heapProgressColor}`}
                  style={{ width: `${heapPercent}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 truncate">
              {dict.systemMaintenance.memoryHeapTotalLabel}: {formatBytes(telemetry.memory.heapTotal)}
            </span>
          </div>

          {/* RSS Memory Card */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">
                {dict.systemMaintenance.memoryRssLabel}
              </span>
              <Server className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {formatBytes(telemetry.memory.rss)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 truncate">
              {dict.systemMaintenance.nodeVersionLabel}: {telemetry.os.nodeVersion}
            </span>
          </div>

          {/* SQLite DB & WAL Size Card */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">
                {dict.systemMaintenance.dbFileSizeBytes}
              </span>
              <HardDrive className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {formatBytes(telemetry.db.fileSizeBytes)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 truncate">
              {dict.systemMaintenance.walFileSizeBytes}: {formatBytes(telemetry.db.walSizeBytes)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
