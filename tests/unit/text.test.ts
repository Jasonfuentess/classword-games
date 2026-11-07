import { describe, expect, it } from 'vitest';
import { normalizeForGrid, normalizeLetter, parseWordList, cleanDisplay, isLetter } from '../../src/utils/text';

describe('text normalization', () => {
  it('folds accented vowels but keeps Ñ as its own letter', () => {
    expect(normalizeLetter('á')).toBe('A');
    expect(normalizeLetter('É')).toBe('E');
    expect(normalizeLetter('ü')).toBe('U');
    expect(normalizeLetter('ñ')).toBe('Ñ');
    expect(normalizeLetter('Ñ')).toBe('Ñ');
    expect(normalizeLetter('n')).toBe('N');
  });

  it('rejects non-letters', () => {
    expect(normalizeLetter(' ')).toBe('');
    expect(normalizeLetter('3')).toBe('');
    expect(normalizeLetter('-')).toBe('');
    expect(isLetter('¿')).toBe(false);
  });

  it('removes spaces and punctuation for the grid', () => {
    expect(normalizeForGrid('Árbol de Navidad')).toBe('ARBOLDENAVIDAD');
    expect(normalizeForGrid('Pingüino')).toBe('PINGUINO');
    expect(normalizeForGrid('Año-Nuevo!')).toBe('AÑONUEVO');
  });

  it('handles decomposed Ñ (N + combining tilde)', () => {
    expect(normalizeForGrid('Niño')).toBe('NIÑO');
  });

  it('parses word lists separated by lines, commas or semicolons', () => {
    expect(parseWordList(' Sol \n\nLuna, Estrella ;  Vía   Láctea ')).toEqual(['Sol', 'Luna', 'Estrella', 'Vía Láctea']);
    expect(cleanDisplay('  hola   mundo ')).toBe('hola mundo');
  });
});
