import React from 'react';
import type { UnitSummary } from '../../types';
import { LevelHeroCard } from './LevelHeroCard';

interface LevelSummaryCardProps {
  totalUnits: number;
  onSelectUnit?: (unitNumber: number) => void;
  units?: UnitSummary[];
}

export const LevelSummaryCard: React.FC<LevelSummaryCardProps> = ({
  totalUnits,
  onSelectUnit = () => {},
  units = [],
}) => {
  return <LevelHeroCard totalUnits={totalUnits} onSelectUnit={onSelectUnit} units={units} />;
};
