import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Lightbulb, Sparkles } from 'lucide-react';
import {
  correctGuesses,
  createHangman,
  getStatus,
  guessLetter,
  letterProgress,
  maskSecret,
  revealHint,
  secretLetters,
  wrongGuesses,
  type HangmanState,
} from '../../engines/hangman/hangman';
import type { HangmanActivity } from '../../types/activity';
import { useI18n } from '../../i18n/useI18n';
import { playSound } from '../../services/sound';
import { alphabetFor, normalizeLetter } from '../../utils/text';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/format';
import type { GameComponentProps } from '../types';
import { HangmanDrawing } from './HangmanDrawing';
import { Keyboard } from './Keyboard';

export function HangmanGame({ activity, finished, onStats, onComplete }: GameComponentProps<HangmanActivity>) {
  const { t } = useI18n();
  const settings = activity.hangman;
  const [state, setState] = useState<HangmanState>(() => createHangman(settings.secret, settings.maxErrors));
  const [message, setMessage] = useState('');
  const [shake, setShake] = useState(false);
  const shakeTimer = useRef<number | undefined>(undefined);

  const status = getStatus(state);
  const wrong = wrongGuesses(state);
  const correctSet = useMemo(() => new Set([...correctGuesses(state), ...state.hinted]), [state]);
  const wrongSet = useMemo(() => new Set(wrongGuesses(state)), [state]);
  const masked = maskSecret(state, finished || status !== 'playing');
  const keys = useMemo(() => {
    const base = Array.from(alphabetFor(activity.language));
    // Make sure every letter of the secret is typeable (e.g. Ñ in an English activity).
    for (const l of secretLetters(settings.secret)) if (!base.includes(l)) base.push(l);
    return base;
  }, [activity.language, settings.secret]);

  const apply = (next: HangmanState, kind: 'correct' | 'wrong' | 'hint', letter: string) => {
    setState(next);
    const nextStatus = getStatus(next);
    onStats({ progress: letterProgress(next), errors: wrongGuesses(next).length, hintsUsed: next.hinted.length });
    if (kind === 'wrong') {
      setShake(true);
      window.clearTimeout(shakeTimer.current);
      shakeTimer.current = window.setTimeout(() => setShake(false), 420);
      setMessage(t('hm.wrong', { letter }));
    } else {
      setMessage(t('hm.correct', { letter }));
    }
    if (nextStatus === 'won') onComplete(true);
    else if (nextStatus === 'lost') onComplete(false);
    else playSound(kind === 'wrong' ? 'wrong' : kind === 'hint' ? 'hint' : 'correct');
  };

  const guess = (raw: string) => {
    if (finished) return;
    const { state: next, result } = guessLetter(state, raw);
    if (result === 'repeated') setMessage(t('hm.repeated', { letter: normalizeLetter(raw) }));
    if (result === 'correct' || result === 'wrong') apply(next, result, normalizeLetter(raw));
  };

  const hint = () => {
    const { state: next, letter } = revealHint(state);
    if (letter) apply(next, 'hint', letter);
  };

  // Physical keyboard support. A ref keeps the listener stable while reading fresh state.
  const guessRef = useRef(guess);
  useEffect(() => {
    guessRef.current = guess;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      if (!normalizeLetter(e.key)) return;
      e.preventDefault();
      guessRef.current(e.key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const attemptsLeft = state.maxErrors - wrong.length;
  const words = useMemo(() => {
    // Group characters into words so long phrases wrap between words, not mid-word.
    const groups: Array<Array<{ char: string; isLetter: boolean; revealed: boolean; index: number }>> = [[]];
    masked.forEach((m, index) => {
      if (m.char === ' ') groups.push([]);
      else groups[groups.length - 1].push({ ...m, index });
    });
    return groups.filter((g) => g.length);
  }, [masked]);

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-start">
      <div className="card flex flex-col items-center gap-3 p-4">
        <div className={cn('h-[24dvh] max-h-64 min-h-36 w-full md:h-72 md:max-h-none', shake && 'animate-shake')}>
          <HangmanDrawing errors={wrong.length} maxErrors={state.maxErrors} lost={status === 'lost'} won={status === 'won'} />
        </div>
        <div className="flex items-center gap-1" aria-label={t('hm.attemptsLeft', { count: attemptsLeft })} role="img">
          {Array.from({ length: state.maxErrors }, (_, i) => (
            <Heart
              key={i}
              size={18}
              aria-hidden="true"
              className={cn('transition', i < attemptsLeft ? 'fill-rose-500 text-rose-500' : 'text-slate-300 dark:text-slate-600')}
            />
          ))}
        </div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300" data-testid="hm-attempts">
          {t('hm.attemptsLeft', { count: attemptsLeft })}
        </p>
      </div>

      <div className="space-y-4">
        {settings.hint && (
          <div className="flex items-start gap-2 rounded-2xl bg-violet-50 px-4 py-3 text-sm text-violet-900 dark:bg-violet-500/10 dark:text-violet-100">
            <Sparkles size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              <strong>{t('hm.hint')}:</strong> {settings.hint}
            </p>
          </div>
        )}

        <div className="card px-3 py-5 sm:px-5" aria-label={t('hm.secretLabel')} role="group" data-testid="hm-secret">
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-3">
            {words.map((group, gi) => (
              <div key={gi} className="flex flex-wrap justify-center gap-1 sm:gap-1.5">
                {group.map((m) =>
                  m.isLetter ? (
                    <span
                      key={m.index}
                      data-revealed={m.revealed}
                      className={cn(
                        'flex h-10 w-7 items-end justify-center border-b-4 pb-0.5 text-2xl font-extrabold sm:h-12 sm:w-9 sm:text-3xl',
                        m.revealed ? 'border-indigo-400' : 'border-slate-300 dark:border-slate-600',
                        finished && status === 'lost' && m.revealed && !correctSet.has(normalizeLetter(m.char)) && 'text-rose-500',
                      )}
                    >
                      {m.revealed && (
                        <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                          {m.char.toLocaleUpperCase('es')}
                        </motion.span>
                      )}
                    </span>
                  ) : (
                    <span key={m.index} className="flex h-10 items-end pb-1 text-2xl font-bold sm:h-12 sm:text-3xl">
                      {m.char}
                    </span>
                  ),
                )}
              </div>
            ))}
          </div>
          <p aria-live="polite" className="mt-4 min-h-5 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            {message}
          </p>
        </div>

        {wrong.length > 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('hm.wrongLetters')}: <span className="font-bold tracking-widest text-rose-500">{wrong.join(' ')}</span>
          </p>
        )}

        <Keyboard
          letters={keys}
          correct={correctSet}
          wrong={wrongSet}
          disabled={finished || status !== 'playing'}
          label={t('hm.keyboardLabel')}
          onGuess={guess}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="hidden text-xs text-slate-400 sm:block">{t('hm.typeHelp')}</p>
          {activity.hintsEnabled && !finished && status === 'playing' && (
            <Button variant="soft" size="sm" icon={Lightbulb} onClick={hint}>
              {t('hm.revealLetter')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
