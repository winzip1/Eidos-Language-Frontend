/**
 * Eidos Language OS - Drive Action & Filter Toolbar
 * Action triggers (New Folder, Upload, Refresh, View Switch) and type filters.
 * Responsive layout optimized for desktop and 360dp mobile devices.
 * STRICTLY LIGHT THEME & ZERO HARDCODE.
 */
import React from 'react';
import {
  Search,
  X,
  Upload,
  FolderPlus,
  RotateCw,
  LayoutGrid,
  List,
  Music,
  FileText,
  Archive,
  Folder,
  Layers,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';

export type DriveFilterType = 'all' | 'audio' | 'transcripts' | 'backups' | 'folders';

export interface DriveToolbarCounts {
  all: number;
  audio: number;
  transcripts: number;
  backups: number;
  folders: number;
}

export interface DriveToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: DriveFilterType;
  onFilterChange: (filter: DriveFilterType) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onUploadClick: () => void;
  onNewFolderClick: () => void;
  onRefreshClick: () => void;
  isLoading?: boolean;
  counts?: DriveToolbarCounts;
  className?: string;
}

export const DriveToolbar: React.FC<DriveToolbarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  onUploadClick,
  onNewFolderClick,
  onRefreshClick,
  isLoading = false,
  counts,
  className = '',
}) => {
  const { dict } = useDictionary();

  const filterItems: Array<{
    id: DriveFilterType;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
  }> = [
    { id: 'all', label: dict.googleDrive.allFilesLabel, icon: Layers, count: counts?.all },
    { id: 'audio', label: dict.googleDrive.filterAudio, icon: Music, count: counts?.audio },
    { id: 'transcripts', label: dict.googleDrive.filterTranscripts, icon: FileText, count: counts?.transcripts },
    { id: 'backups', label: dict.googleDrive.filterBackups, icon: Archive, count: counts?.backups },
    { id: 'folders', label: dict.googleDrive.filterFolders, icon: Folder, count: counts?.folders },
  ];

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Top Row: Search and Action Buttons */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={dict.googleDrive.searchFilesPlaceholder}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-sand-200/90 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/10 shadow-2xs transition-all min-h-[44px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label={dict.googleDrive.clearSearchAction}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons Cluster */}
        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
          {/* New Folder Action */}
          <button
            type="button"
            onClick={onNewFolderClick}
            disabled={isLoading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-sand-50 text-slate-700 hover:text-slate-900 border border-sand-200/90 rounded-xl text-xs sm:text-sm font-medium shadow-2xs transition-all active:scale-95 cursor-pointer min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            <FolderPlus className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">{dict.googleDrive.newFolderButton}</span>
          </button>

          {/* Upload File Action */}
          <button
            type="button"
            onClick={onUploadClick}
            disabled={isLoading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-soft hover:shadow-md transition-all active:scale-95 cursor-pointer min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span className="truncate">{dict.googleDrive.uploadFileButton}</span>
          </button>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={onRefreshClick}
            disabled={isLoading}
            aria-label={dict.googleDrive.refresh}
            title={dict.googleDrive.refresh}
            className="flex items-center justify-center w-11 h-11 bg-white hover:bg-sand-50 text-slate-600 hover:text-slate-900 border border-sand-200/90 rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-ocean-600' : ''}`} />
          </button>

          {/* Grid / List Mode Toggle */}
          <div className="flex items-center bg-sand-100/70 p-0.5 rounded-xl border border-sand-200/70 shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-label={dict.googleDrive.viewGrid}
              title={dict.googleDrive.viewGrid}
              className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-ocean-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-label={dict.googleDrive.viewList}
              title={dict.googleDrive.viewList}
              className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-ocean-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
        {filterItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeFilter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterChange(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer active:scale-95 select-none border min-h-[36px] ${
                isActive
                  ? 'bg-ocean-50 text-ocean-700 border-ocean-300 font-semibold shadow-2xs'
                  : 'bg-white hover:bg-sand-50/80 text-slate-600 hover:text-slate-900 border-sand-200/90'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-ocean-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {typeof item.count === 'number' && (
                <span
                  className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                    isActive ? 'bg-ocean-200/60 text-ocean-800' : 'bg-sand-100 text-slate-500'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
