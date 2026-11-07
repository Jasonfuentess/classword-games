import LZString from 'lz-string';
import type { Activity } from '../types/activity';
import { parseActivity } from './activitySchema';
import { hashString } from '../utils/random';

/**
 * Shared links carry the whole activity inside the URL hash, so a classmate can open
 * it on any device without a server or the creator's localStorage.
 *
 * Format: <base>#/p/<lz-string compressed JSON>. The JSON uses short keys and a
 * version number so future versions can keep reading old links.
 *
 * NOTE: this is encoding, not encryption. Anyone can decode a link; the hangman
 * answer is only hidden from casual view during normal play.
 */
export const SHARE_VERSION = 1;
export const SHARE_ROUTE = '/p/';
export const LINK_WARN_LENGTH = 2000;
export const LINK_MAX_LENGTH = 8000;
export const QR_MAX_LENGTH = 2000;

interface PayloadV1 {
  v: 1;
  k: 'w' | 'h';
  t: string;
  i: string;
  l: 'en' | 'es';
  d: 'e' | 'm' | 'h';
  tm: 0 | 1;
  tl: number;
  hi: 0 | 1;
  w?: { w: string[]; g: 'a' | number; dg: 0 | 1; rv: 0 | 1; c: string; sl: 0 | 1; s: number };
  h?: { s: string; h: string; e: number; c: string | null };
}

const DIFF_TO = { easy: 'e', medium: 'm', hard: 'h' } as const;
const DIFF_FROM = { e: 'easy', m: 'medium', h: 'hard' } as const;
const b = (v: boolean): 0 | 1 => (v ? 1 : 0);

function toPayload(a: Activity): PayloadV1 {
  const p: PayloadV1 = {
    v: 1,
    k: a.type === 'wordsearch' ? 'w' : 'h',
    t: a.title,
    i: a.instructions,
    l: a.language,
    d: DIFF_TO[a.difficulty],
    tm: b(a.timerEnabled),
    tl: a.timeLimitSec,
    hi: b(a.hintsEnabled),
  };
  if (a.type === 'wordsearch') {
    const ws = a.wordsearch;
    p.w = {
      w: ws.words,
      g: ws.gridSize === 'auto' ? 'a' : ws.gridSize,
      dg: b(ws.allowDiagonal),
      rv: b(ws.allowReverse),
      c: ws.clue,
      sl: b(ws.showWordList),
      s: ws.seed,
    };
  } else {
    const hm = a.hangman;
    p.h = { s: hm.secret, h: hm.hint, e: hm.maxErrors, c: hm.category };
  }
  return p;
}

function fromPayload(p: Record<string, unknown>, id: string): unknown {
  const common = {
    id,
    title: p.t,
    instructions: p.i,
    language: p.l,
    difficulty: DIFF_FROM[p.d as keyof typeof DIFF_FROM],
    timerEnabled: p.tm === 1,
    timeLimitSec: p.tl,
    hintsEnabled: p.hi === 1,
    createdAt: 0,
    updatedAt: 0,
  };
  if (p.k === 'w' && typeof p.w === 'object' && p.w) {
    const w = p.w as Record<string, unknown>;
    return {
      ...common,
      type: 'wordsearch',
      wordsearch: {
        words: w.w,
        gridSize: w.g === 'a' ? 'auto' : w.g,
        allowDiagonal: w.dg === 1,
        allowReverse: w.rv === 1,
        clue: w.c,
        showWordList: w.sl === 1,
        seed: w.s,
      },
    };
  }
  if (p.k === 'h' && typeof p.h === 'object' && p.h) {
    const h = p.h as Record<string, unknown>;
    return { ...common, type: 'hangman', hangman: { secret: h.s, hint: h.h, maxErrors: h.e, category: h.c ?? null } };
  }
  return null;
}

export function encodeActivity(activity: Activity): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(toPayload(activity)));
}

export type DecodeResult =
  | { ok: true; activity: Activity; key: string }
  | { ok: false; reason: 'empty' | 'corrupt' | 'version' | 'invalid' };

export function decodeActivity(code: string | undefined | null): DecodeResult {
  const clean = (code ?? '').trim();
  if (!clean) return { ok: false, reason: 'empty' };
  let json: string | null;
  try {
    json = LZString.decompressFromEncodedURIComponent(clean);
  } catch {
    return { ok: false, reason: 'corrupt' };
  }
  if (!json) return { ok: false, reason: 'corrupt' };
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, reason: 'corrupt' };
  }
  if (typeof data !== 'object' || data === null) return { ok: false, reason: 'corrupt' };
  const record = data as Record<string, unknown>;
  if (typeof record.v !== 'number') return { ok: false, reason: 'corrupt' };
  if (record.v > SHARE_VERSION) return { ok: false, reason: 'version' };

  // The key identifies "the same shared activity" for local result history.
  const key = `shared-${hashString(clean)}`;
  const activity = parseActivity(fromPayload(record, key));
  if (!activity) return { ok: false, reason: 'invalid' };
  return { ok: true, activity, key };
}

export function appBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${import.meta.env.BASE_URL}`;
}

export function buildShareUrl(activity: Activity, base = appBaseUrl()): string {
  return `${base}#${SHARE_ROUTE}${encodeActivity(activity)}`;
}

export type LinkSize = 'ok' | 'long' | 'too-long';

export function assessLinkLength(url: string): LinkSize {
  if (url.length > LINK_MAX_LENGTH) return 'too-long';
  if (url.length > LINK_WARN_LENGTH) return 'long';
  return 'ok';
}

/**
 * Extracts the share code from anything a student might paste: a full URL, a URL
 * with "#/p/..." or the bare code.
 */
export function extractShareCode(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  const idx = text.indexOf(`#${SHARE_ROUTE}`);
  if (idx >= 0) return text.slice(idx + SHARE_ROUTE.length + 1).split(/[?\s]/)[0] || null;
  if (/^[A-Za-z0-9+\-$]+$/.test(text)) return text;
  return null;
}
