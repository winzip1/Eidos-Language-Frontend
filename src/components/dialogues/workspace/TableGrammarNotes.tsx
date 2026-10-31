/**
 * Eidos Language OS - Table Grammar Notes Component
 * Renders concise German grammar rules, phonetic insights, and syntax notes below sentence tables.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React from 'react';
import { BookOpen } from 'lucide-react';
import type { GuideGrammarNote } from '../../../types';
import { useDictionary } from '../../../context/DictionaryContext';

export interface TableGrammarNotesProps {
  notes?: GuideGrammarNote[];
  className?: string;
}

export const TableGrammarNotes: React.FC<TableGrammarNotesProps> = ({
  notes,
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  if (!Array.isArray(notes) || notes.length === 0) {
    return null;
  }

  // Format note text by stripping raw markdown asterisks or code formatting if present
  const formatNoteContent = (content: string) => {
    return content
      .replace(/^[\s*\"“”']+|[\s*\"“”']+$/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*+/g, '')
      .trim();
  };

  return (
    <div
      data-testid="table-grammar-notes"
      className={`bg-sky-50/50 border border-sky-100/90 rounded-xl p-3 sm:p-3.5 space-y-2 text-xs transition-colors ${className}`}
    >
      {/* Header Badge */}
      <div className="flex items-center gap-1.5 text-sky-800 font-semibold tracking-tight">
        <BookOpen className="w-3.5 h-3.5 text-sky-600 shrink-0" />
        <span>{dh.grammarBadge}</span>
      </div>

      {/* Notes List */}
      <ul className="space-y-1.5 pl-0.5">
        {notes.map((gn, idx) => {
          const cleanNote = formatNoteContent(gn.note || '');
          const cleanTerm = gn.term ? gn.term.replace(/[:*`]/g, '').trim() : '';

          return (
            <li
              key={idx}
              className="flex items-start gap-2 text-slate-700 leading-relaxed font-normal"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
              <div className="flex-1">
                {cleanTerm && (
                  <strong className="font-semibold text-sky-900 bg-sky-100/70 border border-sky-200/60 px-1.5 py-0.5 rounded text-[11px] mr-1.5 inline-block">
                    {cleanTerm}:
                  </strong>
                )}
                <span className="text-slate-700 text-xs sm:text-[13px]">{cleanNote}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
