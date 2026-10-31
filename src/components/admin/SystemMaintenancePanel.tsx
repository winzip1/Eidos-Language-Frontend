import React, { useState } from 'react';
import {
  Settings2,
  ScrollText,
  Activity,
  Archive,
  LayoutGrid,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { SystemTelemetryCard } from './SystemTelemetryCard';
import { DatabaseMaintenanceCard } from './DatabaseMaintenanceCard';
import { DatabaseBackupsTable } from './DatabaseBackupsTable';
import { SystemLogsViewerModal } from './SystemLogsViewerModal';

export interface SystemMaintenancePanelProps {
  className?: string;
}

export type MaintenanceSubTab = 'all' | 'telemetry' | 'backups';

export const SystemMaintenancePanel: React.FC<SystemMaintenancePanelProps> = ({
  className = '',
}) => {
  const { dict } = useDictionary();
  const [activeSubTab, setActiveSubTab] = useState<MaintenanceSubTab>('all');
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Top Bar with Title, Sub-tabs & Logs Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {dict.systemMaintenance.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {dict.systemMaintenance.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Sub-tab Filter Switcher */}
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs shadow-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeSubTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
              <span>{dict.userManagement.filterRoleAll}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('telemetry')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeSubTab === 'telemetry'
                  ? 'bg-white text-ocean-700 shadow-xs'
                  : 'text-slate-500 hover:text-ocean-700'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-ocean-500" />
              <span>{dict.systemMaintenance.tabTelemetry}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('backups')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeSubTab === 'backups'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-500 hover:text-amber-700'
              }`}
            >
              <Archive className="w-3.5 h-3.5 text-amber-500" />
              <span>{dict.systemMaintenance.tabBackups}</span>
            </button>
          </div>

          {/* Open Logs Viewer Modal Button */}
          <button
            type="button"
            onClick={() => setIsLogsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
          >
            <ScrollText className="w-4 h-4 text-indigo-600" />
            <span>{dict.systemMaintenance.tabLogs}</span>
          </button>
        </div>
      </div>

      {/* Grid: Live Telemetry & Database Health Cards */}
      {(activeSubTab === 'all' || activeSubTab === 'telemetry') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <SystemTelemetryCard />
          <DatabaseMaintenanceCard />
        </div>
      )}

      {/* Full-width Physical Backups Table */}
      {(activeSubTab === 'all' || activeSubTab === 'backups') && (
        <DatabaseBackupsTable />
      )}

      {/* System Audit Logs Modal */}
      <SystemLogsViewerModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
      />
    </div>
  );
};
