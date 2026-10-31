/**
 * Eidos Language OS - Unit Workspace Section 5: Pedagogical Grammar Formulas & Rule Cards
 * Structured visual formula blocks, ASCII diagrams, markdown tables, callout notes, and dual-language examples.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */

import React, { useMemo, useState } from 'react';
import { Lightbulb, Sparkles, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import type { GuideSectionGrammar, GuideGrammarRule } from '../../../types';
import { useDictionary, interpolate } from '../../../context/DictionaryContext';
import {
  parseGrammarRuleContent,
  GrammarParsedBlock,
  GrammarFormulaStep,
} from '../../../utils/grammarContentParser';

export interface UnitGrammarFormulasCardProps {
  grammar: GuideSectionGrammar;
  unitNumber: number;
  className?: string;
}

/**
 * Formula Flow Steps Component
 */
const FormulaFlowRenderer: React.FC<{ steps: GrammarFormulaStep[]; raw: string }> = ({
  steps,
}) => {
  return (
    <div
      data-testid="formula-flow-block"
      className="my-2.5 p-3 rounded-xl bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-slate-50/70 border border-sky-100/90 shadow-2xs"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div className="shrink-0 flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-white border border-sky-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-sky-900 tracking-tight">
                {step.label}
              </span>
              {step.sublabel && (
                <span className="text-[10px] font-mono font-medium text-slate-500 mt-0.5">
                  {step.sublabel}
                </span>
              )}
            </div>
            {idx < steps.length - 1 && (
              <div className="shrink-0 flex items-center justify-center px-1 text-sky-400">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/**
 * Embedded Table Renderer for rules
 */
const GrammarTableRenderer: React.FC<{ headers: string[]; rows: string[][] }> = ({
  headers,
  rows,
}) => {
  return (
    <div className="my-2.5 overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
      <table className="w-full text-left border-collapse min-w-[280px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {headers.map((h, i) => (
              <th key={i} className="py-2 px-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="py-2 px-3 font-medium text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Formatted Text Line with Markdown Bold (*, **) highlights
 */
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  // Convert markdown **bold** or *italic* into stylized span
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return (
    <span>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={idx} className="font-bold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <span key={idx} className="italic text-sky-800 font-medium">
              {part.slice(1, -1)}
            </span>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={idx}
              className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      })}
    </span>
  );
};

export const UnitGrammarFormulasCard: React.FC<UnitGrammarFormulasCardProps> = ({
  grammar,
  unitNumber,
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  const rules = useMemo(() => {
    return Array.isArray(grammar?.rules) ? grammar.rules : [];
  }, [grammar?.rules]);

  const [activeRuleNumber, setActiveRuleNumber] = useState<number | null>(null);

  // Filter rules if student selected a specific rule jump pill
  const displayedRules = useMemo(() => {
    if (activeRuleNumber === null) return rules;
    return rules.filter((r) => r.ruleNumber === activeRuleNumber);
  }, [rules, activeRuleNumber]);

  return (
    <div
      data-testid="unit-grammar-formulas-card"
      className={`space-y-4 ${className}`}
    >
      {/* 1. Header & Navigation Jump Pills */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {grammar.title || dh.grammarFormulasTitle}
              </h2>
              {grammar.description && (
                <p className="text-xs text-slate-500 mt-0.5">{grammar.description}</p>
              )}
            </div>
          </div>

          <span className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/70 shrink-0">
            {interpolate(dh.grammarRulesCountBadge, { count: rules.length })}
          </span>
        </div>

        {/* Rule quick jump pills (if > 1 rule) */}
        {rules.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setActiveRuleNumber(null)}
              className={`shrink-0 min-h-[36px] px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                activeRuleNumber === null
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {dict.dialogueHub.filterAllRoles || 'Tümü'} ({rules.length})
            </button>
            {rules.map((rule, idx) => {
              const ruleNum = rule.ruleNumber || idx + 1;
              const isActive = activeRuleNumber === ruleNum;

              return (
                <button
                  key={ruleNum}
                  type="button"
                  onClick={() => setActiveRuleNumber(ruleNum)}
                  className={`shrink-0 min-h-[36px] px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                    isActive
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {interpolate(dh.grammarRuleNumberBadge, { number: ruleNum })}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Structured Grammar Rules List */}
      {displayedRules.length === 0 ? (
        <div className="py-10 text-center rounded-2xl bg-white border border-dashed border-slate-200 p-6">
          <p className="text-xs sm:text-sm font-medium text-slate-600">{dh.noGrammarRulesFound}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedRules.map((rule: GuideGrammarRule, rIdx: number) => {
            const ruleNum = rule.ruleNumber || rIdx + 1;
            const parsedBlocks = parseGrammarRuleContent(rule.content);

            return (
              <article
                key={ruleNum}
                data-testid={`grammar-rule-card-${ruleNum}`}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-colors space-y-3.5"
              >
                {/* Rule Title & Badge */}
                <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {ruleNum}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                        {interpolate(dh.grammarRuleNumberBadge, { number: ruleNum })}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug mt-0.5">
                      {rule.title}
                    </h3>
                  </div>
                </div>

                {/* Parsed Content Blocks */}
                <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                  {parsedBlocks.map((block: GrammarParsedBlock, bIdx: number) => {
                    switch (block.type) {
                      case 'formula':
                        return (
                          <FormulaFlowRenderer
                            key={bIdx}
                            steps={block.steps}
                            raw={block.raw}
                          />
                        );

                      case 'diagram':
                        return (
                          <div
                            key={bIdx}
                            className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-200/90 font-mono text-[11px] sm:text-xs text-slate-800 leading-tight overflow-x-auto whitespace-pre shadow-2xs"
                          >
                            {block.content}
                          </div>
                        );

                      case 'table':
                        return (
                          <GrammarTableRenderer
                            key={bIdx}
                            headers={block.headers}
                            rows={block.rows}
                          />
                        );

                      case 'callout':
                        return (
                          <div
                            key={bIdx}
                            className="my-2.5 flex items-start gap-2.5 p-3 rounded-r-xl rounded-l-md border-l-4 border-amber-400 bg-amber-50/60 text-amber-900"
                          >
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-xs font-medium">
                              <FormattedText text={block.text} />
                            </div>
                          </div>
                        );

                      case 'subheading':
                        return (
                          <h4
                            key={bIdx}
                            className="text-xs sm:text-sm font-bold text-slate-900 pt-2 pb-0.5 border-b border-slate-100"
                          >
                            {block.title}
                          </h4>
                        );

                      case 'example':
                        return (
                          <div
                            key={bIdx}
                            className="my-1.5 p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="font-bold text-slate-900">
                                <FormattedText text={block.german} />
                              </span>
                            </div>
                            {block.turkish && (
                              <div className="text-[11px] font-medium text-slate-500 pl-3.5 sm:pl-0">
                                <FormattedText text={block.turkish} />
                              </div>
                            )}
                          </div>
                        );

                      case 'text':
                      default:
                        return (
                          <p key={bIdx} className="text-slate-700 leading-relaxed">
                            <FormattedText text={block.text} />
                          </p>
                        );
                    }
                  })}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
