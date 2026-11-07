export const MIN_WORDS = 3;
export const MAX_WORDS = 20;
export const MIN_WORD_LENGTH = 2;
export const MIN_GRID = 8;
export const MAX_GRID = 20;
export const GRID_SIZES = [10, 12, 15, 20] as const;

export const DIR = {
  E: [0, 1],
  S: [1, 0],
  SE: [1, 1],
  NE: [-1, 1],
  W: [0, -1],
  N: [-1, 0],
  NW: [-1, -1],
  SW: [1, -1],
} as const satisfies Record<string, readonly [number, number]>;

export function allowedDirections(allowDiagonal: boolean, allowReverse: boolean): Array<readonly [number, number]> {
  const dirs: Array<readonly [number, number]> = [DIR.E, DIR.S];
  if (allowDiagonal) dirs.push(DIR.SE, DIR.NE);
  if (allowReverse) {
    dirs.push(DIR.W, DIR.N);
    if (allowDiagonal) dirs.push(DIR.NW, DIR.SW);
  }
  return dirs;
}
