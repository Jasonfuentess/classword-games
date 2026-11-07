import { describe, expect, it } from 'vitest';
import { parseActivity, tidyActivity, validateActivity } from '../../src/services/activitySchema';
import { createActivity, duplicateActivity, switchGameType } from '../../src/services/activityFactory';
import type { HangmanActivity, WordSearchActivity } from '../../src/types/activity';

describe('activity validation', () => {
  it('requires a title and valid content', () => {
    const ws = createActivity('wordsearch', 'es') as WordSearchActivity;
    const fields = validateActivity(ws).map((i) => i.field);
    expect(fields).toContain('title');
    expect(fields).toContain('words');
  });

  it('accepts a complete word search', () => {
    const ws = createActivity('wordsearch', 'es') as WordSearchActivity;
    ws.title = 'Animales';
    ws.wordsearch.words = ['Gato', 'Perro', 'Loro', 'Pez'];
    expect(validateActivity(ws)).toEqual([]);
  });

  it('flags impossible grids', () => {
    const ws = createActivity('wordsearch', 'en') as WordSearchActivity;
    ws.title = 'Too much';
    const alphabet = 'ABCDEFGHIJKLMNOPQRST';
    ws.wordsearch.words = Array.from({ length: 20 }, (_, i) => (alphabet + alphabet).slice(i, i + 10));
    ws.wordsearch.gridSize = 10;
    expect(validateActivity(ws)).toEqual([{ field: 'words', code: 'impossible' }]);
  });

  it('validates hangman secrets', () => {
    const hm = createActivity('hangman', 'es') as HangmanActivity;
    hm.title = 'Adivina';
    expect(validateActivity(hm)).toEqual([{ field: 'secret', code: 'empty' }]);
    hm.hangman.secret = 'Mañana';
    expect(validateActivity(hm)).toEqual([]);
  });

  it('tidies whitespace before saving', () => {
    const hm = createActivity('hangman', 'es') as HangmanActivity;
    hm.title = '  Mi   juego ';
    hm.hangman.secret = '  buenos    días ';
    const tidy = tidyActivity(hm);
    expect(tidy.title).toBe('Mi juego');
    expect(tidy.hangman.secret).toBe('buenos días');
  });

  it('parseActivity rejects malformed data', () => {
    expect(parseActivity(null)).toBeNull();
    expect(parseActivity({ type: 'wordsearch' })).toBeNull();
    const ok = createActivity('hangman', 'en') as HangmanActivity;
    ok.title = 'x';
    expect(parseActivity(ok)).toEqual(ok);
    expect(parseActivity({ ...ok, hangman: { ...ok.hangman, maxErrors: 99 } })).toBeNull();
    expect(parseActivity({ ...ok, difficulty: 'insane' })).toBeNull();
  });

  it('duplicates with a new id and switches game type keeping common fields', () => {
    const ws = createActivity('wordsearch', 'es');
    ws.title = 'Original';
    const copy = duplicateActivity(ws, '(copia)');
    expect(copy.id).not.toBe(ws.id);
    expect(copy.title).toBe('Original (copia)');
    const switched = switchGameType(ws, 'hangman');
    expect(switched.type).toBe('hangman');
    expect(switched.title).toBe('Original');
    expect(switched.id).toBe(ws.id);
  });
});
