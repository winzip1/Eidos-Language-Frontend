import React from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

export interface ErrorToastProps {
  message: string;
  statusCode?: number;
  errorCode?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  statusCode,
  errorCode,
  onDismiss,
  onRetry,
  retryLabel = 'Yeniden Dene',
}) => {
  return (
    <div
      role="alert"
      className="flex items-start gap-3.5 p-4 bg-red-50/90 border border-red-200/90 rounded-2xl shadow-soft text-red-900 my-3 animate-fade-in"
    >
      <div className="w-8 h-8 rounded-xl bg-red-100/80 flex items-center justify-center flex-shrink-0 mt-0.5 text-red-600 border border-red-200/60">
        <AlertTriangle className="w-4 h-4" />
      </div>
      
      <div className="flex-1 text-xs leading-relaxed">
        <div className="font-semibold text-red-900 flex items-center gap-1.5 mb-0.5">
          <span>{statusCode ? `HTTP ${statusCode}` : 'Bağlantı Hatası'}</span>
          {errorCode && (
            <span className="font-mono text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded border border-red-200">
              {errorCode}
            </span>
          )}
        </div>
        <p className="text-red-800/90">{message}</p>
        
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{retryLabel}</span>
          </button>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Kapat"
          className="text-red-400 hover:text-red-700 p-1.5 rounded-xl hover:bg-red-100/80 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
