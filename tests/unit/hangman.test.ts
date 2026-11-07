import { describe, expect, it } from 'vitest';
import {
  createHangman,
  getStatus,
  guessLetter,
  letterProgress,
  maskSecret,
  revealHint,
  validateSecret,
  wrongGuesses,
  type HangmanState,
} from '../../src/engines/hangman/hangman';

function play(state: HangmanState, letters: string): HangmanState {
  for (const l of letters) state = guessLetter(state, l).state;
  return state;
}

describe('hangman engine', () => {
  it('wins when every letter of a word is guessed', () => {
    let s = createHangman('Gato', 6);
    expect(getStatus(s)).toBe('playing');
    s = play(s, 'gat');
    expect(getStatus(s)).toBe('playing');
    s = play(s, 'o');
    expect(getStatus(s)).toBe('won');
  });

  it('loses after the allowed number of errors', () => {
    let s = createHangman('Sol', 3);
    s = play(s, 'xyz');
    expect(wrongGuesses(s)).toEqual(['X', 'Y', 'Z']);
    expect(getStatus(s)).toBe('lost');
    expect(guessLetter(s, 'S').result).toBe('finished');
  });

  it('handles phrases: spaces and punctuation are visible and not guessable', () => {
    const s = createHangman('¡Hola, mundo!', 6);
    const masked = maskSecret(s);
    expect(masked.filter((m) => !m.isLetter).map((m) => m.char)).toEqual(['¡', ',', ' ', '!']);
    expect(masked.filter((m) => !m.isLetter).every((m) => m.revealed)).toBe(true);
    expect(getStatus(play(s, 'holamund'))).toBe('won');
  });

  it('accented letters are revealed by their base letter', () => {
    let s = createHangman('Canción', 6);
    s = guessLetter(s, 'o').state;
    const o = maskSecret(s).find((m) => m.char === 'ó');
    expect(o?.revealed).toBe(true);
    expect(getStatus(play(s, 'cani'))).toBe('won');
  });

  it('treats Ñ as a different letter from N', () => {
    let s = createHangman('Niño', 6);
    const r1 = guessLetter(s, 'n');
    expect(r1.result).toBe('correct');
    s = r1.state;
    expect(maskSecret(s).find((m) => m.char === 'ñ')?.revealed).toBe(false);
    s = play(s, 'io');
    expect(getStatus(s)).toBe('playing');
    const r2 = guessLetter(s, 'ñ');
    expect(r2.result).toBe('correct');
    expect(getStatus(r2.state)).toBe('won');
  });

  it('does not count repeated or invalid guesses', () => {
    let s = createHangman('Luna', 6);
    s = guessLetter(s, 'x').state;
    expect(guessLetter(s, 'X').result).toBe('repeated');
    expect(guessLetter(s, 'x').state).toBe(s);
    expect(guessLetter(s, '7').result).toBe('invalid');
    expect(guessLetter(s, ' ').result).toBe('invalid');
    expect(wrongGuesses(s)).toHaveLength(1);
  });

  it('hints reveal a letter without counting an error', () => {
    let s = createHangman('Banana', 6);
    const h = revealHint(s);
    expect(h.letter).toBe('A'); // most frequent hidden letter
    s = h.state;
    expect(wrongGuesses(s)).toHaveLength(0);
    expect(guessLetter(s, 'a').result).toBe('repeated');
    expect(letterProgress(s)).toBeCloseTo(1 / 3);
  });

  it('clamps the allowed errors to a sane range', () => {
    expect(createHangman('x', 1).maxErrors).toBe(3);
    expect(createHangman('x', 50).maxErrors).toBe(10);
  });

  it('validates secrets', () => {
    expect(validateSecret('  ')).toBe('empty');
    expect(validateSecret('123 !!')).toBe('no-letters');
    expect(validateSecret('a'.repeat(61))).toBe('too-long');
    expect(validateSecret('Fotosíntesis')).toBeNull();
  });
});
