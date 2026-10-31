/**
 * Eidos Language OS - Google Drive Account & Cloud Sync Settings Card
 * Yacht-Deck Premium Light Theme aesthetic (Pure White, Soft Sand/Slate, Ocean Blue, Emerald).
 * Single Source of Truth architecture (DB authority via /api/drive/status).
 * ZERO HARDCODE: All labels, status badges, buttons, and error messages from dictionary.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  Unlink,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ExternalLink,
  FolderCheck,
  FolderSync,
  HardDrive,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDictionary } from '../../context/DictionaryContext';
import { Modal } from '../common/Modal';
import { CloudBackupSection } from './CloudBackupSection';
import {
  getDriveStatus,
  getGoogleAuthUrl,
  disconnectDrive,
  getDriveStorageQuota,
  initDriveTaxonomy,
  type DriveConnectionStatus,
  type DriveStorageQuota,
} from '../../services/driveApiClient';

export interface GoogleAccountCardProps {
  className?: string;
  onStatusChange?: (status: DriveConnectionStatus) => void;
}

export const GoogleAccountCard: React.FC<GoogleAccountCardProps> = ({
  className = '',
  onStatusChange,
}) => {
  const { dict } = useDictionary();

  const [status, setStatus] = useState<DriveConnectionStatus | null>(null);
  const [quota, setQuota] = useState<DriveStorageQuota | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isQuotaLoading, setIsQuotaLoading] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);
  const [isInitializingTaxonomy, setIsInitializingTaxonomy] = useState<boolean>(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState<boolean>(false);

  const popupRef = useRef<Window | null>(null);

  // Helper to format byte counts into human-readable representation
  const formatBytes = (bytesStr?: string | null): string => {
    if (!bytesStr) return '0 B';
    const b = parseInt(bytesStr, 10);
    if (isNaN(b) || b <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return `${(b / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  // Single Source of Truth: Fetch connection status and quota directly from backend DB
  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDriveStatus();
      setStatus(data);
      onStatusChange?.(data);

      if (data.isConnected) {
        setIsQuotaLoading(true);
        try {
          const quotaRes = await getDriveStorageQuota();
          if (quotaRes.success && quotaRes.quota) {
            setQuota(quotaRes.quota);
          }
        } catch (quotaErr) {
          console.warn('[GoogleAccountCard] Failed to fetch drive quota:', quotaErr);
        } finally {
          setIsQuotaLoading(false);
        }
      } else {
        setQuota(null);
      }
    } catch (err: any) {
      console.error('[GoogleAccountCard] Failed to fetch drive status:', err);
      // Fail-loud notification
      toast.error(dict.googleDrive.connectionError, {
        description: err?.message || String(err),
      });
      setStatus({
        isConnected: false,
        email: null,
        refreshTokenPresent: false,
        grantedScopes: [],
      });
      setQuota(null);
    } finally {
      setIsLoading(false);
    }
  }, [dict.googleDrive.connectionError, onStatusChange]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Secure postMessage listener for popup authorization flow
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          setIsConnecting(false);
          if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
          }
          toast.success(dict.googleAuth.callbackSuccess, {
            description: event.data.email
              ? `${dict.googleDrive.connectedAsLabel} ${event.data.email}`
              : dict.googleAuth.popupSuccessMessage,
          });
          loadStatus();
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          setIsConnecting(false);
          if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
          }
          toast.error(event.data.title || dict.googleDrive.connectionError, {
            description: event.data.error || dict.googleAuth.popupErrorTitle,
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [
    dict.googleAuth.callbackSuccess,
    dict.googleAuth.popupSuccessMessage,
    dict.googleAuth.popupErrorTitle,
    dict.googleDrive.connectedAsLabel,
    dict.googleDrive.connectionError,
    loadStatus,
  ]);

  // Initiates Google OAuth consent in a centered popup window
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { url } = await getGoogleAuthUrl();
      if (!url) {
        throw new Error(dict.googleAuth.missingCredentials);
      }

      const width = 500;
      const height = 620;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        url,
        'EidosGoogleAuth',
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=no,resizable=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Pop-up blocker intercepted
        window.location.href = url;
        return;
      }

      popupRef.current = popup;
      popup.focus();

      // Monitor popup closure if user closes it manually without completing
      const checkTimer = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(checkTimer);
          setIsConnecting(false);
        }
      }, 800);
    } catch (err: any) {
      setIsConnecting(false);
      console.error('[GoogleAccountCard] Connect error:', err);
      toast.error(dict.googleDrive.connectionError, {
        description: err?.message || String(err),
      });
    }
  };

  // Disconnect Google Drive account
  const handleConfirmDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const res = await disconnectDrive();
      setShowDisconnectModal(false);
      toast.success(res.message || dict.googleAuth.disconnectSuccess);
      await loadStatus();
    } catch (err: any) {
      console.error('[GoogleAccountCard] Disconnect error:', err);
      toast.error(dict.googleDrive.connectionError, {
        description: err?.message || String(err),
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Explicit Taxonomy Initialization / Refresh
  const handleInitTaxonomy = async () => {
    setIsInitializingTaxonomy(true);
    try {
      const res = await initDriveTaxonomy();
      toast.success(res.message || dict.googleDrive.initSuccess);
      await loadStatus();
    } catch (err: any) {
      console.error('[GoogleAccountCard] Taxonomy init error:', err);
      toast.error(dict.googleDrive.connectionError, {
        description: err?.message || String(err),
      });
    } finally {
      setIsInitializingTaxonomy(false);
    }
  };

  // Calculate quota percentage safely
  const quotaLimit = quota?.limitBytes ? parseInt(quota.limitBytes, 10) : 0;
  const quotaUsage = quota?.usageBytes ? parseInt(quota.usageBytes, 10) : 0;
  const quotaPct = quotaLimit > 0 ? Math.min(100, Math.round((quotaUsage / quotaLimit) * 100)) : 0;

  return (
    <div className={`space-y-4 pt-1 animate-fade-in ${className}`}>
      {/* Main Account Card Container */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-sand-200/90 shadow-2xs">
        {/* Header Section (Responsive 360dp optimized) */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-sand-100">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-ocean-50 border border-ocean-200/80 flex items-center justify-center text-ocean-600 shadow-2xs shrink-0 select-none mt-0.5">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 truncate">
                  {dict.googleDrive.title}
                </h3>
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                ) : status?.isConnected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{dict.googleDrive.connectedBadge}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sand-100 text-slate-500 border border-sand-200">
                    <AlertCircle className="w-3 h-3 text-slate-400" />
                    <span>{dict.googleDrive.disconnectedBadge}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                {dict.googleDrive.cloudStorageDesc}
              </p>
            </div>
          </div>

          {/* Refresh Action Button */}
          <button
            type="button"
            onClick={loadStatus}
            disabled={isLoading}
            title={dict.buttons.refresh}
            aria-label={dict.buttons.refresh}
            className="p-2 text-slate-400 hover:text-ocean-600 hover:bg-ocean-50 active:bg-ocean-100 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40 shrink-0 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Dynamic Card Body based on honest connection state */}
        <div className="pt-4">
          {isLoading ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-ocean-600" />
              <span>{dict.globalPlayer.buffering}</span>
            </div>
          ) : status?.isConnected ? (
            /* Connected State View */
            <div className="space-y-3.5">
              {/* Account Identity & Disconnect Button Row */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-sand-50/70 to-ocean-50/30 border border-sand-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                      {dict.googleDrive.connectedAsLabel}
                    </span>
                    <span
                      className="text-xs font-bold text-slate-800 truncate"
                      title={status.email || undefined}
                    >
                      {status.email || '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{dict.googleDrive.persistentTokenNotice}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDisconnectModal(true)}
                  disabled={isDisconnecting}
                  className="min-h-[44px] w-full sm:w-auto px-4 py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
                >
                  {isDisconnecting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Unlink className="w-3.5 h-3.5" />
                  )}
                  <span>{dict.googleDrive.disconnectButton}</span>
                </button>
              </div>

              {/* Storage Quota Progress Bar Card */}
              <div className="p-3.5 rounded-xl bg-white border border-sand-200/80 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-ocean-600" />
                    <span>{dict.googleDrive.quotaUsageLabel}</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 font-semibold">
                    {isQuotaLoading ? (
                      <span className="text-slate-400">{dict.globalPlayer.buffering}</span>
                    ) : quota ? (
                      `${formatBytes(quota.usageBytes)} / ${
                        quota.limitBytes ? formatBytes(quota.limitBytes) : dict.googleDrive.unlimitedQuotaLabel
                      } ${quotaLimit > 0 ? `(${quotaPct}%)` : ''}`
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
                {quotaLimit > 0 && (
                  <div className="w-full h-1.5 bg-sand-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        quotaPct > 90
                          ? 'bg-rose-500'
                          : quotaPct > 75
                          ? 'bg-amber-500'
                          : 'bg-ocean-600'
                      }`}
                      style={{ width: `${quotaPct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Taxonomy Status & Sync Panel */}
              <div className="p-3.5 rounded-xl bg-sand-50/60 border border-sand-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-sand-200 flex items-center justify-center text-ocean-600 shadow-2xs shrink-0">
                    <FolderCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {dict.googleDrive.rootFolderTitle}
                      </span>
                      {status.isInitialized ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {dict.googleDrive.taxonomyReadyBadge}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sand-200/80 text-slate-600 border border-sand-300">
                          {dict.googleDrive.taxonomyNotReadyBadge}
                        </span>
                      )}
                    </div>
                    <span
                      className="text-[11px] text-slate-400 block truncate"
                      title={dict.googleDrive.taxonomyFoldersSummary}
                    >
                      {dict.googleDrive.taxonomyFoldersSummary}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleInitTaxonomy}
                  disabled={isInitializingTaxonomy}
                  className="min-h-[40px] sm:min-h-[36px] w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-ocean-50 active:bg-ocean-100 text-ocean-700 hover:text-ocean-800 border border-sand-200 hover:border-ocean-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
                >
                  {isInitializingTaxonomy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FolderSync className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {status.isInitialized
                      ? dict.googleDrive.syncTaxonomyButton
                      : dict.googleDrive.initTaxonomyButton}
                  </span>
                </button>
              </div>

              {/* Granted Scopes Tag Pills */}
              {status.grantedScopes.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 block">
                    {dict.googleDrive.scopesLabel}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {status.grantedScopes.map((scope) => (
                      <span
                        key={scope}
                        className="px-2 py-0.5 rounded-md bg-sand-100/90 text-slate-600 text-[10px] font-mono border border-sand-200/80"
                      >
                        {scope.split('/').pop() || scope}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cloud System Backup & Hot Restore Panel (Zero-Transfer) */}
              <CloudBackupSection onRestoreSuccess={loadStatus} />
            </div>
          ) : (
            /* Disconnected Honest Empty State View */
            <div className="p-4 sm:p-5 rounded-xl bg-sand-50/50 border border-sand-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {dict.googleDrive.emptyDriveState}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ExternalLink className="w-3 h-3 text-ocean-600" />
                  <span>{dict.googleDrive.sslSecureNotice}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConnect}
                disabled={isConnecting}
                className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 bg-ocean-600 hover:bg-ocean-700 active:bg-ocean-800 text-white font-bold text-xs rounded-xl shadow-2xs hover:shadow-soft transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{dict.googleDrive.connectingState}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span>{dict.googleDrive.connectButton}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Disconnect Safety Confirmation Modal */}
      <Modal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        title={dict.googleDrive.disconnectConfirmTitle}
        subtitle={dict.googleDrive.disconnectConfirmMessage}
        icon={<Unlink className="w-4 h-4 text-rose-600" />}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {dict.googleDrive.disconnectConfirmMessage}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowDisconnectModal(false)}
              className="min-h-[44px] px-4 py-2 bg-sand-100 hover:bg-sand-200 active:bg-sand-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40 active:scale-[0.98]"
            >
              {dict.googleDrive.disconnectCancelButton}
            </button>
            <button
              type="button"
              onClick={handleConfirmDisconnect}
              disabled={isDisconnecting}
              className="min-h-[44px] px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-2xs hover:shadow-soft transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
            >
              {isDisconnecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{dict.googleDrive.disconnectButton}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
