/**
 * Eidos Language OS - Language Hub & Course Catalog Center
 * Modular coordinator for language packs, level tracks, global metrics, and language requests.
 * ZERO HARDCODE & STRICTLY LIGHT MODE.
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Globe,
  Layers,
  Search,
  X,
  Sparkles,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { useCourse } from '../../context/CourseContext';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import type { AppView, LanguageCourseMeta } from '../../types';
import { LanguageCourseCard } from './LanguageCourseCard';
import { LanguageCatalogStats } from './LanguageCatalogStats';
import { AddLanguageModal } from './AddLanguageModal';

interface LanguageHubCenterProps {
  onNavigate: (view: AppView) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

type CatalogTab = 'all' | 'available' | 'comingSoon';

export const LanguageHubCenter: React.FC<LanguageHubCenterProps> = ({
  onNavigate,
  searchQuery = '',
  onSearchChange,
}) => {
  const { dict } = useDictionary();
  const { activeCourse, availableCourses, setActiveCourse, isLoadingCourses, refreshCourses } = useCourse();

  const [activeTab, setActiveTab] = useState<CatalogTab>('all');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [modalInitialLang, setModalInitialLang] = useState('');
  const [modalInitialLevel, setModalInitialLevel] = useState('A1');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: Press [/] to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered course list based on search and category tab
  const filteredCourses = useMemo(() => {
    let list = availableCourses;

    if (activeTab === 'available') {
      list = list.filter((c) => c.isAvailable);
    } else if (activeTab === 'comingSoon') {
      list = list.filter((c) => !c.isAvailable);
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (c) =>
        c.languageName.toLowerCase().includes(q) ||
        c.nativeLanguageName.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.levels.some(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            l.cefrLevel.toLowerCase().includes(q)
        )
    );
  }, [availableCourses, activeTab, searchQuery]);

  const tabs: Array<{ id: CatalogTab; label: string; count: number }> = useMemo(() => {
    const availableCount = availableCourses.filter((c) => c.isAvailable).length;
    const comingSoonCount = availableCourses.filter((c) => !c.isAvailable).length;

    return [
      { id: 'all', label: dict.languageHub.allCoursesTab, count: availableCourses.length },
      { id: 'available', label: dict.languageHub.availableTab, count: availableCount },
      { id: 'comingSoon', label: dict.languageHub.comingSoonTab, count: comingSoonCount },
    ];
  }, [availableCourses, dict]);

  const handleSelectCourse = (courseId: string, levelId: string) => {
    return setActiveCourse(courseId, levelId);
  };

  const handleOpenRequestModal = (langName: string = '', targetLevel: string = 'A1') => {
    setModalInitialLang(langName);
    setModalInitialLevel(targetLevel);
    setIsRequestModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* 1. Header Banner & Active Course Spotlight */}
      <div className="bg-gradient-to-r from-ocean-500/10 via-sand-100/60 to-transparent p-6 sm:p-8 rounded-3xl border border-sand-200 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-ocean-200/80 shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-ocean-600" />
              <span className="text-xs font-semibold text-ocean-800">
                {dict.languageHub.title}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {dict.languageHub.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {dict.languageHub.subtitle}
            </p>
          </div>

          {/* Quick Request Language CTA */}
          <div className="shrink-0 flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenRequestModal('', 'A1')}
              className="px-4 py-2.5 bg-white hover:bg-sand-50 text-slate-900 border border-sand-200 hover:border-ocean-300 rounded-2xl text-xs font-bold transition-all shadow-2xs hover:shadow-soft flex items-center gap-2 cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500"
            >
              <Sparkles className="w-4 h-4 text-ocean-600" />
              <span>{dict.languageHub.requestButton}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Global Catalog Statistics Banner */}
      <LanguageCatalogStats
        courses={availableCourses}
        activeCourse={activeCourse}
        onRequestNewLanguage={() => handleOpenRequestModal('', 'A1')}
      />

      {/* 3. Filter Tabs, Search Bar & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tab Pills */}
        <div className="flex items-center bg-sand-100/90 p-1 rounded-2xl border border-sand-200 shrink-0">
          {tabs.map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500 ${
                  isTabActive
                    ? 'bg-white text-slate-900 shadow-2xs border border-sand-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isTabActive
                      ? 'bg-ocean-50 text-ocean-700 border border-ocean-200'
                      : 'bg-sand-200/80 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Contextual Search Input */}
        {onSearchChange && (
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && searchQuery) {
                  onSearchChange('');
                }
              }}
              placeholder={dict.languageHub.searchLanguages}
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-sand-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-ocean-300 focus:ring-2 focus:ring-ocean-100 shadow-2xs transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                title={dict.languageHub.clearSearch}
                aria-label={dict.languageHub.clearSearch}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Main Course Grid / Empty / Loading State */}
      {isLoadingCourses ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <LoadingSkeleton height="320px" count={2} />
        </div>
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          title={dict.languageHub.noCoursesFoundTitle}
          description={dict.languageHub.noCoursesFoundDesc}
          icon={<Globe className="w-7 h-7 text-ocean-500" />}
          actionText={searchQuery ? dict.languageHub.clearSearch : dict.languageHub.requestButton}
          onAction={searchQuery ? () => onSearchChange?.('') : () => handleOpenRequestModal('', 'A1')}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-ocean-600" />
              <span>{dict.languageHub.availableCourses}</span>
            </h2>
            <span className="text-xs font-medium text-slate-400">
              {filteredCourses.length} {dict.activeCourse.allCourses.toLowerCase()}
            </span>
          </div>

          {/* Luxury Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCourses.map((course: LanguageCourseMeta) => (
              <LanguageCourseCard
                key={course.id}
                course={course}
                activeCourse={activeCourse}
                onSelectCourse={handleSelectCourse}
                onNavigate={onNavigate}
                onRequestTrack={(langName, targetLevel) => handleOpenRequestModal(langName, targetLevel)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. Add Language / Request Modal */}
      <AddLanguageModal
        isOpen={isRequestModalOpen}
        initialLanguageName={modalInitialLang}
        initialTargetLevel={modalInitialLevel}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={() => {
          refreshCourses();
        }}
      />
    </div>
  );
};
