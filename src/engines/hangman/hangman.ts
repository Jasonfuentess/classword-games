import { isLetter, normalizeLetter } from '../../utils/text';

export type GuessResult = 'correct' | 'wrong' | 'repeated' | 'invalid' | 'finished';
export type HangmanStatus = 'playing' | 'won' | 'lost';

export interface HangmanState {
  secret: string;
  maxErrors: number;
  /** Normalized letters guessed so far (correct and wrong), in order. */
  guessed: string[];
  /** Letters revealed through hints (not counted as errors). */
  hinted: string[];
}

export interface MaskedChar {
  char: string;
  isLetter: boolean;
  revealed: boolean;
}

export const MIN_ERRORS = 3;
export const MAX_ERRORS = 10;

export function createHangman(secret: string, maxErrors: number): HangmanState {
  const clamped = Math.min(MAX_ERRORS, Math.max(MIN_ERRORS, Math.round(maxErrors)));
  return { secret: secret.normalize('NFC'), maxErrors: clamped, guessed: [], hinted: [] };
}

export function secretLetters(secret: string): Set<string> {
  const set = new Set<string>();
  for (const ch of secret.normalize('NFC')) {
    const n = normalizeLetter(ch);
    if (n) set.add(n);
  }
  return set;
}

export function wrongGuesses(state: HangmanState): string[] {
  const letters = secretLetters(state.secret);
  return state.guessed.filter((g) => !letters.has(g));
}

export function correctGuesses(state: HangmanState): string[] {
  const letters = secretLetters(state.secret);
  return state.guessed.filter((g) => letters.has(g));
}

export function getStatus(state: HangmanState): HangmanStatus {
  if (wrongGuesses(state).length >= state.maxErrors) return 'lost';
  const known = new Set([...state.guessed, ...state.hinted]);
  for (const l of secretLetters(state.secret)) if (!known.has(l)) return 'playing';
  return 'won';
}

export function guessLetter(state: HangmanState, raw: string): { state: HangmanState; result: GuessResult } {
  if (getStatus(state) !== 'playing') return { state, result: 'finished' };
  const letter = normalizeLetter(raw);
  if (!letter || Array.from(raw).length !== 1) return { state, result: 'invalid' };
  if (state.guessed.includes(letter) || state.hinted.includes(letter)) return { state, result: 'repeated' };
  const next = { ...state, guessed: [...state.guessed, letter] };
  return { state: next, result: secretLetters(state.secret).has(letter) ? 'correct' : 'wrong' };
}

/** Reveals one hidden letter (the most frequent one) without counting an error. */
export function revealHint(state: HangmanState): { state: HangmanState; letter: string | null } {
  if (getStatus(state) !== 'playing') return { state, letter: null };
  const known = new Set([...state.guessed, ...state.hinted]);
  const counts = new Map<string, number>();
  for (const ch of state.secret) {
    const n = normalizeLetter(ch);
    if (n && !known.has(n)) counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  let best: string | null = null;
  for (const [l, c] of counts) if (best === null || c > (counts.get(best) ?? 0)) best = l;
  if (!best) return { state, letter: null };
  return { state: { ...state, hinted: [...state.hinted, best] }, letter: best };
}

/** The secret split into display characters; spaces and punctuation are always visible. */
export function maskSecret(state: HangmanState, revealAll = false): MaskedChar[] {
  const known = new Set([...state.guessed, ...state.hinted]);
  return Array.from(state.secret).map((char) => {
    const letter = isLetter(char);
    return { char, isLetter: letter, revealed: !letter || revealAll || known.has(normalizeLetter(char)) };
  });
}

export function letterProgress(state: HangmanState): number {
  const letters = secretLetters(state.secret);
  if (letters.size === 0) return 1;
  const known = new Set([...state.guessed, ...state.hinted]);
  let n = 0;
  for (const l of letters) if (known.has(l)) n++;
  return n / letters.size;
}

export function validateSecret(secret: string): 'empty' | 'no-letters' | 'too-long' | null {
  const clean = secret.trim();
  if (!clean) return 'empty';
  if (secretLetters(clean).size === 0) return 'no-letters';
  if (clean.length > 60) return 'too-long';
  return null;
}
