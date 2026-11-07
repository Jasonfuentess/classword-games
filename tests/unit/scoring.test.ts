import { describe, expect, it } from 'vitest';
import { computeScore, MAX_SCORE, targetTimeSec, type ScoreInput } from '../../src/engines/scoring';

const ws: ScoreInput = {
  gameType: 'wordsearch',
  difficulty: 'easy',
  timerEnabled: false,
  itemCount: 8,
  maxErrors: 0,
  completed: true,
  progress: 1,
  errors: 0,
  hintsUsed: 0,
  elapsedSec: 60,
  timedOut: false,
};

describe('scoring', () => {
  it('gives the full score for a perfect game without timer', () => {
    expect(computeScore(ws).total).toBe(MAX_SCORE);
    expect(computeScore(ws).stars).toBe(3);
  });

  it('adds a speed bonus only when the timer is on', () => {
    const target = targetTimeSec('wordsearch', 'easy', 8);
    const fast = computeScore({ ...ws, timerEnabled: true, elapsedSec: target - 10 });
    expect(fast.speedBonus).toBe(300);
    expect(fast.total).toBe(1000);
    const slow = computeScore({ ...ws, timerEnabled: true, elapsedSec: target * 10 });
    expect(slow.speedBonus).toBe(0);
    expect(slow.total).toBe(700);
    const middle = computeScore({ ...ws, timerEnabled: true, elapsedSec: target * 2 });
    expect(middle.speedBonus).toBe(150);
  });

  it('penalizes hints and errors', () => {
    expect(computeScore({ ...ws, hintsUsed: 2 }).total).toBe(850);
    expect(computeScore({ ...ws, errors: 4 }).total).toBe(940);
  });

  it('scores partial progress when not completed', () => {
    const r = computeScore({ ...ws, completed: false, progress: 0.5 });
    expect(r.total).toBe(500);
    expect(r.stars).toBe(1);
  });

  it('never goes below zero', () => {
    expect(computeScore({ ...ws, completed: false, progress: 0, hintsUsed: 10, errors: 50 }).total).toBe(0);
  });

  it('scores hangman by errors used', () => {
    const hm: ScoreInput = { ...ws, gameType: 'hangman', maxErrors: 6, itemCount: 1 };
    expect(computeScore(hm).total).toBe(1000);
    expect(computeScore({ ...hm, errors: 3 }).total).toBe(750);
    expect(computeScore({ ...hm, completed: false, progress: 0.8, errors: 6 }).total).toBe(0);
  });

  it('gives no speed bonus on timeout', () => {
    expect(computeScore({ ...ws, timerEnabled: true, timedOut: true, completed: false, progress: 1 }).speedBonus).toBe(0);
  });
});
