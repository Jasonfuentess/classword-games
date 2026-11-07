import type { Activity, ContentLanguage, Difficulty, GameType, HangmanActivity, WordSearchActivity } from '../types/activity';
import { newId, newSeed } from '../utils/random';

export const DEFAULT_MAX_ERRORS: Record<Difficulty, number> = { easy: 8, medium: 6, hard: 4 };

export function createActivity(type: GameType, language: ContentLanguage): Activity {
  const now = Date.now();
  const common = {
    id: newId(),
    title: '',
    instructions: '',
    language,
    difficulty: 'easy' as Difficulty,
    timerEnabled: true,
    timeLimitSec: 0,
    hintsEnabled: true,
    createdAt: now,
    updatedAt: now,
  };
  if (type === 'wordsearch') {
    const ws: WordSearchActivity = {
      ...common,
      type,
      wordsearch: { words: [], gridSize: 'auto', allowDiagonal: false, allowReverse: false, clue: '', showWordList: true, seed: newSeed() },
    };
    return ws;
  }
  const hm: HangmanActivity = {
    ...common,
    type,
    hangman: { secret: '', hint: '', maxErrors: DEFAULT_MAX_ERRORS.easy, category: null },
  };
  return hm;
}

export function duplicateActivity(activity: Activity, titleSuffix: string): Activity {
  const now = Date.now();
  const copy = structuredClone(activity);
  copy.id = newId();
  copy.title = `${activity.title} ${titleSuffix}`.slice(0, 80);
  copy.createdAt = now;
  copy.updatedAt = now;
  return copy;
}

/** Converts an activity into a different game type, keeping the shared fields. */
export function switchGameType(activity: Activity, type: GameType): Activity {
  if (activity.type === type) return activity;
  const fresh = createActivity(type, activity.language);
  return {
    ...fresh,
    id: activity.id,
    title: activity.title,
    instructions: activity.instructions,
    difficulty: activity.difficulty,
    timerEnabled: activity.timerEnabled,
    timeLimitSec: activity.timeLimitSec,
    hintsEnabled: activity.hintsEnabled,
    createdAt: activity.createdAt,
  } as Activity;
}
