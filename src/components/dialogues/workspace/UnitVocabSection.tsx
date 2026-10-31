/**
 * Eidos Language OS - Unit Workspace Section 4: Vocabulary Summary Section Wrapper
 * Integrates UnitVocabSummaryTable with live filtering, role tags, and audio pronunciation.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React from 'react';
import type { GuideSectionVocab } from '../../../types';
import { UnitVocabSummaryTable } from './UnitVocabSummaryTable';

export interface UnitVocabSectionProps {
  vocab: GuideSectionVocab;
  unitNumber: number;
  className?: string;
}

export const UnitVocabSection: React.FC<UnitVocabSectionProps> = ({
  vocab,
  unitNumber,
  className = '',
}) => {
  return (
    <div data-testid="unit-vocab-section" className={`space-y-4 ${className}`}>
      <UnitVocabSummaryTable vocab={vocab} unitNumber={unitNumber} />
    </div>
  );
};
