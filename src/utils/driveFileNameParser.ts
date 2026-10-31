/**
 * Eidos Language OS - Smart Filename Parser for Course Audio & Transcripts
 * Uses deterministic regex patterns to auto-detect Language, Level, and Unit number
 * from Google Drive asset filenames (e.g. 'Pimsleur German 1 - Unit 05.mp3', 'Italian_1_03.mp3').
 * ZERO HARDCODE & STRICT TYPING.
 */

export interface ParsedLessonInfo {
  languageId: string;
  levelId: string;
  unitNumber: number;
  courseId: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  isDetected: boolean;
  rawLanguageMatch?: string;
  rawLevelMatch?: string;
  rawUnitMatch?: string;
}

/**
 * Standard supported language definitions with aliases and regex search patterns.
 */
export interface SupportedLanguageMeta {
  id: string;
  displayNameKey: string;
  defaultName: string;
  flag: string;
  pattern: RegExp;
}

export const PARSER_SUPPORTED_LANGUAGES: SupportedLanguageMeta[] = [
  {
    id: 'german',
    displayNameKey: 'languageGerman',
    defaultName: 'Almanca (Deutsch)',
    flag: '🇩🇪',
    pattern: /(?:^|[\s_.-])(?:pimsleur[-_ ]?)?(?:german|deutsch|almanca|de|ger)(?:[\s_.-]|$)/i,
  },
  {
    id: 'italian',
    displayNameKey: 'languageItalian',
    defaultName: 'İtalyanca (Italiano)',
    flag: '🇮🇹',
    pattern: /(?:^|[\s_.-])(?:italian|italiano|italyanca|ita?)(?:[\s_.-]|$)/i,
  },
  {
    id: 'spanish',
    displayNameKey: 'languageSpanish',
    defaultName: 'İspanyolca (Español)',
    flag: '🇪🇸',
    pattern: /(?:^|[\s_.-])(?:spanish|español|espanol|ispanyolca|es|spa)(?:[\s_.-]|$)/i,
  },
  {
    id: 'french',
    displayNameKey: 'languageFrench',
    defaultName: 'Fransızca (Français)',
    flag: '🇫🇷',
    pattern: /(?:^|[\s_.-])(?:french|français|francais|fransizca|fr|fra)(?:[\s_.-]|$)/i,
  },
  {
    id: 'russian',
    displayNameKey: 'languageRussian',
    defaultName: 'Rusça (Русский)',
    flag: '🇷🇺',
    pattern: /(?:^|[\s_.-])(?:russian|rusça|rusca|русский|ru|rus)(?:[\s_.-]|$)/i,
  },
  {
    id: 'english',
    displayNameKey: 'languageEnglish',
    defaultName: 'İngilizce (English)',
    flag: '🇬🇧',
    pattern: /(?:^|[\s_.-])(?:english|ingilizce|englisch|en|eng)(?:[\s_.-]|$)/i,
  },
];

/**
 * Supported course level definitions.
 */
export interface SupportedLevelMeta {
  id: string;
  displayName: string;
  cefr: string;
}

export const PARSER_SUPPORTED_LEVELS: SupportedLevelMeta[] = [
  { id: 'level1', displayName: '1', cefr: 'A1' },
  { id: 'level2', displayName: '2', cefr: 'A2' },
  { id: 'level3', displayName: '3', cefr: 'B1' },
  { id: 'level4', displayName: '4', cefr: 'B2' },
  { id: 'level5', displayName: '5', cefr: 'C1' },
  { id: 'level-plus', displayName: 'Plus', cefr: 'C1+' },
];

/**
 * Analyzes a Google Drive filename using progressive regex decomposition to detect
 * language, course level, and unit number.
 *
 * @param filename Raw filename from Google Drive (e.g. 'Pimsleur German 1 - Unit 05.mp3')
 * @returns ParsedLessonInfo with detected values and confidence tier
 */
export function parseDriveFileName(filename: string): ParsedLessonInfo {
  if (!filename || typeof filename !== 'string') {
    return {
      languageId: 'german',
      levelId: 'level1',
      unitNumber: 1,
      courseId: 'eidos-german-level1',
      confidence: 'none',
      isDetected: false,
    };
  }

  // Strip extension and clean up separators
  const baseName = filename.replace(/\.[a-z0-9]{2,5}$/i, '').trim();

  let detectedLanguage: string | null = null;
  let rawLanguageMatch: string | undefined;

  // 1. Language Detection
  for (const lang of PARSER_SUPPORTED_LANGUAGES) {
    const match = baseName.match(lang.pattern);
    if (match) {
      detectedLanguage = lang.id;
      rawLanguageMatch = match[0].trim();
      break;
    }
  }

  // 2. Level Detection
  let detectedLevel: string | null = null;
  let rawLevelMatch: string | undefined;

  // Check Plus level first
  if (/(?:level|kur)[_\s-]?plus|\bplus\b/i.test(baseName)) {
    detectedLevel = 'level-plus';
    rawLevelMatch = 'plus';
  } else {
    // Check explicit "level 1", "kur 1", "level-2"
    const explicitLevelMatch = baseName.match(/(?:level|kur)[_\s-]?([1-5])/i);
    if (explicitLevelMatch) {
      detectedLevel = `level${explicitLevelMatch[1]}`;
      rawLevelMatch = explicitLevelMatch[0];
    } else {
      // Check compact positional syntax: Language_Level_Unit (e.g. "Italian_1_03", "German-1-05")
      const positionalMatch = baseName.match(
        /(?:german|deutsch|italian|italiano|spanish|espanol|french|russian|english)[_\s-]+([1-5])[_\s-]+(?:unit|lesson|ders|\d)/i
      );
      if (positionalMatch) {
        detectedLevel = `level${positionalMatch[1]}`;
        rawLevelMatch = positionalMatch[1];
      }
    }
  }

  // 3. Unit Number Detection
  let detectedUnit: number | null = null;
  let rawUnitMatch: string | undefined;

  // Try explicit "Unit 05", "Unit_05", "Lesson 12", "Ders 3", "U05"
  const explicitUnitMatch = baseName.match(/(?:unit|lesson|ders|lektion|\bu)[_\s-]?0*(\d{1,2})\b/i);
  if (explicitUnitMatch) {
    const num = parseInt(explicitUnitMatch[1], 10);
    if (!isNaN(num) && num >= 1 && num <= 30) {
      detectedUnit = num;
      rawUnitMatch = explicitUnitMatch[0];
    }
  }

  // Fallback for compact syntax with trailing number (e.g. "Italian_1_03", "de_1_15")
  if (detectedUnit === null) {
    const trailingNumberMatch = baseName.match(/[_\s-]+0*(\d{1,2})$/i);
    if (trailingNumberMatch) {
      const num = parseInt(trailingNumberMatch[1], 10);
      if (!isNaN(num) && num >= 1 && num <= 30) {
        detectedUnit = num;
        rawUnitMatch = trailingNumberMatch[0];
      }
    }
  }

  // Determine overall detection confidence
  let confidence: 'high' | 'medium' | 'low' | 'none' = 'none';
  if (detectedLanguage && detectedLevel && detectedUnit !== null) {
    confidence = 'high';
  } else if (detectedLanguage && (detectedLevel || detectedUnit !== null)) {
    confidence = 'medium';
  } else if (detectedLanguage || detectedUnit !== null) {
    confidence = 'low';
  }

  const finalLanguage = detectedLanguage || 'german';
  const finalLevel = detectedLevel || 'level1';
  const finalUnit = detectedUnit !== null ? detectedUnit : 1;
  const courseId = finalLanguage === 'german' ? 'german_pimsleur' : `eidos-${finalLanguage}-${finalLevel}`;

  return {
    languageId: finalLanguage,
    levelId: finalLevel,
    unitNumber: finalUnit,
    courseId,
    confidence,
    isDetected: confidence !== 'none',
    rawLanguageMatch,
    rawLevelMatch,
    rawUnitMatch,
  };
}

/**
 * Formats a clean human-readable badge text from unit cloud asset metadata.
 * e.g. "Almanca Seviye 1 • Ünite 5"
 */
export function formatCloudAssetBadgeText(
  asset: {
    languageId?: string;
    levelId?: string;
    unitNumber?: number;
  },
  dict?: any
): string {
  const langKey = asset.languageId?.toLowerCase() || 'german';
  const langMeta = PARSER_SUPPORTED_LANGUAGES.find((l) => l.id === langKey);
  const langName = dict?.googleDrive?.[langMeta?.displayNameKey || ''] || langMeta?.defaultName || 'Ders';

  let levelDisplay = '1';
  if (asset.levelId) {
    if (asset.levelId.includes('plus')) {
      levelDisplay = 'Plus';
    } else {
      const numMatch = asset.levelId.match(/(\d+)/);
      levelDisplay = numMatch ? numMatch[1] : '1';
    }
  }

  const unitNum = asset.unitNumber || 1;

  if (dict?.googleDrive?.linkUnitBadgeFormat) {
    return dict.googleDrive.linkUnitBadgeFormat
      .replace('{language}', langName)
      .replace('{level}', levelDisplay)
      .replace('{unit}', String(unitNum));
  }

  return `${langName} Seviye ${levelDisplay} • Ünite ${unitNum}`;
}
