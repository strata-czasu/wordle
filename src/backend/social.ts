import { LetterState, type RedactedGuess, type SocialGameDetail } from "@/api/types";
import { type Guess, prisma } from "@/db";
import type { GameWithGuesses } from "@/db/game";
import type { BunRequest } from "bun";
import { endOfDay, startOfToday } from "date-fns";
import { authenticateRequest } from "./util";

function serializeSocialGame(game: GameWithGuesses): SocialGameDetail {
  return {
    id: game.id,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    userId: game.userId,
    state: game.state,
    guesses: game.guesses.map(serializeRedactedGuess),
  };
}

function serializeRedactedGuess(guess: Guess): RedactedGuess {
  const states: LetterState[] = [];

  for (const [idx, letter] of Array.from(guess.letters).entries()) {
    const isCorrect = guess.correct.some(
      (c) => c.letter === letter && c.position === idx,
    );
    if (isCorrect) {
      states.push(LetterState.CORRECT);
      continue;
    }

    const isPresent = guess.present.some(
      (c) => c.letter === letter && c.position === idx,
    );
    if (isPresent) {
      states.push(LetterState.PRESENT);
      continue;
    }

    states.push(LetterState.ABSENT);
  }

  return { index: guess.index, states };
}

export const socialApi = {
  "/api/social/games": {
    async GET(req: BunRequest<"/api/social/games">): Promise<Response> {
      const { guildId } = await authenticateRequest(req);

      const todayStart = startOfToday();
      const todayEnd = endOfDay(todayStart);

      const games = await prisma.game.findMany({
        where: {
          guildId,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        include: { guesses: true },
      });

      return Response.json(games.map(serializeSocialGame));
    },
  },
};
