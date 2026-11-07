import { describe, expect, it } from 'vitest';
import LZString from 'lz-string';
import {
  assessLinkLength,
  buildShareUrl,
  decodeActivity,
  encodeActivity,
  extractShareCode,
  LINK_WARN_LENGTH,
} from '../../src/services/share';
import { SAMPLE_ACTIVITIES } from '../../src/data/samples';
import { generateWordSearch } from '../../src/engines/wordsearch';
import type { Activity, WordSearchActivity } from '../../src/types/activity';
import { CATEGORIES } from '../../src/data/categories';

const ws = SAMPLE_ACTIVITIES.find((a) => a.type === 'wordsearch') as WordSearchActivity;
const hm = SAMPLE_ACTIVITIES.find((a) => a.type === 'hangman')!;

function stripMeta(a: Activity) {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = a;
  return rest;
}

describe('share links', () => {
  it('round-trips a word search and rebuilds the identical grid', () => {
    const decoded = decodeActivity(encodeActivity(ws));
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(stripMeta(decoded.activity)).toEqual(stripMeta(ws));
    const original = generateWordSearch({ ...ws.wordsearch, difficulty: ws.difficulty, language: ws.language });
    const rebuilt = generateWordSearch({ ...(decoded.activity as WordSearchActivity).wordsearch, difficulty: ws.difficulty, language: ws.language });
    expect(original.ok && rebuilt.ok && rebuilt.puzzle.grid).toEqual(original.ok && original.puzzle.grid);
  });

  it('round-trips a hangman activity with accents and Ñ', () => {
    const activity = { ...hm, hangman: { ...hm.hangman, secret: 'Año de la piña', category: null } } as Activity;
    const decoded = decodeActivity(encodeActivity(activity));
    expect(decoded.ok && stripMeta(decoded.activity)).toEqual(stripMeta(activity));
  });

  it('does not show the hangman answer in plain text in the URL', () => {
    const url = buildShareUrl(hm, 'https://example.com/classword-games/');
    expect(url).toContain('#/p/');
    expect(url.toLowerCase()).not.toContain('pi%c3%b1a');
    expect(url.toLowerCase()).not.toContain('colada');
  });

  it('gives a stable key for the same link', () => {
    const code = encodeActivity(ws);
    const a = decodeActivity(code);
    const b = decodeActivity(code);
    expect(a.ok && b.ok && a.key === b.key).toBe(true);
  });

  it('reports damaged links instead of crashing', () => {
    expect(decodeActivity('')).toEqual({ ok: false, reason: 'empty' });
    expect(decodeActivity('not-a-real-code')).toMatchObject({ ok: false });
    const code = encodeActivity(ws);
    expect(decodeActivity(code.slice(0, code.length / 2))).toMatchObject({ ok: false });
  });

  it('rejects structurally invalid data', () => {
    const bad = LZString.compressToEncodedURIComponent(JSON.stringify({ v: 1, k: 'w', t: 'x', w: { w: 'nope' } }));
    expect(decodeActivity(bad)).toEqual({ ok: false, reason: 'invalid' });
    const notObject = LZString.compressToEncodedURIComponent('"hello"');
    expect(decodeActivity(notObject)).toEqual({ ok: false, reason: 'corrupt' });
  });

  it('rejects links from a future format version', () => {
    const future = LZString.compressToEncodedURIComponent(JSON.stringify({ v: 99 }));
    expect(decodeActivity(future)).toEqual({ ok: false, reason: 'version' });
  });

  it('extracts the code from pasted URLs', () => {
    const code = encodeActivity(hm);
    expect(extractShareCode(`https://x.github.io/classword-games/#/p/${code}`)).toBe(code);
    expect(extractShareCode(`  ${code} `)).toBe(code);
    expect(extractShareCode('https://google.com')).toBeNull();
    expect(extractShareCode('')).toBeNull();
  });

  it('keeps a full 20-word activity under the warning length', () => {
    const words = [...CATEGORIES[0].words.es, ...CATEGORIES[1].words.es].slice(0, 20);
    const big: WordSearchActivity = { ...ws, instructions: 'Encuentra todas las palabras escondidas en la cuadrícula.', wordsearch: { ...ws.wordsearch, words } };
    const url = buildShareUrl(big, 'https://someone.github.io/classword-games/');
    expect(url.length).toBeLessThan(LINK_WARN_LENGTH);
    expect(assessLinkLength(url)).toBe('ok');
  });

  it('classifies link lengths', () => {
    expect(assessLinkLength('x'.repeat(100))).toBe('ok');
    expect(assessLinkLength('x'.repeat(3000))).toBe('long');
    expect(assessLinkLength('x'.repeat(9000))).toBe('too-long');
  });
});
