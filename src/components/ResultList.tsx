import { Star } from 'lucide-react';
import type { ResultRecord } from '../types/activity';
import { useI18n } from '../i18n/useI18n';
import { formatDate, formatTime } from '../utils/format';
import { GameIcon } from './GameIcon';

export function ResultList({ results }: { results: ResultRecord[] }) {
  const { t, locale } = useI18n();
  return (
    <ul className="divide-y divide-slate-100 dark:divide-white/5">
      {results.map((r) => (
        <li key={r.id} className="flex items-center gap-3 py-3">
          <GameIcon type={r.gameType} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{r.activityTitle}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatDate(r.playedAt, locale)} · {formatTime(r.elapsedSec)} · {r.playerName || t('result.anonymous')}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold tabular-nums">{r.score}</p>
            <p className="flex justify-end" aria-label={`${r.stars}/3`}>
              {[0, 1, 2].map((i) => (
                <Star key={i} size={12} aria-hidden="true" className={i < r.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'} />
              ))}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
