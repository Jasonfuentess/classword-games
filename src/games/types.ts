export interface GameStats {
  progress: number;
  errors: number;
  hintsUsed: number;
}

export interface GameComponentProps<A> {
  activity: A;
  finished: boolean;
  onStats: (stats: GameStats) => void;
  /** Called once when the player solves (`true`) or loses (`false`) the game. */
  onComplete: (won: boolean) => void;
}
