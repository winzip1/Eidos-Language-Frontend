import React, { useState } from 'react';
import { Globe, Sliders, Server, Database } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { Modal } from '../common/Modal';
import { LanguageSettingCard } from './LanguageSettingCard';
import { ServerConnectionCard } from './ServerConnectionCard';
import { AudioPreferencesCard } from './AudioPreferencesCard';
import { DataBackupResetCard } from './DataBackupResetCard';
import { SystemInfoCard } from './SystemInfoCard';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'playback' | 'backup' | 'system';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { dict } = useDictionary();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const tabs = [
    { id: 'general' as const, label: dict.settings.tabGeneral, icon: Globe },
    { id: 'playback' as const, label: dict.settings.tabPlayback, icon: Sliders },
    { id: 'backup' as const, label: dict.settings.tabBackup, icon: Database },
    { id: 'system' as const, label: dict.settings.tabSystem, icon: Server },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dict.settings.title}
      subtitle={dict.settings.subtitle}
      icon={<Sliders className="w-4 h-4 text-ocean-600" />}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Segmented Top Tab Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-sand-100/80 p-1 rounded-2xl border border-sand-200 select-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-white text-ocean-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-ocean-600' : 'text-slate-400'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents with smooth fade */}
        <div className="animate-fade-in space-y-4">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <LanguageSettingCard />
              <SystemInfoCard />
            </div>
          )}

          {activeTab === 'playback' && (
            <div className="space-y-4">
              <AudioPreferencesCard />
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <DataBackupResetCard />
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-4">
              <ServerConnectionCard />
              <SystemInfoCard />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
