import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React ErrorBoundary error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-sand-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-rose-200 p-8 shadow-soft-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Arayüz Hatası (FAIL-LOUD)
            </h2>

            <p className="text-sm text-slate-600">
              Uygulama çalışırken beklenmeyen bir hata ile karşılaşıldı.
            </p>

            {this.state.error && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left font-mono text-xs text-rose-700 overflow-x-auto max-h-40">
                <p className="font-bold">{this.state.error.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[11px] text-slate-500 mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-bold shadow-soft-sm hover:shadow-soft-md transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sayfayı Yenile</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
