/**
 * Eidos Language OS - Dialogue Study Center (Main Entry Point)
 * Seamlessly coordinates the DialogueFolderExplorer 3-Step Drill-Down Architecture
 * and transitions directly into the Dedicated Unit Workspace (UnitStudyRoom).
 * Preserves full drill-down and scroll state of the folder explorer when entering/leaving workspace.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React, { useCallback, useState } from 'react';
import type { AppView } from '../../types';
import { DialogueFolderExplorer } from './explorer/DialogueFolderExplorer';
import { UnitStudyRoom } from './workspace/UnitStudyRoom';

interface DialogueStudyCenterProps {
  onNavigate: (view: AppView) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const DialogueStudyCenter: React.FC<DialogueStudyCenterProps> = ({
  onNavigate,
  searchQuery = '',
  onSearchChange,
}) => {
  const [selectedLessonUnit, setSelectedLessonUnit] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('german_pimsleur');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('level1');

  const handleSelectLesson = useCallback(
    (unitNumber: number, courseId: string, levelId: string) => {
      setSelectedLessonUnit(unitNumber);
      setSelectedCourseId(courseId);
      setSelectedLevelId(levelId);
    },
    []
  );

  const handleBackToFolderExplorer = useCallback(() => {
    setSelectedLessonUnit(null);
  }, []);

  // Derive normalized language identifier dynamically
  const resolvedLanguageId = selectedCourseId.includes('italian')
    ? 'italian'
    : selectedCourseId.includes('german')
    ? 'german'
    : selectedCourseId.split('_')[0] || 'german';

  return (
    <div className="animate-fade-in space-y-4 max-w-5xl mx-auto pb-8">
      {/* 1. Dedicated Unit Workspace (Renders when a lesson is selected) */}
      {selectedLessonUnit !== null && (
        <UnitStudyRoom
          unitNumber={selectedLessonUnit}
          courseId={selectedCourseId}
          languageId={resolvedLanguageId}
          levelId={selectedLevelId}
          onBack={handleBackToFolderExplorer}
        />
      )}

      {/* 2. Folder Explorer (Preserved in DOM to maintain drill-down & scroll state) */}
      <div className={selectedLessonUnit !== null ? 'hidden' : 'block'}>
        <DialogueFolderExplorer
          onSelectLesson={handleSelectLesson}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
      </div>
    </div>
  );
};

export default DialogueStudyCenter;
