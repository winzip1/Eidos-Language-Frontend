import React from 'react';
import {
  MessageSquareText,
  Search,
  BookOpen,
  TableProperties,
  Mic,
  Lightbulb,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import { useDictionary, initialFallbackDict } from '../../context/DictionaryContext';
import { useCourse } from '../../context/CourseContext';

export type DialogueTabMode = 'units' | 'cheatSheet' | 'roleplay';
export type DialogueSpeakerFilter = 'ALL' | 'GERMAN_MALE' | 'GERMAN_FEMALE' | 'NARRATOR';

interface DialogueHeaderProps {
  activeTab: DialogueTabMode;
  onTabChange: (tab: DialogueTabMode) => void;
  speakerFilter: DialogueSpeakerFilter;
  onSpeakerFilterChange: (filter: DialogueSpeakerFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalDialoguesCount: number;
}

export const DialogueHeader: React.FC<DialogueHeaderProps> = ({
  activeTab,
  onTabChange,
  speakerFilter,
  onSpeakerFilterChange,
  searchQuery,
  onSearchChange,
  totalDialoguesCount,
}) => {
  const { dict } = useDictionary();
  const ds = dict?.dialogueStudy || initialFallbackDict.dialogueStudy;
  const { activeCourse, activeLevel } = useCourse();

  const speakerOptions: Array<{
    id: DialogueSpeakerFilter;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'ALL', label: ds.speakerAll || 'Tüm Konuşmacılar', icon: Users },
    { id: 'GERMAN_MALE', label: ds.speakerMale || 'Erkek Konuşmacı', icon: User },
    { id: 'GERMAN_FEMALE', label: ds.speakerFemale || 'Kadın Konuşmacı', icon: UserCheck },
    { id: 'NARRATOR', label: ds.speakerNarrator || 'Eğitmen', icon: Mic },
  ];

  return (
    <header className="bg-white border-b border-sand-200/90 sticky top-0 z-20 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Top Row: Title, Course Badge, Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="p-2 rounded-xl bg-ocean-50 text-ocean-700 border border-ocean-200/80 shadow-2xs">
                <MessageSquareText className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {ds.title}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                {totalDialoguesCount > 0 ? `${totalDialoguesCount} ${ds.unitChipPrefix}` : ds.totalUnitsCount}
              </span>
              {activeCourse && (
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-lg bg-sand-100 text-slate-600 text-xs font-semibold border border-sand-200">
                  {activeCourse.flag} {activeCourse.languageName} {activeLevel?.cefrLevel}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
              {ds.subtitle}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={ds.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-sand-50/70 hover:bg-white focus:bg-white rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-ocean-500 shadow-2xs transition-all"
            />
          </div>
        </div>

        {/* Bottom Row: Tab Switchers, Speaker Filters, and Tip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Main Mode Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onTabChange('units')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'units'
                  ? 'bg-ocean-600 text-white shadow-soft-sm'
                  : 'bg-sand-100 text-slate-700 hover:bg-sand-200/80'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{ds.allUnitsTab}</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('cheatSheet')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'cheatSheet'
                  ? 'bg-ocean-600 text-white shadow-soft-sm'
                  : 'bg-sand-100 text-slate-700 hover:bg-sand-200/80'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>{ds.cheatSheetTab}</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('roleplay')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'roleplay'
                  ? 'bg-ocean-600 text-white shadow-soft-sm ring-2 ring-ocean-200'
                  : 'bg-ocean-50/80 text-ocean-700 hover:bg-ocean-100 border border-ocean-200/80'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-ocean-600" />
              <span>{ds.roleplayMode || 'Rol Simülasyonu'}</span>
            </button>
          </div>

          {/* Speaker Filter Chips (Only shown in 'units' tab) */}
          {activeTab === 'units' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 hidden lg:inline mr-1">
                {ds.filterSpeaker || 'Konuşmacı:'}
              </span>
              {speakerOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = speakerFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSpeakerFilterChange(opt.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-sand-50 hover:bg-sand-100 text-slate-600 border border-sand-200/80'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Memorization Tip Callout */}
          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-600 bg-sand-100/70 px-3 py-1.5 rounded-xl border border-sand-200">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{ds.memorizationTip}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
