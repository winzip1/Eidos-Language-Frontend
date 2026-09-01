import React from 'react';
import { Globe, Check } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';

export const LanguageSettingCard: React.FC = () => {
  const { dict, locale, setLocale, availableLocales } = useDictionary();

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-ocean-600" />
          <span>{dict.settings.languageLabel}</span>
        </label>
        <p className="text-[11px] text-slate-400">
          {dict.settings.languageDesc}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {availableLocales.map((lang) => {
          const isSelected = locale === lang.id;
          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => setLocale(lang.id)}
              className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer select-none active:scale-95 relative ${
                isSelected
                  ? 'bg-ocean-50/90 border-ocean-300 text-ocean-900 ring-2 ring-ocean-100 shadow-2xs'
                  : 'bg-sand-50/70 border-sand-200 text-slate-600 hover:bg-sand-100 hover:text-slate-900'
              }`}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-ocean-600 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
              <span className="text-2xl drop-shadow-2xs">{lang.flag}</span>
              <span className="font-extrabold">{lang.label}</span>
              <span className="text-[10px] text-slate-400 font-mono font-semibold">{lang.code}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
