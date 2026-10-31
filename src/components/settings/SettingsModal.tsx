import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Sliders,
  UserCircle,
  UserCheck,
  Database,
  Users,
  Settings2,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { LanguageSettingCard } from './LanguageSettingCard';
import { ServerConnectionCard } from './ServerConnectionCard';
import { AudioPreferencesCard } from './AudioPreferencesCard';
import { DataBackupResetCard } from './DataBackupResetCard';
import { SystemInfoCard } from './SystemInfoCard';
import { AccountSettingsCard } from './AccountSettingsCard';
import { UserManagementCard } from '../admin/UserManagementCard';
import { SystemMaintenancePanel } from '../admin/SystemMaintenancePanel';

export type SettingsTab =
  | 'general'
  | 'playback'
  | 'account'
  | 'backup'
  | 'users'
  | 'maintenance';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab,
}) => {
  const { dict } = useDictionary();
  const { isAdmin, user } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (initialTab && (initialTab !== 'users' && initialTab !== 'maintenance' || isAdmin)) {
      return initialTab;
    }
    return 'general';
  });

  // Role-based tab list calculation
  const tabs = useMemo(() => {
    const baseTabs = [
      { id: 'general' as const, label: dict.settings.tabGeneral, icon: Globe },
      { id: 'playback' as const, label: dict.settings.tabPlayback, icon: Sliders },
      {
        id: 'account' as const,
        label: dict.settings.tabAccount,
        icon: user ? UserCheck : UserCircle,
      },
      { id: 'backup' as const, label: dict.settings.tabBackup, icon: Database },
    ];

    if (isAdmin) {
      return [
        ...baseTabs,
        { id: 'users' as const, label: dict.settings.tabUsers, icon: Users },
        { id: 'maintenance' as const, label: dict.settings.tabMaintenance, icon: Settings2 },
      ];
    }

    return baseTabs;
  }, [
    isAdmin,
    user,
    dict.settings.tabGeneral,
    dict.settings.tabPlayback,
    dict.settings.tabAccount,
    dict.settings.tabBackup,
    dict.settings.tabUsers,
    dict.settings.tabMaintenance,
  ]);

  // Sync with initialTab prop when modal opens
  useEffect(() => {
    if (isOpen && initialTab) {
      const isAllowed = isAdmin || (initialTab !== 'users' && initialTab !== 'maintenance');
      if (isAllowed) {
        setActiveTab(initialTab);
      } else {
        setActiveTab('general');
      }
    }
  }, [isOpen, initialTab, isAdmin]);

  // Fail-Safe Tab Guard: if activeTab is not in allowed tabs, safely fall back to 'general'
  useEffect(() => {
    const isCurrentTabAllowed = tabs.some((t) => t.id === activeTab);
    if (!isCurrentTabAllowed) {
      setActiveTab('general');
    }
  }, [tabs, activeTab]);

  // Dynamic canvas width based on active tab complexity
  const modalMaxWidth =
    activeTab === 'users' || activeTab === 'maintenance'
      ? 'max-w-5xl'
      : 'max-w-2xl';

  const gridColsClass =
    tabs.length === 6
      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6'
      : 'grid grid-cols-2 sm:grid-cols-4';

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % tabs.length;
      setActiveTab(tabs[nextIndex].id);
      const nextElem = document.getElementById(`settings-tab-${tabs[nextIndex].id}`);
      nextElem?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prevIndex].id);
      const prevElem = document.getElementById(`settings-tab-${tabs[prevIndex].id}`);
      prevElem?.focus();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dict.settings.title}
      subtitle={dict.settings.subtitle}
      icon={<Sliders className="w-4 h-4 text-ocean-600" />}
      maxWidthClass={modalMaxWidth}
    >
      <div className="space-y-4">
        {/* Responsive Segmented Tab Navigation (No horizontal overflow) */}
        <div
          role="tablist"
          aria-label={dict.settings.title}
          className={`${gridColsClass} gap-1.5 bg-sand-100/90 p-1.5 rounded-2xl border border-sand-200 select-none`}
        >
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                id={`settings-tab-${tab.id}`}
                aria-controls={`settings-panel-${tab.id}`}
                title={tab.label}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={`min-h-[42px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40 active:scale-[0.98] ${
                  isActive
                    ? 'bg-white text-ocean-800 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-ocean-600' : 'text-slate-400'}`}
                  aria-hidden="true"
                />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels (Smooth key-based animated transition) */}
        <div key={activeTab} className="animate-fade-in pt-1">
          {activeTab === 'general' && (
            <div
              role="tabpanel"
              id="settings-panel-general"
              aria-labelledby="settings-tab-general"
              className="space-y-4 focus:outline-none"
            >
              <LanguageSettingCard />
              <ServerConnectionCard />
              <SystemInfoCard />
            </div>
          )}

          {activeTab === 'playback' && (
            <div
              role="tabpanel"
              id="settings-panel-playback"
              aria-labelledby="settings-tab-playback"
              className="space-y-4 focus:outline-none"
            >
              <AudioPreferencesCard />
            </div>
          )}

          {activeTab === 'account' && (
            <div
              role="tabpanel"
              id="settings-panel-account"
              aria-labelledby="settings-tab-account"
              className="space-y-4 focus:outline-none"
            >
              <AccountSettingsCard onLogoutSuccess={onClose} />
            </div>
          )}

          {activeTab === 'backup' && (
            <div
              role="tabpanel"
              id="settings-panel-backup"
              aria-labelledby="settings-tab-backup"
              className="space-y-4 focus:outline-none"
            >
              <DataBackupResetCard />
            </div>
          )}

          {activeTab === 'users' && isAdmin && (
            <div
              role="tabpanel"
              id="settings-panel-users"
              aria-labelledby="settings-tab-users"
              className="space-y-4 focus:outline-none"
            >
              <UserManagementCard />
            </div>
          )}

          {activeTab === 'maintenance' && isAdmin && (
            <div
              role="tabpanel"
              id="settings-panel-maintenance"
              aria-labelledby="settings-tab-maintenance"
              className="space-y-4 focus:outline-none"
            >
              <SystemMaintenancePanel />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
