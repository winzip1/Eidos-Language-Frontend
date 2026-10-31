import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollText,
  Search,
  X,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  AlertOctagon,
  Copy,
  Check,
  Download,
  Radio,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useDictionary } from '../../context/DictionaryContext';
import { getSystemLogs, clearSystemLogs } from '../../services/adminSystemApi';
import { formatRelativeTime } from '../../utils/formatters';
import type { SystemLogItem, PaginatedSystemLogsResponse, SystemLogsSummary } from '../../types';
import { toast } from 'sonner';

export interface SystemLogsViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemLogsViewerModal: React.FC<SystemLogsViewerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { dict } = useDictionary();

  // State
  const [logs, setLogs] = useState<SystemLogItem[]>([]);
  const [summary, setSummary] = useState<SystemLogsSummary>({
    total: 0,
    info: 0,
    warn: 0,
    error: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(15);
  const [levelFilter, setLevelFilter] = useState<'all' | 'INFO' | 'WARN' | 'ERROR'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveStream, setIsLiveStream] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [copiedLogId, setCopiedLogId] = useState<number | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [clearTarget, setClearTarget] = useState<'all' | 'safe'>('all');
  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = useCallback(
    async (silent = false) => {
      if (!isOpen) return;
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        const res: PaginatedSystemLogsResponse = await getSystemLogs({
          page,
          limit,
          level: levelFilter !== 'all' ? levelFilter : undefined,
          search: search.trim() || undefined,
        });

        setLogs(res.items || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
        if (res.summary) {
          setSummary(res.summary);
        }
      } catch (err: any) {
        const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
        const msg = `${err?.message || dict.systemMaintenance.logsTitle}${statusText}`;
        setErrorMessage(msg);
        if (!silent) {
          toast.error(msg);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isOpen, page, limit, levelFilter, search, dict.systemMaintenance.logsTitle]
  );

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, fetchLogs]);

  // Live polling interval (5 seconds)
  useEffect(() => {
    if (isOpen && isLiveStream) {
      liveIntervalRef.current = setInterval(() => {
        fetchLogs(true);
      }, 5000);
    } else if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
      }
    };
  }, [isOpen, isLiveStream, fetchLogs]);

  // Reset page to 1 when filters change
  const handleFilterChange = (newLevel: 'all' | 'INFO' | 'WARN' | 'ERROR') => {
    setLevelFilter(newLevel);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleClearLogs = async () => {
    setIsClearing(true);
    setErrorMessage(null);

    try {
      if (clearTarget === 'safe') {
        // Clear INFO first
        await clearSystemLogs({ level: 'INFO' });
        // Then clear WARN, preserving ERROR
        await clearSystemLogs({ level: 'WARN' });
      } else {
        await clearSystemLogs();
      }

      toast.success(dict.systemMaintenance.logsClearedSuccess);
      setIsClearConfirmOpen(false);
      setPage(1);
      await fetchLogs(true);
    } catch (err: any) {
      const statusText = err?.statusCode ? ` (HTTP ${err.statusCode})` : '';
      const msg = `${err?.message || dict.systemMaintenance.clearLogsButton}${statusText}`;
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsClearing(false);
    }
  };

  const handleCopyDetails = async (log: SystemLogItem) => {
    try {
      const payload = log.details
        ? typeof log.details === 'string'
          ? log.details
          : JSON.stringify(log.details, null, 2)
        : log.message;
      await navigator.clipboard.writeText(payload);
      setCopiedLogId(log.id);
      toast.success(dict.systemMaintenance.detailsCopiedSuccess);
      setTimeout(() => setCopiedLogId(null), 2000);
    } catch {
      // Ignore clipboard write failures
    }
  };

  const handleExportJson = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `system_logs_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch {
      toast.error('Failed to export logs');
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'INFO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3 h-3 text-blue-600" />
            <span>INFO</span>
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>WARN</span>
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="w-3 h-3 text-rose-600" />
            <span>ERROR</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
            {level}
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dict.systemMaintenance.logsTitle}
      subtitle={dict.systemMaintenance.logsSubtitle}
      icon={<ScrollText className="w-5 h-5 text-indigo-600" />}
      maxWidthClass="max-w-4xl"
    >
      <div className="flex flex-col gap-4 py-1">
        {/* Fail-Loud Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Toolbar: Search, Filters, Live, Export, Clear */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder={dict.systemMaintenance.searchLogsPlaceholder}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Level Filter Buttons with Live Count Pills */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                levelFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{dict.systemMaintenance.filterLevelAll}</span>
              {summary.total > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 rounded-full font-semibold">
                  {summary.total}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('INFO')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                levelFilter === 'INFO'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              <span>INFO</span>
              {summary.info > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full font-semibold">
                  {summary.info}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('WARN')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                levelFilter === 'WARN'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <span>WARN</span>
              {summary.warn > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded-full font-semibold">
                  {summary.warn}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('ERROR')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                levelFilter === 'ERROR'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <span>ERROR</span>
              {summary.error > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full font-semibold">
                  {summary.error}
                </span>
              )}
            </button>
          </div>

          {/* Action Buttons: Live Stream, Export, Refresh & Clear */}
          <div className="flex items-center gap-1.5">
            {/* Live Polling Toggle */}
            <button
              type="button"
              onClick={() => setIsLiveStream((prev) => !prev)}
              className={`p-1.5 rounded-lg border transition-all ${
                isLiveStream
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title={dict.systemMaintenance.autoRefreshLabel}
            >
              <Radio
                className={`w-4 h-4 ${
                  isLiveStream ? 'text-emerald-600 animate-pulse' : 'text-slate-400'
                }`}
              />
            </button>

            {/* Export Logs */}
            <button
              type="button"
              onClick={handleExportJson}
              disabled={logs.length === 0}
              className="p-1.5 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-40"
              title={dict.systemMaintenance.exportLogsAction}
            >
              <Download className="w-4 h-4 text-slate-500" />
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => fetchLogs(true)}
              disabled={isLoading || isRefreshing}
              className="p-1.5 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
              title={dict.systemMaintenance.refreshLogsButton}
            >
              <RefreshCw
                className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>

            {/* Clear Logs */}
            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              disabled={logs.length === 0 || isLoading || isClearing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{dict.systemMaintenance.clearLogsButton}</span>
            </button>
          </div>
        </div>

        {/* Clear Logs Inline Confirmation with Granular Targets */}
        {isClearConfirmOpen && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-3 text-xs">
            <div className="flex items-center gap-2 text-rose-900 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{dict.userManagement.modalDeleteWarning}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearTarget === 'safe'}
                  onChange={(e) => setClearTarget(e.target.checked ? 'safe' : 'all')}
                  className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                />
                <span>{dict.systemMaintenance.clearOnlyInfoWarnPrompt}</span>
              </label>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsClearConfirmOpen(false)}
                  disabled={isClearing}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 font-medium"
                >
                  {dict.buttons.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleClearLogs}
                  disabled={isClearing}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 text-white rounded-md font-semibold hover:bg-rose-700 transition-colors"
                >
                  {isClearing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{dict.systemMaintenance.clearingLogs}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && logs.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-slate-400">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <p className="text-xs font-medium">{dict.userManagement.loadingUsers}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && logs.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400 text-center">
            <ScrollText className="w-10 h-10 text-slate-300 mb-1" />
            <p className="text-xs font-semibold text-slate-700">
              {dict.systemMaintenance.noLogsFoundTitle}
            </p>
            <p className="text-xs text-slate-400 max-w-sm">
              {dict.systemMaintenance.noLogsFoundDesc}
            </p>
          </div>
        )}

        {/* Log Entries List */}
        {logs.length > 0 && (
          <div className="flex flex-col divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-[460px] overflow-y-auto bg-white">
            {logs.map((item) => {
              const isExpanded = expandedLogId === item.id;
              const isCopied = copiedLogId === item.id;
              const hasDetails = Boolean(item.details);

              return (
                <div
                  key={item.id}
                  className="p-3 hover:bg-slate-50/70 transition-colors flex flex-col gap-1.5 text-xs group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {getLevelBadge(item.level)}
                      <span className="font-medium text-slate-900 leading-snug">
                        {item.message}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-slate-400 text-[11px]">
                      <span>{formatRelativeTime(item.createdAt)}</span>

                      {/* Copy Log Action */}
                      <button
                        type="button"
                        onClick={() => handleCopyDetails(item)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity p-0.5 rounded"
                        title={dict.systemMaintenance.copyDetailsAction}
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {hasDetails && (
                        <button
                          type="button"
                          onClick={() => setExpandedLogId(isExpanded ? null : item.id)}
                          className="p-1 hover:text-slate-700 text-slate-400 rounded transition-colors"
                          title="Detaylar"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable JSON details block */}
                  {isExpanded && hasDetails && (
                    <div className="mt-1 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-all">
                        {typeof item.details === 'string'
                          ? item.details
                          : JSON.stringify(item.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              {dict.userManagement.paginationPage} {page} / {totalPages} ({totalCount} log)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{dict.userManagement.paginationPrevious}</span>
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <span>{dict.userManagement.paginationNext}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
