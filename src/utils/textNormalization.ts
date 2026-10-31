/**
 * Eidos Language OS - Diacritic & Accent Insensitive Text Normalization
 * Handles German umlauts (ä, ö, ü, ß), Italian accents (à, è, é, ì, ò, ù),
 * and Turkish special characters (ı, ğ, ş, ç) for instant, forgiving search.
 */

/**
 * Normalizes text for search indexing and querying by stripping diacritics
 * and replacing language-specific ligatures/characters.
 */
export function normalizeSearchString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c');
}
