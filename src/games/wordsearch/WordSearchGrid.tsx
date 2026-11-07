import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cellKey, lineBetween, type Cell, type WordSearchPuzzle } from '../../engines/wordsearch';
import { useI18n } from '../../i18n/useI18n';
import { cn } from '../../utils/format';

export interface FoundLine {
  index: number;
  cells: Cell[];
  color: string;
}

interface GridProps {
  puzzle: WordSearchPuzzle;
  found: FoundLine[];
  hintCell: Cell | null;
  disabled: boolean;
  shake: boolean;
  onSelect: (cells: Cell[]) => void;
  onStart: () => void;
}

/**
 * Interactive letter grid. Supports:
 * - mouse/touch drag (pointer capture; `touch-action: none` stops page scrolling while dragging),
 * - tap first letter then tap last letter,
 * - keyboard: arrows move, Enter/Space anchors and confirms, Escape cancels.
 */
export function WordSearchGrid({ puzzle, found, hintCell, disabled, shake, onSelect, onStart }: GridProps) {
  const { t } = useI18n();
  const { size, grid } = puzzle;
  const gridRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  // The anchor is mirrored in a ref so pointer handlers never read a stale render.
  const anchorRef = useRef<Cell | null>(null);
  const [anchor, setAnchorState] = useState<Cell | null>(null);
  const setAnchor = (cell: Cell | null) => {
    anchorRef.current = cell;
    setAnchorState(cell);
  };
  const [current, setCurrent] = useState<Cell | null>(null);
  const [cursor, setCursor] = useState<Cell>({ row: 0, col: 0 });
  const [keyboardActive, setKeyboardActive] = useState(false);

  const selection = useMemo(() => (anchor ? lineBetween(anchor, current ?? anchor, size) : []), [anchor, current, size]);
  const selectedKeys = useMemo(() => new Set(selection.map(cellKey)), [selection]);
  const foundKeys = useMemo(() => {
    const map = new Map<string, string>();
    found.forEach((f) => f.cells.forEach((c) => map.set(cellKey(c), f.color)));
    return map;
  }, [found]);

  const cellFromPoint = (x: number, y: number): Cell => {
    const rect = gridRef.current!.getBoundingClientRect();
    const clamp = (v: number) => Math.min(size - 1, Math.max(0, v));
    return {
      row: clamp(Math.floor(((y - rect.top) / rect.height) * size)),
      col: clamp(Math.floor(((x - rect.left) / rect.width) * size)),
    };
  };

  const finish = (cells: Cell[]) => {
    setAnchor(null);
    setCurrent(null);
    onSelect(cells);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    setKeyboardActive(false);
    const cell = cellFromPoint(e.clientX, e.clientY);
    const pending = anchorRef.current;
    // Second tap of a tap-tap selection.
    if (pending && !dragging.current) {
      if (cell.row === pending.row && cell.col === pending.col) {
        setAnchor(null);
        setCurrent(null);
      } else {
        finish(lineBetween(pending, cell, size));
      }
      return;
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture is an enhancement; dragging still works without it */
    }
    dragging.current = true;
    setAnchor(cell);
    setCurrent(cell);
    onStart();
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    setCurrent((prev) => (prev && prev.row === cell.row && prev.col === cell.col ? prev : cell));
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    const start = anchorRef.current;
    if (!start) return;
    const cells = lineBetween(start, cellFromPoint(e.clientX, e.clientY), size);
    if (cells.length > 1) finish(cells);
    else setCurrent(start);
    // A single-cell press stays anchored, waiting for a second tap.
  };

  const onPointerCancel = () => {
    dragging.current = false;
    setAnchor(null);
    setCurrent(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (moves[e.key]) {
      e.preventDefault();
      setKeyboardActive(true);
      const [dr, dc] = moves[e.key];
      const next = { row: Math.min(size - 1, Math.max(0, cursor.row + dr)), col: Math.min(size - 1, Math.max(0, cursor.col + dc)) };
      setCursor(next);
      if (anchor) setCurrent(next);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setKeyboardActive(true);
      if (!anchor) {
        setAnchor(cursor);
        setCurrent(cursor);
        onStart();
      } else if (cursor.row === anchor.row && cursor.col === anchor.col) {
        setAnchor(null);
        setCurrent(null);
      } else {
        finish(lineBetween(anchor, cursor, size));
      }
    } else if (e.key === 'Escape' && anchor) {
      e.preventDefault();
      setAnchor(null);
      setCurrent(null);
    }
  };

  const center = (c: Cell) => ({ x: c.col + 0.5, y: c.row + 0.5 });

  return (
    <div className="@container mx-auto w-full" style={{ maxWidth: 'min(100%, 680px, calc(100dvh - 6rem))' }}>
      <p id="ws-keyboard-help" className="sr-only">
        {t('ws.keyboardHelp')}
      </p>
      <div
        ref={gridRef}
        role="application"
        aria-label={t('ws.gridLabel', { size })}
        aria-describedby="ws-keyboard-help"
        tabIndex={0}
        data-testid="ws-grid"
        data-size={size}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={onKeyDown}
        onFocus={() => setKeyboardActive(true)}
        onBlur={() => setKeyboardActive(false)}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          'relative aspect-square w-full touch-none rounded-3xl bg-white p-1.5 shadow-inner ring-1 ring-slate-200 select-none sm:p-2.5 dark:bg-slate-900 dark:ring-white/10',
          shake && 'animate-shake',
          disabled && 'opacity-95',
        )}
        style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
      >
        <div className="relative h-full w-full">
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
            {found.map((f) => {
              const a = center(f.cells[0]);
              const b = center(f.cells[f.cells.length - 1]);
              return (
                <line key={f.index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={f.color} strokeOpacity={0.3} strokeWidth={0.8} strokeLinecap="round" />
              );
            })}
            {selection.length > 0 && (
              <line
                x1={center(selection[0]).x}
                y1={center(selection[0]).y}
                x2={center(selection[selection.length - 1]).x}
                y2={center(selection[selection.length - 1]).y}
                stroke="#6366f1"
                strokeOpacity={0.45}
                strokeWidth={0.84}
                strokeLinecap="round"
              />
            )}
          </svg>
          <div className="relative grid h-full w-full" style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, gridTemplateRows: `repeat(${size}, 1fr)` }}>
            {grid.map((row, r) =>
              row.map((letter, c) => {
                const key = `${r}:${c}`;
                const foundColor = foundKeys.get(key);
                const selected = selectedKeys.has(key);
                const isHint = hintCell?.row === r && hintCell?.col === c;
                const isCursor = keyboardActive && cursor.row === r && cursor.col === c;
                return (
                  <div
                    key={key}
                    data-row={r}
                    data-col={c}
                    data-letter={letter}
                    className={cn(
                      'flex items-center justify-center rounded-lg font-bold transition-colors duration-100',
                      selected ? 'text-indigo-950 dark:text-white' : foundColor ? '' : 'text-slate-700 dark:text-slate-200',
                      isHint && 'animate-pulse rounded-full bg-amber-300/70 text-amber-950 ring-2 ring-amber-400',
                      isCursor && 'ring-2 ring-indigo-500 ring-inset',
                    )}
                    style={{ fontSize: `${Math.min(56 / size, 5.2)}cqw`, color: !selected && foundColor ? foundColor : undefined }}
                  >
                    {letter}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
