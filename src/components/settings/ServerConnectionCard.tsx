import React, { useState } from 'react';
import {
  Server,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Zap,
  Globe,
  Save,
  ShieldCheck,
  Key,
  ChevronDown,
  ChevronUp,
  HardDrive,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { getApiBaseUrl } from '../../services/apiClient';

/**
 * Normalizes and sanitizes user-entered API URL.
 * Automatically prefixes http:// for localhost or https:// for cloud hosts if protocol is omitted,
 * and strips trailing slashes.
 */
function sanitizeServerUrl(rawUrl: string): string {
  let trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    if (/^(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed)) {
      trimmed = `http://${trimmed}`;
    } else {
      trimmed = `https://${trimmed}`;
    }
  }
  return trimmed.replace(/\/+$/, '');
}

export const ServerConnectionCard: React.FC = () => {
  const { dict, refreshDictionary } = useDictionary();

  const [customApiUrl, setCustomApiUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('eidos_custom_api_url') || '';
    } catch {
      return '';
    }
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    latencyMs?: number;
    message?: string;
  }>({ status: 'idle' });

  // Admin Sync Diagnostics State
  const [syncToken, setSyncToken] = useState<string>(() => {
    try {
      return localStorage.getItem('eidos_admin_sync_token') || '';
    } catch {
      return '';
    }
  });
  const [isSyncExpanded, setIsSyncExpanded] = useState<boolean>(false);
  const [isTestingSync, setIsTestingSync] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{
    status: 'idle' | 'success' | 'error';
    latencyMs?: number;
    totalFiles?: number;
    totalBytes?: number;
    storagePath?: string;
    message?: string;
  }>({ status: 'idle' });

  const activeUrl = getApiBaseUrl();
  const isCustomConfigured = Boolean(customApiUrl.trim());

  const handleInputChange = (val: string) => {
    setCustomApiUrl(val);
    if (testResult.status !== 'idle') {
      setTestResult({ status: 'idle' });
    }
  };

  const handleSaveApiUrl = () => {
    const sanitized = sanitizeServerUrl(customApiUrl);
    try {
      if (sanitized) {
        localStorage.setItem('eidos_custom_api_url', sanitized);
        setCustomApiUrl(sanitized);
      } else {
        localStorage.removeItem('eidos_custom_api_url');
        setCustomApiUrl('');
      }
    } catch {
      // Ignore storage write errors
    }
    setSavedSuccess(true);
    refreshDictionary();
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetApiUrl = () => {
    try {
      localStorage.removeItem('eidos_custom_api_url');
    } catch {
      // Ignore
    }
    setCustomApiUrl('');
    setTestResult({ status: 'idle' });
    setSavedSuccess(true);
    refreshDictionary();
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult({ status: 'idle' });
    const startTime = performance.now();

    const targetBase = customApiUrl.trim()
      ? sanitizeServerUrl(customApiUrl)
      : getApiBaseUrl();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      let res: { status?: string; version?: string } | null = null;
      let statusCode = 200;

      try {
        const fetchRes = await fetch(`${targetBase}/api/v1/health`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        statusCode = fetchRes.status;
        if (fetchRes.ok) {
          res = await fetchRes.json();
        }
      } catch {
        // Fallback to root health
      }

      if (!res || res.status !== 'healthy') {
        const fetchRes = await fetch(`${targetBase}/health`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        statusCode = fetchRes.status;
        if (fetchRes.ok) {
          res = await fetchRes.json();
        }
      }

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      if (res && res.status === 'healthy') {
        setTestResult({
          status: 'success',
          latencyMs,
          message: `${dict.settings.testConnectionSuccess} (${latencyMs}ms)`,
        });
      } else {
        setTestResult({
          status: 'error',
          message: `${dict.settings.testConnectionFailed} (HTTP ${statusCode})`,
        });
      }
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      const failMessage = isTimeout
        ? `${dict.settings.testConnectionFailed} (Timeout - 6s)`
        : (err?.message || dict.settings.testConnectionFailed);
      setTestResult({
        status: 'error',
        message: failMessage,
      });
    } finally {
      clearTimeout(timeoutId);
      setIsTesting(false);
    }
  };

  const handleTestSync = async () => {
    setIsTestingSync(true);
    setSyncResult({ status: 'idle' });
    const startTime = performance.now();

    const targetBase = customApiUrl.trim()
      ? sanitizeServerUrl(customApiUrl)
      : getApiBaseUrl();

    try {
      if (syncToken.trim()) {
        localStorage.setItem('eidos_admin_sync_token', syncToken.trim());
      } else {
        localStorage.removeItem('eidos_admin_sync_token');
      }
    } catch {}

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (syncToken.trim()) {
        headers['X-Sync-Token'] = syncToken.trim();
        headers['Authorization'] = `Bearer ${syncToken.trim()}`;
      }

      const fetchRes = await fetch(`${targetBase}/api/v1/sync/status`, {
        headers,
        signal: controller.signal,
      });

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      if (fetchRes.ok) {
        const body = await fetchRes.json();
        setSyncResult({
          status: 'success',
          latencyMs,
          totalFiles: body.data?.totalIndexedFiles,
          totalBytes: body.data?.totalBytes,
          storagePath: body.data?.storageBaseDir,
          message: `${dict.adminSync.authSuccess} (${latencyMs}ms)`,
        });
      } else if (fetchRes.status === 401) {
        setSyncResult({
          status: 'error',
          message: `${dict.adminSync.unauthorized} (HTTP 401)`,
        });
      } else if (fetchRes.status === 500) {
        setSyncResult({
          status: 'error',
          message: `${dict.adminSync.serverMisconfigured} (HTTP 500)`,
        });
      } else {
        setSyncResult({
          status: 'error',
          message: `Sync status check failed (HTTP ${fetchRes.status})`,
        });
      }
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      setSyncResult({
        status: 'error',
        message: isTimeout ? 'Sync check timed out (6s).' : (err?.message || 'Sync network error.'),
      });
    } finally {
      clearTimeout(timeoutId);
      setIsTestingSync(false);
    }
  };

  return (
    <div className="bg-white border border-sand-200 rounded-2xl p-5 shadow-2xs space-y-4">
      {/* 1. Header with Title & Real-Time Status Badge */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-ocean-50 text-ocean-600 flex items-center justify-center border border-ocean-200/70 shadow-2xs">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 leading-tight">
              {dict.settings.serverUrlLabel}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {dict.settings.serverUrlDesc}
            </p>
          </div>
        </div>

        {/* Real-time Status Badge */}
        <div className="shrink-0">
          {testResult.status === 'success' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{testResult.latencyMs}ms</span>
            </span>
          ) : testResult.status === 'error' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{dict.badges.offline}</span>
            </span>
          ) : isCustomConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-ocean-50 text-ocean-800 border border-ocean-200 shadow-2xs">
              <Globe className="w-3 h-3 text-ocean-600" />
              <span>{dict.badges.active}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sand-100 text-slate-700 border border-sand-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{dict.badges.online}</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Form Input Section */}
      <div className="space-y-3">
        <div>
          <input
            type="text"
            value={customApiUrl}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveApiUrl();
              }
            }}
            placeholder={dict.settings.serverUrlPlaceholder}
            className="w-full px-3.5 py-2.5 bg-sand-50/70 border border-sand-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-ocean-200 focus:border-ocean-400 transition-all shadow-2xs"
          />
        </div>

        {/* Active URL & Action Buttons (Ergonomic, min 42px touch area) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
            <span className="text-slate-400 shrink-0">{dict.settings.activeServerLabel}:</span>
            <strong className="text-slate-700 font-mono text-[10px] bg-sand-100/90 px-2 py-1 rounded-lg border border-sand-200 truncate max-w-[220px] sm:max-w-xs">
              {activeUrl}
            </strong>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Test Connection Button */}
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              aria-busy={isTesting}
              title={isTesting ? dict.settings.testConnectionTesting : dict.settings.testConnectionButton}
              className="min-h-[42px] px-3.5 py-2 text-ocean-700 hover:text-ocean-900 bg-ocean-50/80 hover:bg-ocean-100/80 border border-ocean-200 rounded-xl flex items-center gap-1.5 transition-all active:scale-[0.98] text-xs font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
            >
              {isTesting ? (
                <Activity className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>{isTesting ? dict.settings.testConnectionTesting : dict.settings.testConnectionButton}</span>
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetApiUrl}
              title={dict.settings.resetButton}
              className="min-h-[42px] px-3 py-2 text-slate-500 hover:text-slate-800 hover:bg-sand-100 rounded-xl flex items-center gap-1.5 transition-colors active:scale-[0.98] text-xs font-semibold cursor-pointer border border-transparent hover:border-sand-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{dict.settings.resetButton}</span>
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveApiUrl}
              title={dict.buttons.save}
              className="min-h-[42px] px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white font-bold rounded-xl shadow-2xs hover:shadow-soft transition-all active:scale-[0.98] cursor-pointer text-xs flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{dict.buttons.save}</span>
            </button>
          </div>
        </div>

        {/* 3. Feedback Alerts */}
        {testResult.status === 'success' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{testResult.message}</span>
          </div>
        )}

        {testResult.status === 'error' && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2 animate-fade-in shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{testResult.message}</span>
          </div>
        )}

        {savedSuccess && (
          <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{dict.settings.savedSuccess}</span>
          </p>
        )}

        {/* 4. Admin Sync Engine Diagnostics (Collapsible Section) */}
        <div className="pt-3 border-t border-sand-200/80">
          <button
            type="button"
            onClick={() => setIsSyncExpanded(!isSyncExpanded)}
            className="w-full flex items-center justify-between py-1.5 px-2 text-left rounded-xl hover:bg-sand-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-ocean-600 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-bold text-slate-800">
                  {dict.adminSync.syncStatusTitle}
                </span>
                <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">
                  {dict.adminSync.syncStatusDesc}
                </span>
              </div>
            </div>
            {isSyncExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {isSyncExpanded && (
            <div className="mt-3 p-3.5 bg-sand-50/70 border border-sand-200 rounded-xl space-y-3 animate-fade-in">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="password"
                    value={syncToken}
                    onChange={(e) => setSyncToken(e.target.value)}
                    placeholder={dict.adminSync.tokenPlaceholder}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-sand-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ocean-200 focus:border-ocean-400 transition-all shadow-2xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTestSync}
                  disabled={isTestingSync}
                  aria-busy={isTestingSync}
                  className="min-h-[38px] px-3.5 py-2 text-ocean-700 bg-ocean-50 hover:bg-ocean-100/90 border border-ocean-200 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shadow-2xs transition-all active:scale-[0.98]"
                >
                  {isTestingSync ? (
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>{isTestingSync ? dict.adminSync.testTokenTesting : dict.adminSync.testTokenButton}</span>
                </button>
              </div>

              {/* Sync Test Results */}
              {syncResult.status === 'success' && (
                <div className="space-y-2 animate-fade-in">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{syncResult.message}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 bg-white border border-sand-200 rounded-xl flex items-center gap-2">
                      <HardDrive className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-slate-400 block">{dict.adminSync.syncActiveUnits}:</span>
                        <strong className="text-slate-800 truncate block">
                          {syncResult.totalFiles ?? 0} Ünite {syncResult.totalBytes ? `(${(syncResult.totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB)` : ''}
                        </strong>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white border border-sand-200 rounded-xl flex items-center gap-2">
                      <Server className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-slate-400 block">{dict.adminSync.syncStoragePath}:</span>
                        <strong className="text-slate-800 font-mono text-[10px] truncate block" title={syncResult.storagePath}>
                          {syncResult.storagePath || 'data/audio'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {syncResult.status === 'error' && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2 animate-fade-in shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{syncResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
