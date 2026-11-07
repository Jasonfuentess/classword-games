export type GameType = 'wordsearch' | 'hangman';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ContentLanguage = 'en' | 'es';
export type GridSizeOption = 'auto' | 10 | 12 | 15 | 20;

export interface ActivityCommon {
  id: string;
  title: string;
  instructions: string;
  language: ContentLanguage;
  difficulty: Difficulty;
  timerEnabled: boolean;
  /** Optional countdown limit in seconds; 0 means the timer only counts up. */
  timeLimitSec: number;
  hintsEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WordSearchSettings {
  words: string[];
  gridSize: GridSizeOption;
  allowDiagonal: boolean;
  allowReverse: boolean;
  clue: string;
  showWordList: boolean;
  /** Seed for the deterministic generator, so shared links rebuild the exact same grid. */
  seed: number;
}

export interface HangmanSettings {
  secret: string;
  hint: string;
  maxErrors: number;
  /** Preset category id the secret was taken from, or null for custom content. */
  category: string | null;
}

export interface WordSearchActivity extends ActivityCommon {
  type: 'wordsearch';
  wordsearch: WordSearchSettings;
}

export interface HangmanActivity extends ActivityCommon {
  type: 'hangman';
  hangman: HangmanSettings;
}

export type Activity = WordSearchActivity | HangmanActivity;

export interface GameOutcome {
  completed: boolean;
  /** 0..1 fraction of the activity solved. */
  progress: number;
  errors: number;
  hintsUsed: number;
  elapsedSec: number;
  timedOut: boolean;
}

export interface ResultRecord {
  id: string;
  activityKey: string;
  activityTitle: string;
  gameType: GameType;
  playerName: string;
  score: number;
  maxScore: number;
  stars: number;
  completed: boolean;
  errors: number;
  hintsUsed: number;
  elapsedSec: number;
  playedAt: number;
}
