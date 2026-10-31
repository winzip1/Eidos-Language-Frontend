/**
 * Eidos Language OS - Grammar Rule Content Parser
 * Splits raw grammar markdown into structured pedagogical blocks:
 * Formulas, ASCII diagrams, markdown tables, callout notes, example pairs, and subheadings.
 * Strictly Light Mode - Zero Hardcode - High Craftsmanship.
 */

export type GrammarBlockType =
  | 'diagram'
  | 'table'
  | 'formula'
  | 'callout'
  | 'subheading'
  | 'example'
  | 'text';

export interface GrammarDiagramBlock {
  type: 'diagram';
  content: string;
}

export interface GrammarTableBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface GrammarFormulaStep {
  label: string;
  sublabel?: string;
}

export interface GrammarFormulaBlock {
  type: 'formula';
  raw: string;
  steps: GrammarFormulaStep[];
}

export interface GrammarCalloutBlock {
  type: 'callout';
  text: string;
}

export interface GrammarSubheadingBlock {
  type: 'subheading';
  title: string;
}

export interface GrammarExampleBlock {
  type: 'example';
  german: string;
  turkish?: string;
  context?: string;
}

export interface GrammarTextBlock {
  type: 'text';
  text: string;
}

export type GrammarParsedBlock =
  | GrammarDiagramBlock
  | GrammarTableBlock
  | GrammarFormulaBlock
  | GrammarCalloutBlock
  | GrammarSubheadingBlock
  | GrammarExampleBlock
  | GrammarTextBlock;

/**
 * Checks if a line contains a structured formula pattern like `[A] + [B]` or `A + B -> C`
 */
function isFormulaLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith('```') || trimmed.startsWith('|')) return false;
  const noBackticks = trimmed.replace(/`/g, '');
  // Patterns like `[1. Pozisyon: Ich]` + `[2. Pozisyon: verstehe]` or `X + und + Y`
  return (
    /\[.*?\]\s*\+\s*\[.*?\]/.test(noBackticks) ||
    /(\b\w+\b|\*.*?\*)\s*\+\s*(\b\w+\b|\*.*?\*)\s*(->|→|\+)/.test(noBackticks) ||
    /(\b\w+\b|\*.*?\*)\s*\+\s*und\s*\+\s*(\b\w+\b|\*.*?\*)/i.test(noBackticks)
  );
}

/**
 * Parses formula steps from a formula line
 */
function parseFormulaLine(line: string): GrammarFormulaStep[] {
  const clean = line.replace(/^[-\s*`]+/, '').replace(/[`.]/g, '').trim();
  // Extract bracketed parts e.g. `[1. Pozisyon: Ich]`
  const bracketMatches = clean.match(/\[([^\]]+)\]/g);
  if (bracketMatches && bracketMatches.length >= 2) {
    return bracketMatches.map((m) => {
      const inner = m.slice(1, -1).trim();
      const colonIdx = inner.indexOf(':');
      if (colonIdx !== -1) {
        return {
          label: inner.substring(0, colonIdx).trim(),
          sublabel: inner.substring(colonIdx + 1).trim(),
        };
      }
      return { label: inner };
    });
  }

  // Extract by plus delimiter
  const parts = clean.split(/\s*\+\s*|\s*(?:->|→)\s*/);
  return parts.map((part) => ({
    label: part.replace(/[\*`]/g, '').trim(),
  }));
}

/**
 * Checks if a line is an example sentence pattern
 */
function isExampleLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith('-') && !trimmed.startsWith('•')) return false;
  // e.g. - Düz Cümle: *Sie verstehen Englisch.* → Soru: **Verstehen Sie Englisch?**
  // e.g. - Örnek: *Möchten Sie zum Essen Wein trinken?* (Yemek eşliğinde şarap içmek ister misiniz?)
  // e.g. - 1. **`zuhören` (kulak vermek)**:
  return /Örnek:|\*.*?\*|->|→|\(.*?\)/i.test(trimmed);
}

/**
 * Parses an example line into structured German and Turkish parts
 */
function parseExampleLine(line: string): GrammarExampleBlock {
  const clean = line.replace(/^[-\s*•]+/, '').trim();

  // Pattern with arrow: *German* → Turkish or German -> Turkish
  if (clean.includes('→') || clean.includes('->')) {
    const parts = clean.split(/→|->/);
    const germanPart = parts[0].replace(/[\*`]/g, '').trim();
    const turkishPart = parts.slice(1).join('→').replace(/[\*`]/g, '').trim();
    return {
      type: 'example',
      german: germanPart,
      turkish: turkishPart,
    };
  }

  // Pattern with parenthesis translation: *German* (Turkish)
  const parenMatch = clean.match(/^(.*?)\(([^)]+)\)\s*$/);
  if (parenMatch) {
    return {
      type: 'example',
      german: parenMatch[1].replace(/[\*`]/g, '').trim(),
      turkish: parenMatch[2].replace(/[\*`]/g, '').trim(),
    };
  }

  return {
    type: 'example',
    german: clean.replace(/[\*`]/g, '').trim(),
  };
}

/**
 * Parses markdown table lines into headers and rows
 */
function parseMarkdownTable(tableLines: string[]): GrammarTableBlock | null {
  if (tableLines.length < 2) return null;
  const parseRow = (line: string): string[] => {
    return line
      .split('|')
      .slice(1, -1)
      .map((c) => c.replace(/\*\*/g, '').trim());
  };

  const headers = parseRow(tableLines[0]);
  const rows: string[][] = [];

  for (let i = 1; i < tableLines.length; i++) {
    const line = tableLines[i].trim();
    if (line.includes(':---') || line.includes('---:')) continue;
    const row = parseRow(line);
    if (row.length > 0) {
      rows.push(row);
    }
  }

  return {
    type: 'table',
    headers,
    rows,
  };
}

/**
 * Main parser: transforms markdown string of a rule into structured blocks
 */
export function parseGrammarRuleContent(content: string): GrammarParsedBlock[] {
  if (!content || !content.trim()) return [];

  const lines = content.split('\n');
  const blocks: GrammarParsedBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Fenced code block or ASCII diagram (``` ... ```)
    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push({
        type: 'diagram',
        content: codeLines.join('\n'),
      });
      continue;
    }

    // 3. Markdown Table (| Header | Header |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const tableBlock = parseMarkdownTable(tableLines);
      if (tableBlock) {
        blocks.push(tableBlock);
      }
      continue;
    }

    // 4. Callout / Quote (> 💡 ...)
    if (trimmed.startsWith('>')) {
      const calloutText = trimmed.replace(/^>\s*/, '').trim();
      blocks.push({
        type: 'callout',
        text: calloutText,
      });
      i++;
      continue;
    }

    // 5. Subheading (#### ...)
    if (trimmed.startsWith('####')) {
      blocks.push({
        type: 'subheading',
        title: trimmed.replace(/^#+\s*/, '').trim(),
      });
      i++;
      continue;
    }

    // 6. Formula sequence line
    if (isFormulaLine(trimmed)) {
      const steps = parseFormulaLine(trimmed);
      blocks.push({
        type: 'formula',
        raw: trimmed,
        steps,
      });
      i++;
      continue;
    }

    // 7. Example sentence
    if (isExampleLine(trimmed)) {
      blocks.push(parseExampleLine(trimmed));
      i++;
      continue;
    }

    // 8. Regular text paragraph
    blocks.push({
      type: 'text',
      text: trimmed,
    });
    i++;
  }

  return blocks;
}
