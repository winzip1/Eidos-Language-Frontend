import React, { useState } from 'react';
import {
  Server,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Zap,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { getApiBaseUrl, apiRequest } from '../../services/apiClient';

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

  const handleSaveApiUrl = () => {
    try {
      if (customApiUrl.trim()) {
        localStorage.setItem('eidos_custom_api_url', customApiUrl.trim());
      } else {
        localStorage.removeItem('eidos_custom_api_url');
      }
    } catch {
      // Ignore storage errors
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
    setSavedSuccess(true);
    refreshDictionary();
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult({ status: 'idle' });
    const startTime = performance.now();

    const targetBase = customApiUrl.trim()
      ? customApiUrl.trim().replace(/\/+$/, '')
      : getApiBaseUrl();

    try {
      let res: { status?: string; version?: string } | null = null;

      try {
        const fetchRes = await fetch(`${targetBase}/api/v1/health`, {
          headers: { Accept: 'application/json' },
        });
        if (fetchRes.ok) {
          res = await fetchRes.json();
        }
      } catch {
        // Try root health
      }

      if (!res || res.status !== 'healthy') {
        const fetchRes = await fetch(`${targetBase}/health`, {
          headers: { Accept: 'application/json' },
        });
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
          message: dict.settings.testConnectionFailed,
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err?.message || dict.settings.testConnectionFailed,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-3 pt-4 border-t border-sand-100">
      <div>
        <label className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-1">
          <Server className="w-4 h-4 text-ocean-600" />
          <span>{dict.settings.serverUrlLabel}</span>
        </label>
        <p className="text-[11px] text-slate-400">
          {dict.settings.serverUrlDesc}
        </p>
      </div>

      <div className="space-y-2.5">
        <input
          type="text"
          value={customApiUrl}
          onChange={(e) => setCustomApiUrl(e.target.value)}
          placeholder={dict.settings.serverUrlPlaceholder}
          className="w-full px-3.5 py-2.5 bg-sand-50/70 border border-sand-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-ocean-200 focus:border-ocean-300 transition-all"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{dict.settings.activeServerLabel}:</span>
            <strong className="text-slate-700 font-mono text-[10px] bg-sand-100 px-2 py-0.5 rounded-md border border-sand-200">
              {getApiBaseUrl()}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-2.5 py-1 text-ocean-700 hover:text-ocean-900 hover:bg-ocean-50 border border-ocean-200 rounded-lg flex items-center gap-1 transition-all active:scale-95 text-[11px] font-bold cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <Activity className="w-3 h-3 animate-spin" />
              ) : (
                <Zap className="w-3 h-3" />
              )}
              <span>{isTesting ? dict.settings.testConnectionTesting : dict.settings.testConnectionButton}</span>
            </button>

            <button
              type="button"
              onClick={handleResetApiUrl}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-sand-100 rounded-lg flex items-center gap-1 transition-colors active:scale-95 text-[11px] font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{dict.settings.resetButton}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveApiUrl}
              className="px-3.5 py-1 bg-ocean-600 hover:bg-ocean-700 text-white font-bold rounded-lg shadow-2xs hover:shadow-soft transition-all active:scale-95 cursor-pointer text-[11px]"
            >
              {dict.buttons.save}
            </button>
          </div>
        </div>

        {/* Live Test Results */}
        {testResult.status === 'success' && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{testResult.message}</span>
          </div>
        )}

        {testResult.status === 'error' && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2 animate-fade-in">
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
      </div>
    </div>
  );
};
