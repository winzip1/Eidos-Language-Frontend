import React from 'react';
import { Info, Cpu, Database, Smartphone, ShieldCheck } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';

export const SystemInfoCard: React.FC = () => {
  const { dict } = useDictionary();

  const specs = [
    {
      label: dict.settings.systemInfoArchitecture,
      value: dict.settings.systemInfoArchitectureValue,
      icon: Cpu,
      iconColor: 'text-ocean-600',
    },
    {
      label: dict.settings.systemInfoEngine,
      value: dict.settings.systemInfoEngineValue,
      icon: Database,
      iconColor: 'text-amber-600',
    },
    {
      label: dict.settings.systemInfoPlatform,
      value: dict.settings.systemInfoPlatformValue,
      icon: Smartphone,
      iconColor: 'text-purple-600',
    },
    {
      label: dict.settings.systemInfoPrinciples,
      value: dict.settings.systemInfoPrinciplesValue,
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      fullWidth: true,
    },
  ];

  return (
    <div className="pt-4 border-t border-sand-100 bg-sand-50/70 p-5 rounded-2xl border border-sand-200 space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
          <Info className="w-4 h-4 text-ocean-600" />
          <span>{dict.settings.systemInfoTitle}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{dict.badges.online}</span>
        </span>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
        {dict.settings.systemInfoDesc}
      </p>

      {/* Tech Specifications Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
        {specs.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-2.5 bg-white rounded-xl border border-sand-200 shadow-2xs flex items-center gap-2.5 ${
                item.fullWidth ? 'sm:col-span-2' : ''
              }`}
            >
              <Icon className={`w-4 h-4 ${item.iconColor} shrink-0`} />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">
                  {item.label}
                </span>
                <span className="text-xs font-bold text-slate-700 truncate block mt-0.5">
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
