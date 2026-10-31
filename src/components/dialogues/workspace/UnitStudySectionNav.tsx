/**
 * Eidos Language OS - Dedicated Unit Workspace Section Navigation
 * Clean Segmented Control / Tab Bar for 5 core pedagogical guide sections.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - 360dp Responsive.
 */
import React, { useMemo } from 'react';
import { MessageSquare, Target, BookOpen, Bookmark, Lightbulb } from 'lucide-react';
import type { UnitStudyTabKey } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';

export interface UnitStudySectionNavProps {
  activeTab: UnitStudyTabKey;
  onTabChange: (tab: UnitStudyTabKey) => void;
  dialogueCount?: number;
  drillCount?: number;
  readingCount?: number;
  vocabCount?: number;
  grammarCount?: number;
  className?: string;
}

interface NavTabItem {
  key: UnitStudyTabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

export const UnitStudySectionNav: React.FC<UnitStudySectionNavProps> = ({
  activeTab,
  onTabChange,
  dialogueCount = 0,
  drillCount = 0,
  readingCount = 0,
  vocabCount = 0,
  grammarCount = 0,
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  const tabs: NavTabItem[] = useMemo(
    () => [
      {
        key: 'intro',
        label: dh.tabIntroDialogue,
        icon: MessageSquare,
        count: dialogueCount,
      },
      {
        key: 'drills',
        label: dh.tabDrillPatterns,
        icon: Target,
        count: drillCount,
      },
      {
        key: 'reading',
        label: dh.tabReading,
        icon: BookOpen,
        count: readingCount,
      },
      {
        key: 'vocab',
        label: dh.tabVocabSummary,
        icon: Bookmark,
        count: vocabCount,
      },
      {
        key: 'grammar',
        label: dh.tabGrammarNotes,
        icon: Lightbulb,
        count: grammarCount,
      },
    ],
    [dh, dialogueCount, drillCount, readingCount, vocabCount, grammarCount]
  );

  return (
    <nav
      data-testid="unit-study-section-nav"
      aria-label={dh.workspaceTitle}
      className={`relative w-full overflow-hidden ${className}`}
    >
      {/* Scrollable Container with no scrollbar */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-0.5 -mx-0.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              data-testid={`unit-tab-${tab.key}`}
              aria-selected={isActive}
              role="tab"
              className={`group inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all active:scale-98 border focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                isActive
                  ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-xs ring-1 ring-sky-300/40'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200/80 shadow-2xs'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors shrink-0 ${
                  isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span className="truncate">{tab.label}</span>

              {/* Count Badge */}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold ${
                    isActive
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
