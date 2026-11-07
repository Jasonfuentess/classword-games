export interface Cell {
  row: number;
  col: number;
}

export interface Placement {
  /** Word as the creator typed it (keeps accents and spaces for display). */
  display: string;
  /** Normalized letters actually written in the grid. */
  letters: string;
  row: number;
  col: number;
  dr: number;
  dc: number;
  cells: Cell[];
}

export interface WordSearchPuzzle {
  size: number;
  grid: string[][];
  placements: Placement[];
}

export type WordListErrorCode =
  | 'too-few-words'
  | 'too-many-words'
  | 'word-too-short'
  | 'word-too-long'
  | 'duplicate-word'
  | 'invalid-characters';

export interface WordListError {
  code: WordListErrorCode;
  word?: string;
  limit?: number;
}

export type GenerateResult =
  | { ok: true; puzzle: WordSearchPuzzle }
  | { ok: false; errors: WordListError[] }
  | { ok: false; errors: []; impossible: true };
