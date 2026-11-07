import { useCallback, useMemo, useRef, useState } from 'react';
import { Maximize, Minimize, RotateCcw, Target, XCircle } from 'lucide-react';
import type { Activity, ResultRecord } from '../types/activity';
import { generateWordSearch } from '../engines/wordsearch';
import { computeScore, type ScoreBreakdown } from '../engines/scoring';
import { useI18n } from '../i18n/useI18n';
import { addResult, bestScoreFor } from '../storage/results';
import { readJson, writeJson } from '../storage/storage';
import { celebrate } from '../services/celebrate';
import { playSound } from '../services/sound';
import { useFullscreen } from '../hooks/useFullscreen';
import { newId } from '../utils/random';
import { IconButton } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Dialog';
import { ProgressBar, Stat } from '../components/ui/misc';
import { GameIcon } from '../components/GameIcon';
import { ActivityIntro } from './ActivityIntro';
import { GameClock } from './GameClock';
import { ResultPanel } from './ResultPanel';
import { WordSearchGame } from './wordsearch/WordSearchGame';
import { HangmanGame } from './hangman/HangmanGame';
import type { GameStats } from './types';
import { LinkError } from '../components/LinkError';

type Phase = 'intro' | 'playing' | 'finished';

interface Outcome {
  won: boolean;
  timedOut: boolean;
  record: ResultRecord;
  breakdown: ScoreBreakdown;
  progress: number;
  saved: boolean;
}

interface ActivityPlayerProps {
  activity: Activity;
  /** Stable key used to group local results for the same activity. */
  activityKey: string;
  /** Preview mode never saves results. */
  preview?: boolean;
}

const NAME_KEY = 'cwg.playerName';
const EMPTY_STATS: GameStats = { progress: 0, errors: 0, hintsUsed: 0 };

export function ActivityPlayer({ activity, activityKey, preview = false }: ActivityPlayerProps) {
  const { t } = useI18n();
  const fullscreen = useFullscreen();
  const [phase, setPhase] = useState<Phase>('intro');
  const [runId, setRunId] = useState(0);
  const [playerName, setPlayerName] = useState(() => readJson<string>(NAME_KEY, ''));
  const [stats, setStats] = useState<GameStats>(EMPTY_STATS);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const statsRef = useRef<GameStats>(EMPTY_STATS);
  const phaseRef = useRef<Phase>('intro');

  const puzzleResult = useMemo(
    () =>
      activity.type === 'wordsearch'
        ? generateWordSearch({ ...activity.wordsearch, difficulty: activity.difficulty, language: activity.language })
        : null,
    [activity],
  );

  const best = useMemo(() => (preview ? null : bestScoreFor(activityKey)), [activityKey, preview, outcome]); // eslint-disable-line react-hooks/exhaustive-deps

  const begin = () => {
    statsRef.current = EMPTY_STATS;
    setStats(EMPTY_STATS);
    setOutcome(null);
    setStartedAt(Date.now());
    setRunId((r) => r + 1);
    phaseRef.current = 'playing';
    setPhase('playing');
  };

  const handleStats = useCallback((next: GameStats) => {
    statsRef.current = next;
    setStats(next);
  }, []);

  const finish = useCallback(
    (won: boolean, timedOut: boolean) => {
      if (phaseRef.current !== 'playing') return;
      phaseRef.current = 'finished';
      const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
      const s = statsRef.current;
      const progress = won ? 1 : s.progress;
      const breakdown = computeScore({
        gameType: activity.type,
        difficulty: activity.difficulty,
        timerEnabled: activity.timerEnabled,
        itemCount: activity.type === 'wordsearch' ? activity.wordsearch.words.length : 1,
        maxErrors: activity.type === 'hangman' ? activity.hangman.maxErrors : 0,
        completed: won,
        progress,
        errors: s.errors,
        hintsUsed: s.hintsUsed,
        elapsedSec,
        timedOut,
      });
      const record: ResultRecord = {
        id: newId(),
        activityKey,
        activityTitle: activity.title,
        gameType: activity.type,
        playerName,
        score: breakdown.total,
        maxScore: breakdown.maxScore,
        stars: breakdown.stars,
        completed: won,
        errors: s.errors,
        hintsUsed: s.hintsUsed,
        elapsedSec,
        playedAt: Date.now(),
      };
      if (!preview) addResult(record);
      setOutcome({ won, timedOut, record, breakdown, progress, saved: !preview });
      setPhase('finished');
      if (won) {
        playSound('win');
        celebrate();
      } else {
        playSound('lose');
      }
    },
    [activity, activityKey, playerName, preview, startedAt],
  );

  const handleComplete = useCallback((won: boolean) => finish(won, false), [finish]);

  if (puzzleResult && !puzzleResult.ok) return <LinkError reason="generate" />;

  if (phase === 'intro') {
    return (
      <ActivityIntro
        activity={activity}
        bestScore={best}
        initialName={playerName}
        onStart={(name) => {
          setPlayerName(name);
          if (!preview) writeJson(NAME_KEY, name);
          begin();
        }}
      />
    );
  }

  const finished = phase === 'finished';
  const total = activity.type === 'wordsearch' ? activity.wordsearch.words.length : 0;

  return (
    <div className="space-y-5">
      {finished && outcome && (
        <ResultPanel
          activity={activity}
          record={outcome.record}
          breakdown={outcome.breakdown}
          won={outcome.won}
          timedOut={outcome.timedOut}
          progress={outcome.progress}
          saved={outcome.saved}
          onRestart={begin}
          hideHomeLink={preview}
        />
      )}

      <div className="card flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 flex-1 basis-[60%] items-center gap-3 sm:basis-auto">
          <GameIcon type={activity.type} size="sm" />
          <h1 className="truncate text-lg font-bold">{activity.title}</h1>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:order-1">
          <IconButton
            label={t('game.restart')}
            icon={RotateCcw}
            data-testid="restart-game"
            onClick={() => (finished || (stats.progress === 0 && stats.errors === 0) ? begin() : setConfirmRestart(true))}
          />
          {fullscreen.supported && (
            <IconButton
              label={fullscreen.active ? t('common.exitFullscreen') : t('common.fullscreen')}
              icon={fullscreen.active ? Minimize : Maximize}
              onClick={fullscreen.toggle}
            />
          )}
        </div>
        {activity.timerEnabled && (
          <GameClock key={runId} startedAt={startedAt} running={!finished} limitSec={activity.timeLimitSec} onTimeUp={() => finish(false, true)} />
        )}
        <Stat
          icon={Target}
          label={t('game.progress')}
          value={
            <span data-testid="game-progress">
              {activity.type === 'wordsearch' ? `${Math.round(stats.progress * total)}/${total}` : `${Math.round(stats.progress * 100)}%`}
            </span>
          }
          tone="teal"
        />
        <Stat icon={XCircle} label={t('game.errors')} value={<span data-testid="game-errors">{stats.errors}</span>} tone="rose" />
        <div className="order-last basis-full">
          <ProgressBar value={stats.progress} label={t('game.progress')} />
        </div>
      </div>

      {activity.type === 'wordsearch' && puzzleResult?.ok ? (
        <WordSearchGame
          key={runId}
          activity={activity}
          puzzle={puzzleResult.puzzle}
          finished={finished}
          onStats={handleStats}
          onComplete={handleComplete}
        />
      ) : activity.type === 'hangman' ? (
        <HangmanGame key={runId} activity={activity} finished={finished} onStats={handleStats} onComplete={handleComplete} />
      ) : null}

      <ConfirmDialog
        open={confirmRestart}
        title={t('game.restart')}
        body={t('game.restartConfirm')}
        confirmLabel={t('game.restart')}
        onCancel={() => setConfirmRestart(false)}
        onConfirm={() => {
          setConfirmRestart(false);
          begin();
        }}
      />
    </div>
  );
}
