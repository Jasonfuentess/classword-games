import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Clock, Copy, Home, Lightbulb, RotateCcw, Star, Target, XCircle } from 'lucide-react';
import type { Activity, ResultRecord } from '../types/activity';
import type { ScoreBreakdown } from '../engines/scoring';
import { useI18n } from '../i18n/useI18n';
import { Button, ButtonLink } from '../components/ui/Button';
import { Stat } from '../components/ui/misc';
import { useToast } from '../components/ui/useToast';
import { copyText } from '../services/clipboard';
import { buildResultSummary } from '../services/results';
import { cn, formatTime } from '../utils/format';

interface ResultPanelProps {
  activity: Activity;
  record: ResultRecord;
  breakdown: ScoreBreakdown;
  won: boolean;
  timedOut: boolean;
  saved: boolean;
  progress: number;
  onRestart: () => void;
  hideHomeLink?: boolean;
}

export function ResultPanel({ activity, record, breakdown, won, timedOut, saved, progress, onRestart, hideHomeLink }: ResultPanelProps) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    ref.current?.focus({ preventScroll: true });
  }, []);

  const title = won ? t('result.won') : timedOut ? t('result.timeUp') : t('result.lost');
  const subtitle = won
    ? t(activity.type === 'wordsearch' ? 'result.wonWs' : 'result.wonHm')
    : activity.type === 'hangman'
      ? timedOut
        ? ''
        : t('result.lostHm')
      : t('ws.found', {
          found: Math.round(progress * activity.wordsearch.words.length),
          total: activity.wordsearch.words.length,
        });

  const copy = async () => {
    const ok = await copyText(buildResultSummary(record, t, locale));
    toast(ok ? t('result.summaryCopied') : t('common.copyFailed'), ok ? 'success' : 'error');
  };

  return (
    <motion.section
      ref={ref}
      tabIndex={-1}
      aria-live="polite"
      data-testid="result-panel"
      data-won={won}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="card mb-6 scroll-mt-24 overflow-hidden outline-none"
    >
      <div className={cn('px-6 py-6 text-center text-white', won ? 'bg-gradient-to-br from-teal-500 via-sky-500 to-indigo-600' : 'bg-gradient-to-br from-slate-600 via-violet-700 to-indigo-700')}>
        <div className="mb-2 flex justify-center gap-1" aria-label={`${record.stars}/3`} role="img">
          {[0, 1, 2].map((i) => (
            <motion.span key={i} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.15 + i * 0.12, type: 'spring' }}>
              <Star size={34} aria-hidden="true" className={i < record.stars ? 'fill-amber-300 text-amber-300' : 'text-white/40'} />
            </motion.span>
          ))}
        </div>
        <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-white/85">{subtitle}</p>}
        <p className="mt-3 text-5xl font-black tabular-nums" data-testid="final-score">
          {record.score}
          <span className="text-xl font-bold text-white/70">/{record.maxScore}</span>
        </p>
        {record.playerName && <p className="mt-1 text-sm text-white/80">{record.playerName}</p>}
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {activity.type === 'hangman' && (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center dark:bg-white/5">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{t('result.answer')}</p>
            <p className="text-2xl font-extrabold" data-testid="revealed-answer">
              {activity.hangman.secret}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat icon={Target} label={t('result.progress')} value={`${Math.round(progress * 100)}%`} tone="teal" />
          <Stat icon={Clock} label={t('result.time')} value={formatTime(record.elapsedSec)} tone="indigo" />
          <Stat icon={XCircle} label={t('result.errors')} value={record.errors} tone="rose" />
          <Stat icon={Lightbulb} label={t('result.hints')} value={record.hintsUsed} tone="amber" />
        </div>

        <dl className="grid gap-1.5 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-white/5">
          <Row label={t('result.breakdown.base')} value={`+${breakdown.base}`} />
          {activity.timerEnabled && <Row label={t('result.breakdown.speed')} value={`+${breakdown.speedBonus}`} />}
          {breakdown.errorPenalty > 0 && <Row label={t('result.breakdown.errors')} value={`−${breakdown.errorPenalty}`} negative />}
          {breakdown.hintPenalty > 0 && <Row label={t('result.breakdown.hints')} value={`−${breakdown.hintPenalty}`} negative />}
        </dl>

        <div className="grid gap-2 sm:grid-cols-3">
          <Button variant="primary" icon={RotateCcw} onClick={onRestart} data-testid="try-again">
            {t('result.tryAgain')}
          </Button>
          <Button icon={Copy} onClick={copy} data-testid="copy-summary">
            {t('result.copySummary')}
          </Button>
          {!hideHomeLink && (
            <ButtonLink to="/" icon={Home} variant="ghost">
              {t('common.backHome')}
            </ButtonLink>
          )}
        </div>
        {saved && <p className="text-center text-xs text-slate-400">{t('result.savedLocal')}</p>}
      </div>
    </motion.section>
  );
}

function Row({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={cn('font-bold tabular-nums', negative ? 'text-rose-500' : 'text-teal-600 dark:text-teal-400')}>{value}</dd>
    </div>
  );
}
