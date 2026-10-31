/**
 * Eidos Language OS - Unit Workspace Section 5: Grammar Rules & Formulas Section Wrapper
 * Integrates UnitGrammarFormulasCard with visual flow blocks, diagrams, and dual-language examples.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React from 'react';
import type { GuideSectionGrammar } from '../../../types';
import { UnitGrammarFormulasCard } from './UnitGrammarFormulasCard';

export interface UnitGrammarSectionProps {
  grammar: GuideSectionGrammar;
  unitNumber: number;
  className?: string;
}

export const UnitGrammarSection: React.FC<UnitGrammarSectionProps> = ({
  grammar,
  unitNumber,
  className = '',
}) => {
  return (
    <div data-testid="unit-grammar-section" className={`space-y-4 ${className}`}>
      <UnitGrammarFormulasCard grammar={grammar} unitNumber={unitNumber} />
    </div>
  );
};
