import type { ContentLanguage, Difficulty, GridSizeOption } from '../../types/activity';
import { alphabetFor, normalizeForGrid } from '../../utils/text';
import { createRng, randomInt, shuffle, type Rng } from '../../utils/random';
import { allowedDirections, MAX_GRID, MAX_WORDS, MIN_GRID, MIN_WORD_LENGTH, MIN_WORDS } from './constants';
import type { Cell, GenerateResult, Placement, WordListError, WordSearchPuzzle } from './types';

export interface GenerateOptions {
  words: string[];
  gridSize: GridSizeOption;
  allowDiagonal: boolean;
  allowReverse: boolean;
  difficulty: Difficulty;
  language: ContentLanguage;
  seed: number;
}

const DENSITY: Record<Difficulty, number> = { easy: 0.55, medium: 0.45, hard: 0.35 };
const MIN_SIZE_BY_DIFFICULTY: Record<Difficulty, number> = { easy: MIN_GRID, medium: 10, hard: 12 };
const ATTEMPTS = 6;
const STEP_BUDGET = 40_000;

export function maxWordLength(gridSize: GridSizeOption): number {
  return gridSize === 'auto' ? MAX_GRID : gridSize;
}

/** Validates the raw word list without trying to build a grid. */
export function validateWordList(words: string[], gridSize: GridSizeOption): WordListError[] {
  const errors: WordListError[] = [];
  if (words.length < MIN_WORDS) errors.push({ code: 'too-few-words', limit: MIN_WORDS });
  if (words.length > MAX_WORDS) errors.push({ code: 'too-many-words', limit: MAX_WORDS });

  const seen = new Set<string>();
  const maxLen = maxWordLength(gridSize);
  for (const word of words) {
    const letters = normalizeForGrid(word);
    if (letters.length === 0) {
      errors.push({ code: 'invalid-characters', word });
      continue;
    }
    if (letters.length < MIN_WORD_LENGTH) errors.push({ code: 'word-too-short', word, limit: MIN_WORD_LENGTH });
    if (letters.length > maxLen) errors.push({ code: 'word-too-long', word, limit: maxLen });
    if (seen.has(letters)) errors.push({ code: 'duplicate-word', word });
    seen.add(letters);
  }
  return errors;
}

export function resolveGridSize(letterWords: string[], gridSize: GridSizeOption, difficulty: Difficulty): number {
  if (gridSize !== 'auto') return gridSize;
  const longest = Math.max(...letterWords.map((w) => w.length));
  const total = letterWords.reduce((sum, w) => sum + w.length, 0);
  const byArea = Math.ceil(Math.sqrt(total / DENSITY[difficulty]));
  return Math.min(MAX_GRID, Math.max(longest, byArea, MIN_SIZE_BY_DIFFICULTY[difficulty]));
}

interface Candidate {
  row: number;
  col: number;
  dr: number;
  dc: number;
}

class GridBuilder {
  readonly cells: string[][];
  private readonly usage: number[][];

  constructor(size: number) {
    this.cells = Array.from({ length: size }, () => Array<string>(size).fill(''));
    this.usage = Array.from({ length: size }, () => Array<number>(size).fill(0));
  }

  fits(letters: string, c: Candidate): boolean {
    for (let i = 0; i < letters.length; i++) {
      const existing = this.cells[c.row + c.dr * i][c.col + c.dc * i];
      if (existing !== '' && existing !== letters[i]) return false;
    }
    return true;
  }

  /** Reject placements that would lie entirely on top of an already placed word. */
  fullyOverlaps(letters: string, c: Candidate): boolean {
    for (let i = 0; i < letters.length; i++) {
      if (this.usage[c.row + c.dr * i][c.col + c.dc * i] === 0) return false;
    }
    return true;
  }

  write(letters: string, c: Candidate): void {
    for (let i = 0; i < letters.length; i++) {
      const r = c.row + c.dr * i;
      const col = c.col + c.dc * i;
      this.cells[r][col] = letters[i];
      this.usage[r][col]++;
    }
  }

  erase(letters: string, c: Candidate): void {
    for (let i = 0; i < letters.length; i++) {
      const r = c.row + c.dr * i;
      const col = c.col + c.dc * i;
      this.usage[r][col]--;
      if (this.usage[r][col] === 0) this.cells[r][col] = '';
    }
  }
}

/** Every start/direction combination that keeps the whole word inside the grid. */
function candidatesFor(length: number, size: number, dirs: Array<readonly [number, number]>): Candidate[] {
  const out: Candidate[] = [];
  for (const [dr, dc] of dirs) {
    for (let row = 0; row < size; row++) {
      const endRow = row + dr * (length - 1);
      if (endRow < 0 || endRow >= size) continue;
      for (let col = 0; col < size; col++) {
        const endCol = col + dc * (length - 1);
        if (endCol < 0 || endCol >= size) continue;
        out.push({ row, col, dr, dc });
      }
    }
  }
  return out;
}

function solve(
  words: string[],
  size: number,
  dirs: Array<readonly [number, number]>,
  rng: Rng,
): Candidate[] | null {
  const grid = new GridBuilder(size);
  const chosen: Candidate[] = [];
  let steps = 0;

  const placeFrom = (index: number): boolean => {
    if (index === words.length) return true;
    const letters = words[index];
    for (const c of shuffle(candidatesFor(letters.length, size, dirs), rng)) {
      if (++steps > STEP_BUDGET) return false;
      if (!grid.fits(letters, c) || grid.fullyOverlaps(letters, c)) continue;
      grid.write(letters, c);
      chosen.push(c);
      if (placeFrom(index + 1)) return true;
      chosen.pop();
      grid.erase(letters, c);
      if (steps > STEP_BUDGET) return false;
    }
    return false;
  };

  return placeFrom(0) ? chosen : null;
}

function cellsOf(c: Candidate, length: number): Cell[] {
  return Array.from({ length }, (_, i) => ({ row: c.row + c.dr * i, col: c.col + c.dc * i }));
}

/**
 * Builds a word-search grid deterministically from the options (including the seed).
 * Uses randomized backtracking with a step budget and several restarts; if no
 * arrangement is found the configuration is reported as impossible.
 */
export function generateWordSearch(options: GenerateOptions): GenerateResult {
  const errors = validateWordList(options.words, options.gridSize);
  if (errors.length > 0) return { ok: false, errors };

  const entries = options.words
    .map((display) => ({ display, letters: normalizeForGrid(display) }))
    // Longest words first: they are the hardest to fit.
    .sort((a, b) => b.letters.length - a.letters.length || a.letters.localeCompare(b.letters));
  const letterWords = entries.map((e) => e.letters);
  const size = resolveGridSize(letterWords, options.gridSize, options.difficulty);
  const dirs = allowedDirections(options.allowDiagonal, options.allowReverse);
  const rng = createRng(options.seed);

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const solution = solve(letterWords, size, dirs, rng);
    if (!solution) continue;

    const grid: string[][] = Array.from({ length: size }, () => Array<string>(size).fill(''));
    const placements: Placement[] = entries.map((entry, i) => {
      const c = solution[i];
      const cells = cellsOf(c, entry.letters.length);
      cells.forEach((cell, k) => (grid[cell.row][cell.col] = entry.letters[k]));
      return { display: entry.display, letters: entry.letters, ...c, cells };
    });

    const alphabet = alphabetFor(options.language);
    for (const row of grid) {
      for (let c = 0; c < size; c++) if (row[c] === '') row[c] = alphabet[randomInt(rng, alphabet.length)];
    }

    const puzzle: WordSearchPuzzle = { size, grid, placements };
    return { ok: true, puzzle };
  }
  return { ok: false, errors: [], impossible: true };
}
