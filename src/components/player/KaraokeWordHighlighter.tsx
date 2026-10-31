/**
 * Eidos Language OS - Karaoke Word Highlighter
 * Renders interactive millisecond-accurate word tokens with active highlighting and click-to-seek.
 */
import React from 'react';
import type { WordToken } from '../../types';
import { useDictionary } from '../../context/DictionaryContext';

interface KaraokeWordHighlighterProps {
  words?: WordToken[];
  rawText: string;
  isActive: boolean;
  currentMs: number;
  onSeekWord: (startMs: number) => void;
}

export const KaraokeWordHighlighter: React.FC<KaraokeWordHighlighterProps> = ({
  words,
  rawText,
  isActive,
  currentMs,
  onSeekWord,
}) => {
  const { dict } = useDictionary();

  if (!words || words.length === 0) {
    return <span className="select-text">{rawText}</span>;
  }

  return (
    <div className="flex flex-wrap items-baseline gap-y-1 select-text">
      {words.map((word, idx) => {
        const isWordActive = isActive && currentMs >= word.s && currentMs <= word.e;

        const handleClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          onSeekWord(word.s);
        };

        return (
          <span
            key={idx}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            title={`${dict.player.seekToWord}: ${word.t}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onSeekWord(word.s);
              }
            }}
            className={`inline-block mr-1.5 px-1.5 py-0.5 rounded-lg transition-all duration-150 cursor-pointer ${
              isWordActive
                ? 'bg-ocean-100 text-ocean-950 font-extrabold border border-ocean-300 shadow-xs scale-[1.05] ring-2 ring-ocean-200/90'
                : 'text-slate-800 hover:bg-sand-100/90 hover:text-ocean-800'
            }`}
          >
            {word.t}
          </span>
        );
      })}
    </div>
  );
};
