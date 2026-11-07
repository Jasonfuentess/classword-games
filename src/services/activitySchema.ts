import type {
  Activity,
  ContentLanguage,
  Difficulty,
  GridSizeOption,
  HangmanActivity,
  WordSearchActivity,
} from '../types/activity';
import { MAX_ERRORS, MIN_ERRORS, validateSecret } from '../engines/hangman/hangman';
import { validateWordList, type WordListError } from '../engines/wordsearch';
import { generateWordSearch } from '../engines/wordsearch/generator';
import { cleanDisplay } from '../utils/text';

export const LIMITS = {
  title: 80,
  instructions: 400,
  clue: 200,
  hint: 200,
  secret: 60,
  timeLimitSec: 60 * 60,
} as const;

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const LANGUAGES: ContentLanguage[] = ['en', 'es'];
const GRID_OPTIONS: GridSizeOption[] = ['auto', 10, 12, 15, 20];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number): string | null => (typeof v === 'string' && v.length <= max * 2 ? v.slice(0, max) : null);
const bool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null);
const num = (v: unknown, min: number, max: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null;

/**
 * Strictly converts unknown data (from localStorage or a shared link) into an Activity.
 * Returns null on any structural problem so corrupted data can never crash the app.
 */
export function parseActivity(input: unknown): Activity | null {
  if (!isObj(input)) return null;
  const id = str(input.id, 100);
  const title = str(input.title, LIMITS.title);
  const instructions = str(input.instructions, LIMITS.instructions);
  const language = LANGUAGES.find((l) => l === input.language);
  const difficulty = DIFFICULTIES.find((d) => d === input.difficulty);
  const timerEnabled = bool(input.timerEnabled);
  const timeLimitSec = num(input.timeLimitSec, 0, LIMITS.timeLimitSec);
  const hintsEnabled = bool(input.hintsEnabled);
  const createdAt = num(input.createdAt, 0, Number.MAX_SAFE_INTEGER);
  const updatedAt = num(input.updatedAt, 0, Number.MAX_SAFE_INTEGER);
  if (
    !id || title === null || !title.trim() || instructions === null || !language || !difficulty ||
    timerEnabled === null || timeLimitSec === null || hintsEnabled === null || createdAt === null || updatedAt === null
  ) {
    return null;
  }
  const common = { id, title, instructions, language, difficulty, timerEnabled, timeLimitSec, hintsEnabled, createdAt, updatedAt };

  if (input.type === 'wordsearch' && isObj(input.wordsearch)) {
    const ws = input.wordsearch;
    if (!Array.isArray(ws.words) || ws.words.length > 40) return null;
    const words = ws.words.map((w) => str(w, 40));
    if (words.some((w) => w === null)) return null;
    const gridSize = GRID_OPTIONS.find((g) => g === ws.gridSize);
    const allowDiagonal = bool(ws.allowDiagonal);
    const allowReverse = bool(ws.allowReverse);
    const clue = str(ws.clue, LIMITS.clue);
    const showWordList = bool(ws.showWordList);
    const seed = num(ws.seed, 0, 0xffffffff);
    if (gridSize === undefined || allowDiagonal === null || allowReverse === null || clue === null || showWordList === null || seed === null) {
      return null;
    }
    const activity: WordSearchActivity = {
      ...common,
      type: 'wordsearch',
      wordsearch: { words: words as string[], gridSize, allowDiagonal, allowReverse, clue, showWordList, seed: Math.floor(seed) },
    };
    return activity;
  }

  if (input.type === 'hangman' && isObj(input.hangman)) {
    const hm = input.hangman;
    const secret = str(hm.secret, LIMITS.secret);
    const hint = str(hm.hint, LIMITS.hint);
    const maxErrors = num(hm.maxErrors, MIN_ERRORS, MAX_ERRORS);
    const category = hm.category === null ? null : str(hm.category, 40);
    if (secret === null || hint === null || maxErrors === null || category === null && hm.category !== null) return null;
    const activity: HangmanActivity = {
      ...common,
      type: 'hangman',
      hangman: { secret, hint, maxErrors: Math.round(maxErrors), category },
    };
    return activity;
  }
  return null;
}

export type ActivityIssue =
  | { field: 'title'; code: 'required' | 'too-long' }
  | { field: 'instructions'; code: 'too-long' }
  | { field: 'words'; code: 'list'; errors: WordListError[] }
  | { field: 'words'; code: 'impossible' }
  | { field: 'secret'; code: 'empty' | 'no-letters' | 'too-long' }
  | { field: 'timeLimit'; code: 'range' };

/** Business-rule validation used by the editor before saving or sharing. */
export function validateActivity(activity: Activity): ActivityIssue[] {
  const issues: ActivityIssue[] = [];
  if (!activity.title.trim()) issues.push({ field: 'title', code: 'required' });
  if (activity.title.length > LIMITS.title) issues.push({ field: 'title', code: 'too-long' });
  if (activity.instructions.length > LIMITS.instructions) issues.push({ field: 'instructions', code: 'too-long' });
  if (activity.timerEnabled && (activity.timeLimitSec < 0 || activity.timeLimitSec > LIMITS.timeLimitSec)) {
    issues.push({ field: 'timeLimit', code: 'range' });
  }
  if (activity.type === 'wordsearch') {
    const errors = validateWordList(activity.wordsearch.words, activity.wordsearch.gridSize);
    if (errors.length) issues.push({ field: 'words', code: 'list', errors });
    else {
      const result = generateWordSearch({ ...activity.wordsearch, difficulty: activity.difficulty, language: activity.language });
      if (!result.ok) issues.push({ field: 'words', code: 'impossible' });
    }
  } else {
    const err = validateSecret(activity.hangman.secret);
    if (err) issues.push({ field: 'secret', code: err });
  }
  return issues;
}

/** Normalizes user-entered text fields before persisting. */
export function tidyActivity<T extends Activity>(activity: T): T {
  const base = { ...activity, title: cleanDisplay(activity.title), instructions: activity.instructions.trim() };
  if (base.type === 'wordsearch') {
    return {
      ...base,
      wordsearch: { ...base.wordsearch, words: base.wordsearch.words.map(cleanDisplay).filter(Boolean), clue: base.wordsearch.clue.trim() },
    } as T;
  }
  return { ...base, hangman: { ...base.hangman, secret: cleanDisplay(base.hangman.secret), hint: base.hangman.hint.trim() } } as T;
}
