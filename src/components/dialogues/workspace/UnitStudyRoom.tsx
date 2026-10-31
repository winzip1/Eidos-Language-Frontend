/**
 * Eidos Language OS - Dedicated Unit Workspace Orchestrator
 * Full distraction-free study room for a single unit:
 * - Dynamic guide data loading from real backend API (/api/v1/courses/.../guide)
 * - Header with level badge, audio duration, table counts, and back trigger
 * - Integrated HTML5 millisecond audio streaming control bar
 * - 5-Section Segmented navigation with real count badges
 * - Responsive 360dp mobile layout & fail-loud error boundary
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import type { UnitStudyGuide, UnitStudyTabKey } from '../../../types';
import { apiRequest } from '../../../services/apiClient';
import { useDictionary, interpolate } from '../../../context/DictionaryContext';
import { audioPlayer } from '../../../services/audioPlayer';
import { UnitStudyHeader } from './UnitStudyHeader';
import { UnitAudioControlBar } from './UnitAudioControlBar';
import { UnitStudySectionNav } from './UnitStudySectionNav';
import { UnitIntroSection } from './UnitIntroSection';
import { UnitDrillsPreview } from './UnitDrillsPreview';
import { UnitReadingSection } from './UnitReadingSection';
import { UnitVocabSection } from './UnitVocabSection';
import { UnitGrammarSection } from './UnitGrammarSection';
import { UnitStudySkeleton } from './UnitStudySkeleton';

export interface UnitStudyRoomProps {
  unitNumber: number;
  courseId?: string;
  languageId?: string;
  levelId?: string;
  levelTitle?: string;
  levelCode?: string;
  onBack: () => void;
  className?: string;
}

export const UnitStudyRoom: React.FC<UnitStudyRoomProps> = ({
  unitNumber,
  courseId,
  languageId = 'german',
  levelId = 'level1',
  levelTitle,
  levelCode = 'A1',
  onBack,
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  const [guide, setGuide] = useState<UnitStudyGuide | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<UnitStudyTabKey>('intro');

  // Load Unit Guide from backend API
  const loadGuide = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const lang = languageId || 'german';
    const lvl = levelId || 'level1';

    try {
      const data = await apiRequest<UnitStudyGuide>(
        `/api/v1/courses/${lang}/levels/${lvl}/units/${unitNumber}/guide`
      );

      if (data && typeof data === 'object') {
        setGuide(data);
      } else {
        throw new Error(dh.guideLoadError || 'Rehber verisi geçersiz.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[UNIT_STUDY_ROOM_LOAD_ERROR] Unit ${unitNumber}:`, err);
      setError(msg || dh.guideLoadError || 'Ders rehberi yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [languageId, levelId, unitNumber, dh.guideLoadError]);

  useEffect(() => {
    loadGuide();
  }, [loadGuide]);

  // Pre-load audio in background for instant seeking on timestamp button tap
  useEffect(() => {
    if (guide && guide.hasAudio && audioPlayer.getCurrentUnitNumber() !== guide.unitNumber) {
      audioPlayer.loadUnit(guide.unitNumber, 0, false, languageId, levelId).catch(() => {});
    }
  }, [guide, languageId, levelId]);

  // Handle safe cleanup when leaving study room: stop loop & pause audio if running
  useEffect(() => {
    return () => {
      audioPlayer.stopLoop();
      if (audioPlayer.getIsPlaying()) {
        audioPlayer.pause();
      }
    };
  }, []);

  // 1. Loading State
  if (isLoading) {
    return <UnitStudySkeleton className={className} />;
  }

  // 2. Fail-Loud Error State
  if (error || !guide) {
    return (
      <div
        data-testid="unit-study-error"
        className={`bg-white border border-rose-200 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto shadow-xs text-center space-y-4 my-8 ${className}`}
      >
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {dh.guideLoadError}
          </h2>
          <p className="text-xs sm:text-sm text-rose-600 font-mono bg-rose-50/60 p-2 rounded-lg border border-rose-100/70">
            {error || dh.unitNotFound}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors active:scale-98"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{dh.backToUnits}</span>
          </button>

          <button
            type="button"
            onClick={loadGuide}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-xs active:scale-98"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{dh.retryLoading || dict.buttons.retry}</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Normal Active Workspace View
  return (
    <div
      data-testid="unit-study-room"
      className={`animate-fade-in space-y-4 max-w-5xl mx-auto pb-16 ${className}`}
    >
      {/* 1. Header Bar with Back Button & Badges */}
      <UnitStudyHeader
        unitNumber={guide.unitNumber}
        title={guide.title}
        focus={guide.focus}
        levelCode={levelCode}
        levelTitle={levelTitle || guide.levelDisplayName}
        estimatedDurationMinutes={guide.estimatedDurationMinutes}
        totalTablesCount={guide.totalTablesCount}
        hasAudio={guide.hasAudio}
        onBack={onBack}
      />

      {/* 2. Top Audio Control Bar */}
      <UnitAudioControlBar
        unitNumber={guide.unitNumber}
        languageId={languageId}
        levelId={levelId}
        hasAudio={guide.hasAudio}
        audioUrl={guide.audioUrl}
        estimatedDurationMinutes={guide.estimatedDurationMinutes}
      />

      {/* 3. Segmented Navigation Tabs */}
      <UnitStudySectionNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dialogueCount={guide.totalDialogueItemsCount}
        drillCount={guide.totalDrillItemsCount}
        readingCount={guide.totalReadingItemsCount}
        vocabCount={guide.totalVocabItemsCount}
        grammarCount={guide.section5?.rules?.length || 0}
      />

      {/* 4. Active Tab Content View */}
      <main className="transition-all">
        {activeTab === 'intro' && (
          <UnitIntroSection
            intro={guide.intro}
            dialogue={guide.section1}
            unitNumber={guide.unitNumber}
            languageId={languageId}
            levelId={levelId}
          />
        )}

        {activeTab === 'drills' && (
          <UnitDrillsPreview
            drills={guide.section2}
            unitNumber={guide.unitNumber}
            languageId={languageId}
            levelId={levelId}
          />
        )}

        {activeTab === 'reading' && (
          <UnitReadingSection
            reading={guide.section3}
            unitNumber={guide.unitNumber}
            languageId={languageId}
            levelId={levelId}
          />
        )}

        {activeTab === 'vocab' && (
          <UnitVocabSection
            vocab={guide.section4}
            unitNumber={guide.unitNumber}
          />
        )}

        {activeTab === 'grammar' && (
          <UnitGrammarSection
            grammar={guide.section5}
            unitNumber={guide.unitNumber}
          />
        )}
      </main>
    </div>
  );
};
