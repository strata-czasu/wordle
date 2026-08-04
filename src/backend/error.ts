import type { GameState } from "@/db";

export abstract class ApiError extends Error {
  abstract status: number;
  abstract json(): object;
}

export class AuthTokenExchangeError extends ApiError {
  constructor(readonly status: number) {
    super();
  }

  json() {
    return { message: "Failed to exchange Discord authorization code for token" };
  }
}

export class NotFoundError extends ApiError {
  status = 404;

  json() {
    return { message: "Not found" };
  }
}

export class UnauthorizedError extends ApiError {
  status = 401;

  json() {
    return { message: "Unauthorized" };
  }
}

export class GameAlreadyFinishedError extends ApiError {
  status = 400;

  constructor(
    readonly gameId: number,
    readonly gameState: GameState,
  ) {
    super();
  }

  json() {
    return {
      message: "Game is already finished",
      gameId: this.gameId,
      gameState: this.gameState,
    };
  }
}
