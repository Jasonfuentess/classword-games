import { useEffect, useRef, useState } from 'react';
import { Clock, Hourglass } from 'lucide-react';
import { Stat } from '../components/ui/misc';
import { useI18n } from '../i18n/useI18n';
import { formatTime } from '../utils/format';

interface GameClockProps {
  startedAt: number;
  running: boolean;
  limitSec: number;
  onTimeUp: () => void;
}

/** Owns its own ticking so the game board doesn't re-render every second. */
export function GameClock({ startedAt, running, limitSec, onTimeUp }: GameClockProps) {
  const { t } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  });

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (limitSec > 0 && (current - startedAt) / 1000 >= limitSec) onTimeUpRef.current();
    }, 250);
    return () => window.clearInterval(id);
  }, [running, startedAt, limitSec]);

  const elapsed = Math.max(0, (now - startedAt) / 1000);
  if (limitSec > 0) {
    const left = Math.max(0, limitSec - elapsed);
    return <Stat icon={Hourglass} label={t('game.timeLeft')} value={<span className={left < 15 ? 'text-rose-500' : undefined}>{formatTime(left)}</span>} tone="violet" />;
  }
  return <Stat icon={Clock} label={t('game.time')} value={<span data-testid="game-time">{formatTime(elapsed)}</span>} tone="violet" />;
}
