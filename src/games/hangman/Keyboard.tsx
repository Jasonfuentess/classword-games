import { cn } from '../../utils/format';

interface KeyboardProps {
  letters: string[];
  correct: ReadonlySet<string>;
  wrong: ReadonlySet<string>;
  disabled: boolean;
  label: string;
  onGuess: (letter: string) => void;
}

export function Keyboard({ letters, correct, wrong, disabled, label, onGuess }: KeyboardProps) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-7 gap-1.5 sm:grid-cols-9 sm:gap-2">
      {letters.map((l) => {
        const isCorrect = correct.has(l);
        const isWrong = wrong.has(l);
        const used = isCorrect || isWrong;
        return (
          <button
            key={l}
            type="button"
            data-key={l}
            disabled={disabled || used}
            aria-pressed={used}
            onClick={() => onGuess(l)}
            className={cn(
              'h-11 rounded-xl text-base font-bold shadow-sm transition-all active:scale-90 sm:h-12 sm:text-lg',
              isCorrect && 'bg-teal-500 text-white shadow-teal-500/30 disabled:opacity-100',
              isWrong && 'bg-rose-100 text-rose-400 line-through disabled:opacity-100 dark:bg-rose-500/15 dark:text-rose-300/70',
              !used &&
                'bg-white text-slate-800 ring-1 ring-slate-200 hover:-translate-y-0.5 hover:bg-indigo-50 hover:ring-indigo-300 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-white/10 dark:hover:bg-slate-700',
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
