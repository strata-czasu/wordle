import type { GameState, KnownLetter } from "@/db";

export type GuessDetail = {
  index: number;
  letters: string;
  correct: KnownLetter[];
  present: KnownLetter[];
  absent: string[];
};

export type GameDetail = {
  id: number;
  state: GameState;
  guesses: GuessDetail[];
};

export type User = {
  id: string;
  username: string;
  globalName: string | null;
  avatarURL: string;
};

/**
 * Other player's game with redacted details
 */
export type SocialGameDetail = {
  id: number;
  createdAt: Date;
  updatedAt: Date | null;
  userId: string;
  user: User;
  guildId: string;
  state: GameState;
  guesses: RedactedGuess[];
};

export enum LetterState {
  ABSENT = 0,
  PRESENT = 1,
  CORRECT = 2,
}

/**
 * Guess of another player - only states are known, letters are redacted
 */
export type RedactedGuess = {
  index: number;
  states: LetterState[];
};
