/**
 * Eidos Language OS - Unit Workspace Section 2: Drill & Pattern Tables Preview
 * Renders thematic drill subgroups and interactive sentence tables with Whisper timestamps,
 * vertical arrow alignments, bold German terms, and loop controls.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - 360dp Responsive.
 */
import React from 'react';
import type { GuideSectionDrills } from '../../../types';
import { SectionTableGroup } from './SectionTableGroup';

export interface UnitDrillsPreviewProps {
  drills: GuideSectionDrills;
  unitNumber: number;
  languageId?: string;
  levelId?: string;
  className?: string;
}

export const UnitDrillsPreview: React.FC<UnitDrillsPreviewProps> = ({
  drills,
  unitNumber,
  languageId = 'german',
  levelId = 'level1',
  className = '',
}) => {
  return (
    <div data-testid="unit-drills-preview-section" className={`space-y-4 ${className}`}>
      <SectionTableGroup
        items={drills.items || []}
        subgroups={drills.subgroups}
        unitNumber={unitNumber}
        languageId={languageId}
        levelId={levelId}
        title={drills.title}
        description={drills.description}
      />
    </div>
  );
};
