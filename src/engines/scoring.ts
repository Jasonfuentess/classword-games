import type { Difficulty, GameOutcome, GameType } from '../types/activity';

export const MAX_SCORE = 1000;
const SPEED_SHARE = 300;
const HINT_PENALTY = 75;
const WORDSEARCH_ERROR_PENALTY = 15;

export interface ScoreInput extends GameOutcome {
  gameType: GameType;
  difficulty: Difficulty;
  timerEnabled: boolean;
  /** Number of words (word search) — used to compute a fair target time. */
  itemCount: number;
  /** Allowed errors (hangman). */
  maxErrors: number;
}

export interface ScoreBreakdown {
  base: number;
  speedBonus: number;
  errorPenalty: number;
  hintPenalty: number;
  total: number;
  maxScore: number;
  stars: number;
}

export function targetTimeSec(gameType: GameType, difficulty: Difficulty, itemCount: number): number {
  if (gameType === 'hangman') return { easy: 90, medium: 60, hard: 45 }[difficulty];
  const perWord = { easy: 25, medium: 20, hard: 15 }[difficulty];
  return 15 + perWord * Math.max(1, itemCount);
}

/**
 * Normalized score out of 1000.
 * - Without timer: up to 1000 points for solving.
 * - With timer: 700 for solving + up to 300 speed bonus (full bonus at or under the
 *   target time, linearly decreasing to 0 at three times the target).
 * - Errors and hints subtract points; the score never goes below 0.
 */
export function computeScore(input: ScoreInput): ScoreBreakdown {
  const solveShare = input.timerEnabled ? MAX_SCORE - SPEED_SHARE : MAX_SCORE;
  const progress = Math.min(1, Math.max(0, input.progress));
  const base = input.gameType === 'hangman' ? (input.completed ? solveShare : 0) : solveShare * progress;

  let errorPenalty: number;
  if (input.gameType === 'hangman') {
    errorPenalty = input.completed ? (solveShare * 0.5 * input.errors) / Math.max(1, input.maxErrors) : 0;
  } else {
    errorPenalty = Math.min(solveShare * 0.3, WORDSEARCH_ERROR_PENALTY * input.errors);
  }

  let speedBonus = 0;
  if (input.timerEnabled && input.completed && !input.timedOut) {
    const target = targetTimeSec(input.gameType, input.difficulty, input.itemCount);
    const ratio = (input.elapsedSec - target) / (2 * target);
    speedBonus = SPEED_SHARE * Math.min(1, Math.max(0, 1 - ratio));
  }

  const hintPenalty = HINT_PENALTY * input.hintsUsed;
  const total = Math.round(Math.min(MAX_SCORE, Math.max(0, base - errorPenalty + speedBonus - hintPenalty)));
  const stars = !input.completed ? (total > 0 ? 1 : 0) : total >= 850 ? 3 : total >= 550 ? 2 : 1;
  return {
    base: Math.round(base),
    speedBonus: Math.round(speedBonus),
    errorPenalty: Math.round(errorPenalty),
    hintPenalty,
    total,
    maxScore: MAX_SCORE,
    stars,
  };
}
