import { describe, expect, it } from 'vitest';
import {
  generateWordSearch,
  isStraightLine,
  lineBetween,
  matchSelection,
  resolveGridSize,
  validateWordList,
  type GenerateOptions,
  type WordSearchPuzzle,
} from '../../src/engines/wordsearch';
import { CATEGORIES } from '../../src/data/categories';

const base: Omit<GenerateOptions, 'words'> = {
  gridSize: 'auto',
  allowDiagonal: true,
  allowReverse: true,
  difficulty: 'medium',
  language: 'es',
  seed: 12345,
};

function expectValid(puzzle: WordSearchPuzzle) {
  const { size, grid, placements } = puzzle;
  expect(grid).toHaveLength(size);
  grid.forEach((row) => {
    expect(row).toHaveLength(size);
    row.forEach((cell) => expect(cell).toMatch(/^[A-ZÑ]$/));
  });
  for (const p of placements) {
    expect(p.cells).toHaveLength(p.letters.length);
    expect(isStraightLine(p.cells)).toBe(true);
    p.cells.forEach((c, i) => {
      expect(c.row).toBeGreaterThanOrEqual(0);
      expect(c.col).toBeGreaterThanOrEqual(0);
      expect(c.row).toBeLessThan(size);
      expect(c.col).toBeLessThan(size);
      expect(grid[c.row][c.col]).toBe(p.letters[i]);
    });
  }
}

function generateOk(options: GenerateOptions): WordSearchPuzzle {
  const result = generateWordSearch(options);
  if (!result.ok) throw new Error(`generation failed: ${JSON.stringify(result)}`);
  return result.puzzle;
}

describe('word search generation', () => {
  it('places every word inside the grid with matching letters', () => {
    const words = ['Elefante', 'Jirafa', 'Delfín', 'Pingüino', 'Tigre', 'Conejo', 'Águila', 'Cebra'];
    const puzzle = generateOk({ ...base, words });
    expect(puzzle.placements.map((p) => p.display).sort()).toEqual([...words].sort());
    expectValid(puzzle);
  });

  it('works for every preset category in both languages and all grid sizes', () => {
    for (const cat of CATEGORIES) {
      for (const lang of ['en', 'es'] as const) {
        for (const gridSize of ['auto', 15, 20] as const) {
          const puzzle = generateOk({ ...base, language: lang, gridSize, words: cat.words[lang] });
          expect(puzzle.placements).toHaveLength(cat.words[lang].length);
          expectValid(puzzle);
        }
      }
    }
  });

  it('is deterministic: the same seed rebuilds the exact same grid', () => {
    const words = ['Sol', 'Luna', 'Estrella', 'Cometa', 'Planeta'];
    const a = generateOk({ ...base, words, seed: 99 });
    const b = generateOk({ ...base, words, seed: 99 });
    const c = generateOk({ ...base, words, seed: 100 });
    expect(a.grid).toEqual(b.grid);
    expect(a.placements).toEqual(b.placements);
    expect(a.grid).not.toEqual(c.grid);
  });

  it('allows valid crossings: shared cells always hold the same letter', () => {
    // 20 words in a 12x12 grid: far more letters than free space without crossings.
    const words = CATEGORIES.find((c) => c.id === 'colors')!.words.en.concat(['Cyan', 'Teal', 'Navy', 'Gold', 'Lime', 'Plum', 'Rose', 'Sand']);
    let crossings = 0;
    for (let seed = 1; seed <= 5; seed++) {
      const puzzle = generateOk({ ...base, words, gridSize: 12, seed });
      expectValid(puzzle);
      const seen = new Map<string, string>();
      for (const p of puzzle.placements) {
        p.cells.forEach((c, i) => {
          const key = `${c.row}:${c.col}`;
          if (seen.has(key)) {
            crossings++;
            expect(seen.get(key)).toBe(p.letters[i]);
          }
          seen.set(key, p.letters[i]);
        });
      }
    }
    expect(crossings).toBeGreaterThan(0);
  });

  it('respects direction settings', () => {
    const words = ['Manzana', 'Plátano', 'Cereza', 'Durazno', 'Naranja'];
    for (let seed = 0; seed < 10; seed++) {
      const puzzle = generateOk({ ...base, words, allowDiagonal: false, allowReverse: false, seed });
      for (const p of puzzle.placements) {
        expect([[0, 1], [1, 0]]).toContainEqual([p.dr, p.dc]);
      }
    }
  });

  it('chooses an automatic size that fits the longest word', () => {
    expect(resolveGridSize(['FOTOSINTESIS', 'SOL', 'MAR'], 'auto', 'easy')).toBeGreaterThanOrEqual(12);
    expect(resolveGridSize(['SOL', 'MAR', 'RIO'], 'auto', 'easy')).toBe(8);
    expect(resolveGridSize(['SOL', 'MAR', 'RIO'], 15, 'easy')).toBe(15);
  });

  it('detects impossible configurations', () => {
    // 20 ten-letter words with no shared letter pattern in a 10x10 grid, rows/columns only.
    const alphabet = 'ABCDEFGHIJKLMNOPQRST';
    const words = Array.from({ length: 20 }, (_, i) => (alphabet + alphabet).slice(i, i + 10));
    const result = generateWordSearch({ ...base, words, gridSize: 10, allowDiagonal: false, allowReverse: false });
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ impossible: true });
  });
});

describe('word list validation', () => {
  it('requires between 3 and 20 words', () => {
    expect(validateWordList(['Uno', 'Dos'], 'auto')[0].code).toBe('too-few-words');
    const many = Array.from({ length: 21 }, (_, i) => `Word${String.fromCharCode(65 + i)}x`);
    expect(validateWordList(many, 'auto').map((e) => e.code)).toContain('too-many-words');
  });

  it('rejects words that do not fit the chosen grid', () => {
    const errors = validateWordList(['Sol', 'Luna', 'Electromagnetismo'], 10);
    expect(errors).toEqual([{ code: 'word-too-long', word: 'Electromagnetismo', limit: 10 }]);
    const result = generateWordSearch({ ...base, words: ['Sol', 'Luna', 'Electromagnetismo'], gridSize: 10 });
    expect(result.ok).toBe(false);
  });

  it('detects duplicates regardless of accents and case', () => {
    expect(validateWordList(['Canción', 'CANCION', 'Mar'], 'auto').map((e) => e.code)).toEqual(['duplicate-word']);
  });

  it('rejects too-short words and words without letters', () => {
    const codes = validateWordList(['A', '123', 'Sol', 'Mar'], 'auto').map((e) => e.code);
    expect(codes).toContain('word-too-short');
    expect(codes).toContain('invalid-characters');
  });
});

describe('selection', () => {
  it('snaps a drag to the nearest straight direction', () => {
    expect(lineBetween({ row: 0, col: 0 }, { row: 0, col: 3 }, 10)).toHaveLength(4);
    expect(lineBetween({ row: 0, col: 0 }, { row: 3, col: 3 }, 10).at(-1)).toEqual({ row: 3, col: 3 });
    // Slightly off-diagonal drag still becomes a diagonal.
    const snapped = lineBetween({ row: 0, col: 0 }, { row: 3, col: 4 }, 10);
    expect(isStraightLine(snapped)).toBe(true);
    expect(snapped.at(-1)).toEqual({ row: 4, col: 4 });
    // Mostly horizontal drag stays horizontal.
    expect(lineBetween({ row: 2, col: 0 }, { row: 3, col: 6 }, 10).every((c) => c.row === 2)).toBe(true);
  });

  it('never leaves the grid', () => {
    const cells = lineBetween({ row: 8, col: 8 }, { row: 14, col: 14 }, 10);
    expect(cells.at(-1)).toEqual({ row: 9, col: 9 });
  });

  it('rejects non-straight or broken lines', () => {
    expect(isStraightLine([{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 3 }])).toBe(false);
    expect(isStraightLine([{ row: 0, col: 0 }, { row: 0, col: 2 }])).toBe(false);
  });

  it('matches correct selections forwards and backwards, and rejects wrong ones', () => {
    const puzzle = generateOk({ ...base, words: ['Gato', 'Perro', 'Loro'], seed: 7 });
    const target = puzzle.placements[0];
    const found = new Set<number>();
    expect(matchSelection(target.cells, puzzle.grid, puzzle.placements, found)).toBe(0);
    expect(matchSelection([...target.cells].reverse(), puzzle.grid, puzzle.placements, found)).toBe(0);
    expect(matchSelection(target.cells.slice(0, 2), puzzle.grid, puzzle.placements, found)).toBe(-1);
    expect(matchSelection(target.cells, puzzle.grid, puzzle.placements, new Set([0]))).toBe(-1);
  });
});
