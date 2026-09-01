/**
 * Eidos Language OS - Transcript Word (Alias for KaraokeWordHighlighter)
 */
import React from 'react';
import type { WordToken } from '../../types';
import { KaraokeWordHighlighter } from './KaraokeWordHighlighter';

interface TranscriptWordProps {
  word: WordToken;
  isActive: boolean;
  currentMs: number;
  onSeekWord: (startMs: number) => void;
}

export const TranscriptWord: React.FC<TranscriptWordProps> = ({
  word,
  isActive,
  currentMs,
  onSeekWord,
}) => {
  return (
    <KaraokeWordHighlighter
      words={[word]}
      rawText={word.t}
      isActive={isActive}
      currentMs={currentMs}
      onSeekWord={onSeekWord}
    />
  );
};
