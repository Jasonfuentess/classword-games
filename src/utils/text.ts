/**
 * Text normalization shared by both games.
 *
 * Accented vowels are folded to their base letter (Á → A) so players don't need
 * special keys, but Ñ is kept as its own letter because in Spanish it is a distinct
 * letter of the alphabet, not an accented N.
 */

const COMBINING_MARKS = /[̀-ͯ]/g;

export const ALPHABET_EN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const ALPHABET_ES = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

export function alphabetFor(language: 'en' | 'es'): string {
  return language === 'es' ? ALPHABET_ES : ALPHABET_EN;
}

/** Normalizes a single character; returns '' if it is not a letter. */
export function normalizeLetter(ch: string): string {
  const upper = ch.toLocaleUpperCase('es');
  if (upper === 'Ñ') return 'Ñ';
  const base = upper.normalize('NFD').replace(COMBINING_MARKS, '');
  return /^[A-Z]$/.test(base) ? base : '';
}

export function isLetter(ch: string): boolean {
  return normalizeLetter(ch) !== '';
}

/** Converts a word/phrase into the letters used inside a word-search grid. */
export function normalizeForGrid(text: string): string {
  // NFC first so that decomposed input (N + combining tilde) becomes a single Ñ.
  return Array.from(text.normalize('NFC')).map(normalizeLetter).join('');
}

/** Cleans user-typed display text: trims and collapses inner whitespace. */
export function cleanDisplay(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** Splits a free-form list (new lines, commas or semicolons) into clean entries. */
export function parseWordList(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map(cleanDisplay)
    .filter((w) => w.length > 0);
}
