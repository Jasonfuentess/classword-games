import type { Cell, Placement } from './types';

/**
 * Returns the straight line of cells from `start` towards `end`, snapped to the
 * nearest of the 8 directions and clipped to the grid. This is what the player
 * sees highlighted while dragging.
 */
export function lineBetween(start: Cell, end: Cell, size: number): Cell[] {
  const dRow = end.row - start.row;
  const dCol = end.col - start.col;
  if (dRow === 0 && dCol === 0) return [start];

  const octant = Math.round(Math.atan2(dRow, dCol) / (Math.PI / 4));
  const angle = (octant * Math.PI) / 4;
  const dr = Math.round(Math.sin(angle));
  const dc = Math.round(Math.cos(angle));

  let length: number;
  if (dr === 0) length = Math.abs(dCol);
  else if (dc === 0) length = Math.abs(dRow);
  else length = Math.round((Math.abs(dRow) + Math.abs(dCol)) / 2);

  const cells: Cell[] = [];
  for (let i = 0; i <= length; i++) {
    const row = start.row + dr * i;
    const col = start.col + dc * i;
    if (row < 0 || col < 0 || row >= size || col >= size) break;
    cells.push({ row, col });
  }
  return cells;
}

/** True when the cells are contiguous and follow one of the 8 directions. */
export function isStraightLine(cells: Cell[]): boolean {
  if (cells.length < 2) return cells.length === 1;
  const dr = cells[1].row - cells[0].row;
  const dc = cells[1].col - cells[0].col;
  if (Math.abs(dr) > 1 || Math.abs(dc) > 1 || (dr === 0 && dc === 0)) return false;
  return cells.every((c, i) => c.row === cells[0].row + dr * i && c.col === cells[0].col + dc * i);
}

export function lettersAt(cells: Cell[], grid: string[][]): string {
  return cells.map((c) => grid[c.row]?.[c.col] ?? '').join('');
}

/**
 * Finds which (not yet found) word the selection spells, read forwards or backwards.
 * Matching is by letters, so a word that also appears by chance elsewhere still counts.
 * Returns the placement index or -1.
 */
export function matchSelection(
  cells: Cell[],
  grid: string[][],
  placements: Placement[],
  found: ReadonlySet<number>,
): number {
  if (cells.length < 2 || !isStraightLine(cells)) return -1;
  const text = lettersAt(cells, grid);
  const reversed = Array.from(text).reverse().join('');
  return placements.findIndex((p, i) => !found.has(i) && (p.letters === text || p.letters === reversed));
}

export function cellKey(cell: Cell): string {
  return `${cell.row}:${cell.col}`;
}
