import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, Lightbulb, Search } from 'lucide-react';
import { matchSelection, lettersAt, type Cell, type WordSearchPuzzle } from '../../engines/wordsearch';
import type { WordSearchActivity } from '../../types/activity';
import { useI18n } from '../../i18n/useI18n';
import { playSound } from '../../services/sound';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/format';
import type { GameComponentProps } from '../types';
import { WordSearchGrid, type FoundLine } from './WordSearchGrid';
import { FOUND_COLORS } from './colors';

interface Props extends GameComponentProps<WordSearchActivity> {
  puzzle: WordSearchPuzzle;
}

export function WordSearchGame({ activity, puzzle, finished, onStats, onComplete }: Props) {
  const { t } = useI18n();
  const settings = activity.wordsearch;
  const total = puzzle.placements.length;
  const [found, setFound] = useState<FoundLine[]>([]);
  const [errors, setErrors] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintCell, setHintCell] = useState<Cell | null>(null);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState('');
  const shakeTimer = useRef<number | undefined>(undefined);

  const foundSet = useMemo(() => new Set(found.map((f) => f.index)), [found]);
  // Word list in the creator's order, not the generator's (which is sorted by length).
  const listOrder = useMemo(
    () => settings.words.map((w) => puzzle.placements.findIndex((p) => p.display === w)).filter((i) => i >= 0),
    [settings.words, puzzle.placements],
  );

  const report = (nextFound: number, nextErrors: number, nextHints: number) =>
    onStats({ progress: nextFound / total, errors: nextErrors, hintsUsed: nextHints });

  const handleSelect = (cells: Cell[]) => {
    if (finished || cells.length < 2) return;
    const index = matchSelection(cells, puzzle.grid, puzzle.placements, foundSet);
    if (index >= 0) {
      const next = [...found, { index, cells, color: FOUND_COLORS[found.length % FOUND_COLORS.length] }];
      setFound(next);
      if (hintCell && puzzle.placements[index].cells.some((c) => c.row === hintCell.row && c.col === hintCell.col)) setHintCell(null);
      setMessage(t('ws.foundWord', { word: puzzle.placements[index].display }));
      report(next.length, errors, hintsUsed);
      if (next.length === total) onComplete(true);
      else playSound('correct');
      return;
    }
    // Re-selecting an already found word is not a mistake.
    const text = lettersAt(cells, puzzle.grid);
    const reversed = Array.from(text).reverse().join('');
    if (puzzle.placements.some((p, i) => foundSet.has(i) && (p.letters === text || p.letters === reversed))) return;
    const nextErrors = errors + 1;
    setErrors(nextErrors);
    setMessage(t('ws.notAWord'));
    setShake(true);
    window.clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setShake(false), 420);
    playSound('wrong');
    report(found.length, nextErrors, hintsUsed);
  };

  const requestHint = () => {
    const target = listOrder.find((i) => !foundSet.has(i));
    if (target === undefined) return;
    const nextHints = hintsUsed + 1;
    setHintsUsed(nextHints);
    setHintCell(puzzle.placements[target].cells[0]);
    setMessage(t('ws.hintUsed'));
    playSound('hint');
    report(found.length, errors, nextHints);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div>
        <WordSearchGrid
          puzzle={puzzle}
          found={found}
          hintCell={hintCell}
          disabled={finished}
          shake={shake}
          onSelect={handleSelect}
          onStart={() => playSound('select')}
        />
        <p aria-live="polite" className="mt-2 min-h-5 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          {message}
        </p>
      </div>

      <aside className="card space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-bold">
            <Search size={18} className="text-indigo-500" aria-hidden="true" />
            {t('ws.words')}
          </h2>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 tabular-nums dark:bg-indigo-500/15 dark:text-indigo-200" data-testid="ws-remaining">
            {t('ws.remaining', { count: total - found.length })}
          </span>
        </div>

        {settings.clue && (
          <p className="rounded-2xl bg-violet-50 px-3 py-2 text-sm text-violet-900 dark:bg-violet-500/10 dark:text-violet-100">
            <strong>{t('ws.clue')}:</strong> {settings.clue}
          </p>
        )}

        {settings.showWordList ? (
          <ul className="flex flex-wrap gap-2" data-testid="ws-word-list">
            {listOrder.map((i) => {
              const p = puzzle.placements[i];
              const f = found.find((x) => x.index === i);
              return (
                <li
                  key={i}
                  data-word={p.letters}
                  data-found={!!f}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition',
                    f ? 'bg-slate-100 text-slate-400 line-through dark:bg-white/5 dark:text-slate-500' : 'bg-white ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-white/10',
                  )}
                >
                  {f && <CheckCircle2 size={14} style={{ color: f.color }} aria-hidden="true" />}
                  {p.display}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('ws.hiddenList')}</p>
            <ul className="flex flex-wrap gap-2">
              {found.map((f) => (
                <li key={f.index} className="rounded-xl px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: f.color }}>
                  {puzzle.placements[f.index].display}
                </li>
              ))}
            </ul>
          </div>
        )}

        {activity.hintsEnabled && !finished && (
          <Button variant="soft" icon={Lightbulb} className="w-full" onClick={requestHint} disabled={found.length === total}>
            {t('ws.hint')}
          </Button>
        )}
      </aside>
    </div>
  );
}
