import type { GameDetail } from "./types";
import { getAuthHeaders } from "./util";

export async function getCurrentGame(accessToken: string) {
  const res = await fetch("/api/game/current", {
    headers: getAuthHeaders(accessToken),
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status !== 200) throw new Error("Failed to fetch game");

  return res.json() as Promise<GameDetail>;
}

export async function submitGuess(accessToken: string, guess: string) {
  const res = await fetch("/api/game/guess", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders(accessToken) },
    body: JSON.stringify({ guess }),
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Game not found");
  // TODO)) Invalid guess handling
  if (res.status === 400) throw new Error("Game already finished");
  if (res.status !== 200) throw new Error("Failed to submit guess");

  return res.json() as Promise<GameDetail>;
}
