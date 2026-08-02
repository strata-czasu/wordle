import { LetterState, type RedactedGuess, type User } from "@/api/types";
import { MOCK_USER_ID } from "@/constants";
import { type Guess, prisma } from "@/db";
import env from "@/env";
import { REST } from "@discordjs/rest";
import type { BunRequest } from "bun";
import { endOfDay, startOfToday } from "date-fns";
import {
  CDNRoutes,
  ImageFormat,
  type RESTGetAPIUserResult,
  RouteBases,
  Routes,
} from "discord-api-types/v10";
import { authenticateRequest } from "./util";

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

async function getUser(userId: string): Promise<User> {
  if (userId === MOCK_USER_ID) {
    return {
      id: MOCK_USER_ID,
      username: "mock",
      globalName: "Mock User",
      avatarURL: RouteBases.cdn + CDNRoutes.defaultUserAvatar(0),
    } as User;
  }

  const rest = new REST().setToken(env.WORDLE_BOT_TOKEN);
  try {
    const rawUser = await (rest.get(
      Routes.user(userId),
    ) as Promise<RESTGetAPIUserResult>);
    const avatarPath = rawUser.avatar
      ? CDNRoutes.userAvatar(userId, rawUser.avatar, ImageFormat.PNG)
      : CDNRoutes.defaultUserAvatar(1);
    return {
      id: rawUser.id,
      username: rawUser.username,
      globalName: rawUser.global_name,
      avatarURL: RouteBases.cdn + avatarPath,
    };
  } catch (e) {
    console.error(`Error fetching user ${userId}`, e);
    return {
      id: userId,
      username: "unknown",
      globalName: "Unknown User",
      avatarURL: RouteBases.cdn + CDNRoutes.defaultUserAvatar(1),
    };
  }
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

      const gamesWithUsers = await Promise.all(
        games.map(async (game) => {
          const user = await getUser(game.userId);
          return { ...game, user };
        }),
      );

      return Response.json(
        gamesWithUsers.map((game) => ({
          id: game.id,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt,
          userId: game.userId,
          user: game.user,
          guildId: game.guildId,
          state: game.state,
          guesses: game.guesses.map(serializeRedactedGuess),
        })),
      );
    },
  },
};
