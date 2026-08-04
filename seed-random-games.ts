import { getCurrentGame } from "@/backend/game";
import {
  type ValidationResult,
  getRandomWord,
  validateGuess,
} from "@/backend/validation";
import { prisma } from "@/db";
import allWords from "@/frontend/valid_words.json" with { type: "json" };

const isProduction = process.env.NODE_ENV === "production";

async function createRandomGames(guildId: string, userIds: string[]) {
  for (const userId of userIds) {
    const currentGame = await getCurrentGame(userId, guildId);
    if (currentGame) {
      console.log(`User ${userId} already has a current game`);
      continue;
    }

    const solution = await getRandomWord(userId, guildId);

    // Create 2..6 random guesses and validate them
    const guessNum = Math.floor(Math.random() * (6 - 2 + 1)) + 2;
    const guesses: [string, ValidationResult][] = [];
    for (let i = 0; i < guessNum; i++) {
      const guess = allWords[Math.floor(Math.random() * allWords.length)];
      if (!guess) continue;
      const validatedGuess = validateGuess(guess, solution);
      guesses.push([guess, validatedGuess]);
    }

    const lastGuess = guesses.at(-1);
    if (!lastGuess) continue;

    const game = await prisma.game.create({
      data: {
        userId,
        guildId,
        solution,
        // NOTE: State is not calculated correctly here
        guesses: {
          createMany: {
            data: guesses.map(([letters, { correct, present, absent }], index) => ({
              index,
              letters,
              correct,
              present,
              absent: Array.from(absent),
            })),
          },
        },
      },
      include: { guesses: true },
    });

    console.log(`Created game for user ${userId}:`, game.id);
  }
}

const USAGE = "Usage: bun seed-random-games <guildId> [userId...]";

if (isProduction) {
  console.warn("Not seeding random games in production");
} else {
  const guildId = process.argv[2];
  if (!guildId) {
    console.error("Guild ID is required");
    console.error(USAGE);
    process.exit(1);
  }

  const userIds: string[] = [];
  for (let i = 3; i < process.argv.length; i++) {
    const userId = process.argv[i];
    if (userId) userIds.push(userId);
  }
  if (userIds.length === 0) {
    console.error("No user IDs provided");
    console.error(USAGE);
    process.exit(1);
  }

  await createRandomGames(guildId, userIds);
}

await prisma.$disconnect();
