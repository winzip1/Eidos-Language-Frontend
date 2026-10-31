/**
 * Eidos Language OS - Drive Honest Empty State
 * Dürüst boş durumlar: Drive bağlantısızlığı, boş klasör ve sonuçsuz arama.
 * NO MOCK DATA & ZERO HARDCODE & STRICTLY LIGHT THEME.
 */
import React from 'react';
import { FolderOpen, SearchX, CloudOff, Upload, RotateCcw } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';

export type DriveEmptyStateType = 'not_connected' | 'empty_folder' | 'no_search_results';

export interface DriveEmptyStateProps {
  type: DriveEmptyStateType;
  onConnect?: () => void;
  onUpload?: () => void;
  onClearSearch?: () => void;
  isConnecting?: boolean;
  className?: string;
}

export const DriveEmptyState: React.FC<DriveEmptyStateProps> = ({
  type,
  onConnect,
  onUpload,
  onClearSearch,
  isConnecting = false,
  className = '',
}) => {
  const { dict } = useDictionary();

  // ============================================================================
  // NOT CONNECTED VIEW
  // ============================================================================
  if (type === 'not_connected') {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-sand-200/90 rounded-3xl shadow-soft max-w-md mx-auto my-8 select-none ${className}`}
      >
        <div className="w-16 h-16 rounded-2xl bg-ocean-50 text-ocean-600 flex items-center justify-center mb-4 border border-ocean-200/60 shadow-2xs">
          <CloudOff className="w-8 h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight mb-2">
          {dict.googleDrive.emptyDriveNotice}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
          {dict.googleDrive.connectPromptDesc}
        </p>
        {onConnect && (
          <button
            type="button"
            onClick={onConnect}
            disabled={isConnecting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-soft hover:shadow-md transition-all active:scale-95 cursor-pointer min-h-[44px]"
          >
            {/* Google G Logo SVG */}
            <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isConnecting ? dict.googleDrive.connectingState : dict.googleDrive.connectButton}</span>
          </button>
        )}
      </div>
    );
  }

  // ============================================================================
  // EMPTY FOLDER VIEW
  // ============================================================================
  if (type === 'empty_folder') {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-sand-200/90 rounded-3xl shadow-soft max-w-md mx-auto my-8 select-none ${className}`}
      >
        <div className="w-16 h-16 rounded-2xl bg-sand-50 text-amber-500 flex items-center justify-center mb-4 border border-sand-200/60 shadow-2xs">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight mb-2">
          {dict.googleDrive.emptyFolder}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
          {dict.googleDrive.dragAndDropPrompt}
        </p>
        {onUpload && (
          <button
            type="button"
            onClick={onUpload}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-soft hover:shadow-md transition-all active:scale-95 cursor-pointer min-h-[44px]"
          >
            <Upload className="w-4 h-4" />
            <span>{dict.googleDrive.uploadFileButton}</span>
          </button>
        )}
      </div>
    );
  }

  // ============================================================================
  // NO SEARCH RESULTS VIEW
  // ============================================================================
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-sand-200/90 rounded-3xl shadow-soft max-w-md mx-auto my-8 select-none ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-sand-50 text-slate-400 flex items-center justify-center mb-4 border border-sand-200/60 shadow-2xs">
        <SearchX className="w-8 h-8" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight mb-2">
        {dict.googleDrive.noMatchingFiles}
      </h3>
      {onClearSearch && (
        <button
          type="button"
          onClick={onClearSearch}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-sand-100 hover:bg-sand-200/80 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold border border-sand-200/90 transition-all active:scale-95 cursor-pointer min-h-[44px] mt-4"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{dict.googleDrive.clearFilterAction}</span>
        </button>
      )}
    </div>
  );
};
