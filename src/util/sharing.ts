import { WORDLE_ATTEMPTS } from "@/constants";
import type { KnownLetter } from "@/db";

type PartialGuess = {
  letters: string;
  correct: KnownLetter[];
  present: KnownLetter[];
};

export function getShareText(guesses: PartialGuess[]): string {
  const lines: string[] = [`Wordle (${guesses.length}/${WORDLE_ATTEMPTS})`];

  for (const guess of guesses) {
    const line: string[] = [];
    for (const [idx, letter] of Array.from(guess.letters).entries()) {
      const isCorrect = guess.correct.some(
        (c) => c.letter === letter && c.position === idx,
      );
      if (isCorrect) {
        line.push("🟩");
        continue;
      }

      const isPresent = guess.present.some(
        (c) => c.letter === letter && c.position === idx,
      );
      if (isPresent) {
        line.push("🟨");
        continue;
      }

      line.push("⬜");
    }
    lines.push(line.join(""));
  }

  return lines.join("\n");
}
